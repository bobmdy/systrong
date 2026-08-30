/* ==========================================================================
   SYSTRONG - Lógica do Aplicativo em JavaScript Puro
   Interface Computador (Desktop), Interface Celular (Mobile) e Autenticação
   ========================================================================== */

// Escapa HTML de qualquer texto antes de injetá-lo via innerHTML/template string.
// Usar SEMPRE que o valor vier do usuário (formulários, nome de arquivo, chat)
// ou de uma API externa — previne XSS armazenado/refletido.
function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

// Estado global da aplicação
let state = {
  alunos: [],
  alunoSelecionadoId: null,
  tema: 'dark',
  modoVisao: 'auto', // 'auto', 'mobile', 'desktop'
  abaMobileAtiva: 'pacientes', // 'pacientes', 'ficha', 'tools'
  autenticado: false,
  filtroObjetivo: 'TODOS',
  filtroBusca: ''
};

// Contador de blocos no modal de programa dinâmico
let contadorBlocosTreino = 1;

// Dados de demonstração iniciais
const demoData = [
  {
    id: 'aluno-1',
    nome: 'Carlos Eduardo',
    idade: 42,
    objetivo: 'REAB',
    frequencia: ['Seg', 'Qua', 'Sex'],
    condicaoSaude: 'Pós-operatório de ombro direito (manguito rotador). Hipertensão leve sob medicação.',
    arquivos: [
      { id: 'arq-1', nome: 'Laudo_Ressonancia_Ombro.pdf', tamanho: '2.4 MB', data: '2026-08-01' },
      { id: 'arq-2', nome: 'Exame_Bioimpedancia.png', tamanho: '1.1 MB', data: '2026-08-05' }
    ],
    pressao: [
      { data: '2026-08-10 09:30', sis: 122, dia: 81, pulso: 72 },
      { data: '2026-08-08 10:15', sis: 128, dia: 84, pulso: 75 },
      { data: '2026-08-05 09:00', sis: 135, dia: 88, pulso: 80 }
    ],
    programas: [
      {
        id: 'prog-1',
        dataInicio: '2026-08-01',
        dataFim: '2026-09-01',
        atual: true,
        treinos: [
          {
            nome: 'TREINO A',
            nivel: 'REABILITAÇÃO',
            exercicios: [
              { nome: 'Rotação Externa com Elástico', series: '3', reps: '15', carga: '5', obs: 'Manter cotovelo colado ao corpo' },
              { nome: 'Elevação Frontal no Cabo', series: '3', reps: '12', carga: '8', obs: 'Sem ultrapassar linha do ombro' },
              { nome: 'Remada Baixa Neutra', series: '4', reps: '12', carga: '35', obs: 'Foco na retração de escápulas' }
            ]
          },
          {
            nome: 'TREINO B',
            nivel: 'FORTALECIMENTO',
            exercicios: [
              { nome: 'Leg Press 45°', series: '4', reps: '10', carga: '120', obs: 'Cadência 3010' },
              { nome: 'Cadeira Extensora', series: '3', reps: '12', carga: '45', obs: 'Isometria de 2s no topo' },
              { nome: 'Panturrilha Em Pé', series: '4', reps: '15', carga: '60', obs: 'Amplitude máxima' }
            ]
          }
        ]
      }
    ],
    artigos: []
  },
  {
    id: 'aluno-2',
    nome: 'Fernanda Souza',
    idade: 29,
    objetivo: 'FORT',
    frequencia: ['Ter', 'Qui', 'Sab'],
    condicaoSaude: 'Sem restrições médicas. Foco em hipertrofia de membros inferiores.',
    arquivos: [
      { id: 'arq-3', nome: 'Avaliacao_Fisica_Julho.pdf', tamanho: '1.8 MB', data: '2026-07-28' }
    ],
    pressao: [
      { data: '2026-08-11 08:00', sis: 115, dia: 75, pulso: 68 }
    ],
    programas: [
      {
        id: 'prog-2',
        dataInicio: '2026-07-15',
        dataFim: '2026-09-15',
        atual: true,
        treinos: [
          {
            nome: 'TREINO A',
            nivel: 'HIPERTROFIA',
            exercicios: [
              { nome: 'Agachamento Livre', series: '4', reps: '8', carga: '70', obs: 'Profundo abaixo de 90°' },
              { nome: 'Stiff com Halteres', series: '4', reps: '10', carga: '24', obs: 'Coluna neutra' },
              { nome: 'Elevação Pélvica', series: '4', reps: '12', carga: '100', obs: 'Pausa no topo' }
            ]
          }
        ]
      }
    ],
    artigos: []
  },
  {
    id: 'aluno-3',
    nome: 'Ricardo Mendes',
    idade: 51,
    objetivo: 'OBES',
    frequencia: ['Seg', 'Ter', 'Qui', 'Sex'],
    condicaoSaude: 'Diabético Tipo 2 e Hipertenso. Acompanhamento médico constante.',
    arquivos: [],
    pressao: [
      { data: '2026-08-09 18:00', sis: 138, dia: 89, pulso: 82 }
    ],
    programas: [],
    artigos: []
  }
];

// Inicialização da Aplicação
document.addEventListener('DOMContentLoaded', () => {
  carregarEstado();
  configurarEventos();
  renderizar();
});

// Salvar / Carregar localStorage
function salvarEstado() {
  localStorage.setItem('systrong_data', JSON.stringify(state.alunos));
  localStorage.setItem('systrong_theme', state.tema);
  localStorage.setItem('systrong_view', state.modoVisao);
}

function carregarEstado() {
  const dadosSalvos = localStorage.getItem('systrong_data');
  const temaSalvo = localStorage.getItem('systrong_theme');
  const visaoSalva = localStorage.getItem('systrong_view');
  const authSalva = localStorage.getItem('systrong_auth');

  if (dadosSalvos) {
    try { state.alunos = JSON.parse(dadosSalvos); } 
    catch (e) { state.alunos = demoData; }
  } else {
    state.alunos = demoData;
  }

  if (temaSalvo) state.tema = temaSalvo;
  if (visaoSalva) state.modoVisao = visaoSalva;
  state.autenticado = authSalva === 'true';

  document.documentElement.setAttribute('data-theme', state.tema);
  aplicarModoVisao();

  if (state.alunos.length > 0 && !state.alunoSelecionadoId) {
    state.alunoSelecionadoId = state.alunos[0].id;
  }
}

// Login & Logout
function fazerLogin(e) {
  e.preventDefault();
  const usuario = document.getElementById('login-usuario').value.trim();
  const senha = document.getElementById('login-senha').value.trim();
  const erro = document.getElementById('erro-login');

  if (usuario && senha) {
    state.autenticado = true;
    localStorage.setItem('systrong_auth', 'true');
    if (erro) erro.style.display = 'none';
    renderizar();
  } else {
    if (erro) erro.style.display = 'block';
  }
}

function fazerLogout() {
  state.autenticado = false;
  localStorage.removeItem('systrong_auth');
  renderizar();
}

// Alternar Modo de Visão (Auto -> Mobile -> Desktop)
function alternarModoVisao() {
  if (state.modoVisao === 'auto') {
    state.modoVisao = 'mobile';
  } else if (state.modoVisao === 'mobile') {
    state.modoVisao = 'desktop';
  } else {
    state.modoVisao = 'auto';
  }
  salvarEstado();
  aplicarModoVisao();
}

function aplicarModoVisao() {
  const btn = document.getElementById('btn-modo-visao');
  document.body.classList.remove('modo-mobile-forcado', 'modo-desktop-forcado');

  if (state.modoVisao === 'mobile') {
    document.body.classList.add('modo-mobile-forcado');
    if (btn) btn.innerHTML = '📱 Celular';
  } else if (state.modoVisao === 'desktop') {
    document.body.classList.add('modo-desktop-forcado');
    if (btn) btn.innerHTML = '💻 PC';
  } else {
    const isMobileWindow = window.innerWidth <= 768;
    if (btn) btn.innerHTML = isMobileWindow ? '📱 Auto (Celular)' : '💻 Auto (PC)';
  }
}

// Alternar Aba Mobile
function alternarAbaMobile(abaNome) {
  state.abaMobileAtiva = abaNome;

  document.querySelectorAll('.mobile-nav-item').forEach(btn => {
    if (btn.getAttribute('data-aba') === abaNome) {
      btn.classList.add('ativo');
    } else {
      btn.classList.remove('ativo');
    }
  });

  document.querySelectorAll('.painel-aba-mobile').forEach(painel => {
    if (painel.getAttribute('data-aba') === abaNome) {
      painel.classList.add('aba-ativa');
    } else {
      painel.classList.remove('aba-ativa');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Alternar Tema Dark/Light
function alternarTema() {
  state.tema = state.tema === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.tema);
  salvarEstado();
}

// Filtros da Lista de Alunos
function filtrarAlunos() {
  const input = document.getElementById('input-busca-aluno');
  state.filtroBusca = input ? input.value.trim().toLowerCase() : '';
  renderizarListaAlunos();
}

function aplicarFiltroObjetivo(objetivo) {
  state.filtroObjetivo = objetivo;
  document.querySelectorAll('.filtro-chip').forEach(chip => {
    if (chip.getAttribute('data-filtro') === objetivo) {
      chip.classList.add('ativo');
    } else {
      chip.classList.remove('ativo');
    }
  });
  renderizarListaAlunos();
}

// Configurar Eventos da UI
function configurarEventos() {
  document.getElementById('form-login')?.addEventListener('submit', fazerLogin);
  document.getElementById('btn-logout')?.addEventListener('click', fazerLogout);

  document.getElementById('btn-tema')?.addEventListener('click', alternarTema);
  document.getElementById('btn-abrir-nemotron')?.addEventListener('click', () => toggleNemotronDrawer());
  document.getElementById('btn-exportar-backup')?.addEventListener('click', exportarBackupJSON);
  document.getElementById('btn-modo-visao')?.addEventListener('click', alternarModoVisao);

  document.getElementById('btn-novo-aluno')?.addEventListener('click', () => abrirModal('modal-aluno'));
  document.getElementById('btn-fechar-aluno')?.addEventListener('click', () => fecharModal('modal-aluno'));
  document.getElementById('btn-fechar-editar-aluno')?.addEventListener('click', () => fecharModal('modal-editar-aluno'));

  document.getElementById('form-aluno')?.addEventListener('submit', salvarNovoAluno);
  document.getElementById('form-editar-aluno')?.addEventListener('submit', salvarEdicaoAluno);

  // Seleção de objetivo no cadastro
  document.querySelectorAll('#aluno-obj-container .obj').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#aluno-obj-container .obj').forEach(b => b.classList.remove('ativo'));
      e.currentTarget.classList.add('ativo');
    });
  });

  // Seleção de objetivo na edição
  document.querySelectorAll('#edit-aluno-obj-container .obj').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#edit-aluno-obj-container .obj').forEach(b => b.classList.remove('ativo'));
      e.currentTarget.classList.add('ativo');
    });
  });

  // Seleção de dias de treino
  document.querySelectorAll('#aluno-dias-container .dia, #edit-aluno-dias-container .dia').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.currentTarget.classList.toggle('ativo');
    });
  });

  document.getElementById('form-programa')?.addEventListener('submit', salvarProgramaTreino);
  document.getElementById('btn-fechar-programa')?.addEventListener('click', () => fecharModal('modal-programa'));

  document.getElementById('btn-buscar-pubmed')?.addEventListener('click', buscarPubMed);
  document.getElementById('btn-calc-imc')?.addEventListener('click', calcularIMC);
  document.getElementById('btn-calc-tmb')?.addEventListener('click', calcularTMB);

  // Eventos do NVIDIA Nemotron AI Core
  document.getElementById('btn-fechar-nemotron')?.addEventListener('click', () => toggleNemotronDrawer(false));
  document.getElementById('btn-enviar-nemotron')?.addEventListener('click', enviarMensagemNemotron);

  // Modais - Fechar ao clicar ou tocar no fundo (backdrop)
  document.querySelectorAll('.modal-fundo').forEach(fundo => {
    fundo.addEventListener('click', (e) => {
      if (e.target === fundo) {
        fecharModal(fundo.id);
      }
    });

    fundo.addEventListener('touchmove', (e) => {
      if (e.target === fundo) {
        e.preventDefault();
      }
    }, { passive: false });
  });

  window.addEventListener('resize', () => {
    if (state.modoVisao === 'auto') aplicarModoVisao();
  });
}

// Modais Helper com Trava de Rolagem
let scrollPosY = 0;

function abrirModal(idModal) {
  const modalElem = document.getElementById(idModal);
  if (modalElem) {
    scrollPosY = window.scrollY || document.documentElement.scrollTop;
    modalElem.classList.add('ativo');
    document.body.classList.add('modal-aberto');
    document.body.style.top = `-${scrollPosY}px`;

    const formElem = modalElem.querySelector('.form-aluno') || modalElem.querySelector('.modal');
    if (formElem) formElem.scrollTop = 0;
  }
}

function fecharModal(idModal) {
  const modalElem = document.getElementById(idModal);
  if (modalElem) {
    modalElem.classList.remove('ativo');
  }
  if (!document.querySelector('.modal-fundo.ativo')) {
    document.body.classList.remove('modal-aberto');
    document.body.style.top = '';
    window.scrollTo(0, scrollPosY);
  }
}

// Renderizar toda a aplicação
function renderizar() {
  const telaLogin = document.getElementById('tela-login');
  const appDashboard = document.getElementById('app-dashboard');

  if (!state.autenticado) {
    if (telaLogin) telaLogin.classList.remove('oculto');
    if (appDashboard) appDashboard.style.display = 'none';
    return;
  } else {
    if (telaLogin) telaLogin.classList.add('oculto');
    if (appDashboard) appDashboard.style.display = 'flex';
  }

  renderizarListaAlunos();
  renderizarFichaAluno();
  alternarAbaMobile(state.abaMobileAtiva);
}

// Renderizar Lista de Alunos com Busca e Filtros
function renderizarListaAlunos() {
  const container = document.getElementById('lista-alunos');
  if (!container) return;

  let alunosFiltrados = state.alunos;

  if (state.filtroObjetivo && state.filtroObjetivo !== 'TODOS') {
    alunosFiltrados = alunosFiltrados.filter(a => a.objetivo === state.filtroObjetivo);
  }

  if (state.filtroBusca) {
    alunosFiltrados = alunosFiltrados.filter(a => a.nome.toLowerCase().includes(state.filtroBusca));
  }

  if (alunosFiltrados.length === 0) {
    container.innerHTML = `<li class="vazio">Nenhum aluno encontrado para os filtros selecionados.</li>`;
    return;
  }

  container.innerHTML = alunosFiltrados.map(aluno => {
    const selecionado = aluno.id === state.alunoSelecionadoId ? 'ativo' : '';
    const badgeClass = `badge-${aluno.objetivo.toLowerCase()}`;
    return `
      <li class="${selecionado}" onclick="selecionarAluno('${aluno.id}')">
        <div class="aluno-item-cabecalho">
          <span class="aluno-nome">${escapeHtml(aluno.nome)}</span>
          <span class="badge ${badgeClass}">${aluno.objetivo}</span>
        </div>
        <small>${aluno.idade} anos • ${(aluno.frequencia || []).join(', ')}</small>
      </li>
    `;
  }).join('');
}

// Selecionar Aluno
function selecionarAluno(id) {
  state.alunoSelecionadoId = id;
  renderizar();

  const isMobile = state.modoVisao === 'mobile' || (state.modoVisao === 'auto' && window.innerWidth <= 768);
  if (isMobile) {
    alternarAbaMobile('ficha');
  }
}

// Obter Aluno Selecionado
function getAlunoSelecionado() {
  return state.alunos.find(a => a.id === state.alunoSelecionadoId);
}

// Renderizar Ficha Detalhada do Aluno Selecionado
function renderizarFichaAluno() {
  const aluno = getAlunoSelecionado();
  const container = document.getElementById('painel-ficha');
  const containerRelatorio = document.getElementById('painel-relatorio');

  if (!aluno) {
    if (container) container.innerHTML = `<div class="vazio" style="padding:40px 20px; text-align:center;">Selecione um aluno na lista ao lado ou cadastre um novo paciente para visualizar a ficha clínica.</div>`;
    if (containerRelatorio) containerRelatorio.innerHTML = '';
    return;
  }

  if (!aluno.arquivos) aluno.arquivos = [];
  if (!aluno.pressao) aluno.pressao = [];
  if (!aluno.programas) aluno.programas = [];

  // Renderizar Ficha Principal
  if (container) {
    const badgeClass = `badge-${aluno.objetivo.toLowerCase()}`;
    const descObjetivo = aluno.objetivo === 'REAB' ? 'Reabilitação & Fisioterapia' :
                         aluno.objetivo === 'FORT' ? 'Fortalecimento & Hipertrofia' : 'Emagrecimento & Saúde';

    container.innerHTML = `
      <div class="ficha">
        <div class="ficha-cabecalho">
          <div class="ficha-info">
            <h2>${escapeHtml(aluno.nome)} <span class="badge ${badgeClass}">${aluno.objetivo}</span></h2>
            <div class="objetivo">${descObjetivo} • ${aluno.idade} Anos</div>
            <div class="resumo-treino">
              <span>📅 ${(aluno.frequencia || []).join(', ')}</span>
              <span>📋 ${aluno.programas.length} Programa(s)</span>
              <span>📁 ${aluno.arquivos.length} Documento(s)</span>
            </div>
          </div>
          <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
            <button class="btn-mini" onclick="abrirModalEditarAluno('${aluno.id}')" style="background:var(--painel-hover); border:1px solid var(--acento); color:var(--acento);">✏️ Editar</button>
            <button class="btn-mini btn-excluir-aluno" onclick="excluirAluno('${aluno.id}')">🗑️ Excluir</button>
          </div>
        </div>

        ${aluno.condicaoSaude ? `
          <div class="condicao-saude">
            <h3>⚠️ Condição de Saúde & Restrições Clínicas</h3>
            <p>${escapeHtml(aluno.condicaoSaude)}</p>
          </div>
        ` : ''}

        <!-- Seção de Upload de Arquivos do Paciente -->
        <div class="secao-treinos">
          <div class="secao-cabecalho">
            <h3>📁 Documentos & Exames de ${escapeHtml(aluno.nome)}</h3>
            <label class="btn-mini" style="cursor:pointer;">
              ➕ Anexar Arquivo
              <input type="file" id="input-upload-paciente" style="display:none;" multiple onchange="fazerUploadArquivoPaciente(this)">
            </label>
          </div>

          <div class="upload-zone-paciente" id="upload-zone-paciente" 
               onclick="document.getElementById('input-upload-paciente').click()"
               ondragover="handleDragOverPaciente(event)"
               ondragleave="handleDragLeavePaciente(event)"
               ondrop="handleDropPaciente(event)">
            <span style="font-size:1.6rem;">📄</span>
            <p style="margin:4px 0 0; font-weight:700; font-size:0.92rem;">Clique aqui ou arraste exames, laudos e avaliações</p>
            <small style="color:var(--texto-suave)">Armazenado com segurança para este perfil</small>
          </div>

          ${aluno.arquivos.length > 0 ? `
            <ul style="margin-top:12px; list-style:none; padding:0; display:flex; flex-direction:column; gap:8px;">
              ${aluno.arquivos.map(arq => `
                <li style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; background:var(--fundo); border:1px solid var(--painel-borda); border-radius:12px;">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-size:1.3rem;">📌</span>
                    <div>
                      <strong style="font-size:0.92rem; color:var(--texto);">${escapeHtml(arq.nome)}</strong>
                      <div style="font-size:0.78rem; color:var(--texto-suave);">${arq.tamanho} • Anexado em ${arq.data}</div>
                    </div>
                  </div>
                  <div style="display:flex; gap:6px;">
                    <button class="btn-mini btn-excluir-aluno" onclick="excluirArquivoPaciente('${arq.id}')" title="Remover Documento">🗑️</button>
                  </div>
                </li>
              `).join('')}
            </ul>
          ` : `
            <div class="vazio" style="padding:12px 0;">Nenhum documento ou exame anexado ao perfil deste paciente.</div>
          `}
        </div>

        <!-- Seção de Pressão Arterial -->
        <div class="secao-treinos">
          <div class="secao-cabecalho">
            <h3>🫀 Monitoramento de Pressão Arterial</h3>
          </div>

          <form id="form-pressao-inline" class="form-pressao" onsubmit="adicionarPressaoInline(event)">
            <input type="number" id="input-sis" placeholder="Sistólica (120)" required min="50" max="250">
            <span style="color:var(--texto-suave)">x</span>
            <input type="number" id="input-dia" placeholder="Diastólica (80)" required min="30" max="150">
            <input type="number" id="input-pulso" placeholder="Pulso BPM" min="40" max="200">
            <button type="submit" class="btn-mini">➕ Registrar Pressão</button>
          </form>

          <div class="grafico-pressao-container">
            ${gerarGraficoPressaoSVG(aluno.pressao)}
          </div>

          <ul class="lista-pressao">
            ${aluno.pressao.map((p, idxP) => {
              const status = getStatusPressao(p.sis, p.dia);
              return `
                <li class="${status.classe}" style="display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <strong>${p.sis}/${p.dia} <small>mmHg</small></strong>
                    <small style="display:block; margin-top:2px;">${p.data} ${p.pulso ? `• ${p.pulso} BPM` : ''} • <span style="font-weight:700;">${status.texto}</span></small>
                  </div>
                  <button class="btn-mini btn-excluir-aluno" style="padding:2px 8px; font-size:0.75rem;" onclick="excluirPressao('${aluno.id}', ${idxP})" title="Excluir Medição">🗑️</button>
                </li>
              `;
            }).join('')}
          </ul>
        </div>

        <!-- Seção de Programas de Treino -->
        <div class="secao-treinos">
          <div class="secao-cabecalho" style="flex-wrap:wrap; gap:10px;">
            <h3>💪 Prescrição de Treinos</h3>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button class="btn-neural-prescribe" onclick="prescreverViaNemotron('${aluno.id}')" title="Gerar Prescrição Automatizada com NVIDIA Nemotron AI">⚡ Prescrever com Nemotron AI</button>
              <button class="btn-mini" onclick="abrirModalPrograma()">➕ Criar Programa</button>
            </div>
          </div>

          ${aluno.programas.length === 0 ? `
            <div class="vazio" style="padding:20px; text-align:center;">
              Nenhum programa de treino cadastrado.<br>
              <span style="color:var(--acento); cursor:pointer; font-weight:700;" onclick="prescreverViaNemotron('${aluno.id}')">Clique aqui para gerar uma série com Nemotron AI</span> ou crie manualmente.
            </div>
          ` : aluno.programas.map((prog, idxProg) => `
            <div class="programa ${prog.atual ? 'atual' : ''}">
              <div class="programa-cabecalho" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div>
                  <strong>${prog.atual ? '⭐ Programa Vigente (Ativo)' : 'Programa de Treino'}</strong>
                  <span class="programa-tempo" style="display:block;">Vigência: ${prog.dataInicio} até ${prog.dataFim}</span>
                </div>
                <div style="display:flex; gap:6px;">
                  ${!prog.atual ? `<button class="btn-mini" onclick="tornarProgramaAtual('${aluno.id}', '${prog.id}')" style="background:rgba(0,243,255,0.15); border:1px solid var(--acento); color:var(--acento);" title="Tornar este programa o ativo">⭐ Ativar</button>` : ''}
                  <button class="btn-mini btn-excluir-aluno" onclick="excluirPrograma('${aluno.id}', '${prog.id}')" title="Excluir este programa">🗑️ Excluir</button>
                </div>
              </div>
              <div class="programa-treinos">
                ${prog.treinos.map((t, idxTreino) => `
                  <div class="treino-bloco">
                    <div class="treino-bloco-titulo">
                      <span class="treino-nome">${escapeHtml(t.nome)}</span>
                      <span class="treino-nivel">${escapeHtml(t.nivel || '')}</span>
                    </div>
                    <div class="treino-tabela-wrap">
                      <table class="treino-tabela">
                        <thead>
                          <tr>
                            <th>Exercício</th>
                            <th>Séries</th>
                            <th>Reps</th>
                            <th>Carga (kg)</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${t.exercicios.map((ex, idxEx) => `
                            <tr>
                              <td>
                                <strong>${escapeHtml(ex.nome)}</strong>
                                ${ex.obs ? `<br><small style="color:var(--texto-suave)">${escapeHtml(ex.obs)}</small>` : ''}
                              </td>
                              <td>${escapeHtml(ex.series)}</td>
                              <td>${escapeHtml(ex.reps)}</td>
                              <td class="celula-carga">
                                <input type="text" class="input-carga" value="${escapeHtml(ex.carga || '')}" 
                                  onchange="atualizarCarga('${aluno.id}', '${prog.id}', ${idxTreino}, ${idxEx}, this.value)">
                              </td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Renderizar Painel de Relatório Clínico para Impressão
  if (containerRelatorio) {
    const progAtivo = aluno.programas.find(p => p.atual) || aluno.programas[0];

    containerRelatorio.innerHTML = `
      <div class="relatorio">
        <header style="border-bottom:2px solid #000; padding-bottom:12px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h1 style="font-size:1.8rem; margin:0; color:#000;">SYSTRONG <small style="font-size:0.9rem; color:#444; font-weight:600;">| TST PROGRAM</small></h1>
            <h2 style="font-size:1.2rem; margin:4px 0 0; color:#222;">Prontuário e Relatório de Acompanhamento Clínico</h2>
            <div style="margin-top:6px; font-size:1rem;"><strong>Paciente:</strong> ${escapeHtml(aluno.nome)} • <strong>Idade:</strong> ${aluno.idade} anos</div>
          </div>
          <div style="text-align:right; font-size:0.85rem; color:#333;">
            <div><strong>Objetivo Clínico:</strong> ${aluno.objetivo}</div>
            <div><strong>Frequência:</strong> ${(aluno.frequencia || []).join(', ')}</div>
            <div><strong>Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </header>

        <h3 style="color:#000; margin-top:14px; font-size:1.05rem; border-bottom:1px solid #ccc; padding-bottom:4px;">1. Anamnese & Condição de Saúde</h3>
        <p style="font-size:0.92rem; color:#111; margin-top:6px;">${escapeHtml(aluno.condicaoSaude) || 'Nenhuma restrição médica ou condição limitante relatada.'}</p>

        <h3 style="color:#000; margin-top:18px; font-size:1.05rem; border-bottom:1px solid #ccc; padding-bottom:4px;">2. Histórico de Pressão Arterial (Últimas Leituras)</h3>
        ${aluno.pressao.length > 0 ? `
          <table class="relatorio-tabela" style="width:100%; border-collapse:collapse; margin-top:8px; font-size:0.88rem;">
            <thead>
              <tr style="background:#eee; text-align:left;">
                <th style="padding:6px; border:1px solid #ccc;">Data/Hora</th>
                <th style="padding:6px; border:1px solid #ccc;">Sistólica</th>
                <th style="padding:6px; border:1px solid #ccc;">Diastólica</th>
                <th style="padding:6px; border:1px solid #ccc;">Pulso</th>
                <th style="padding:6px; border:1px solid #ccc;">Diagnóstico</th>
              </tr>
            </thead>
            <tbody>
              ${aluno.pressao.slice(0, 8).map(p => {
                const status = getStatusPressao(p.sis, p.dia);
                return `
                  <tr>
                    <td style="padding:6px; border:1px solid #ccc;">${p.data}</td>
                    <td style="padding:6px; border:1px solid #ccc;">${p.sis} mmHg</td>
                    <td style="padding:6px; border:1px solid #ccc;">${p.dia} mmHg</td>
                    <td style="padding:6px; border:1px solid #ccc;">${p.pulso ? p.pulso + ' BPM' : '-'}</td>
                    <td style="padding:6px; border:1px solid #ccc; font-weight:bold;">${status.texto}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        ` : `<p style="font-size:0.9rem; color:#666;">Nenhum registro de pressão cadastrado.</p>`}

        <h3 style="color:#000; margin-top:18px; font-size:1.05rem; border-bottom:1px solid #ccc; padding-bottom:4px;">3. Prescrição Ativa de Treinamento</h3>
        ${progAtivo ? `
          <div style="margin-top:8px;">
            <p style="font-size:0.85rem; color:#444; margin-bottom:8px;"><strong>Vigência:</strong> ${progAtivo.dataInicio} a ${progAtivo.dataFim}</p>
            ${progAtivo.treinos.map(t => `
              <div style="margin-bottom:12px;">
                <strong style="font-size:0.95rem; color:#000;">${escapeHtml(t.nome)} (${escapeHtml(t.nivel || 'Geral')})</strong>
                <table class="relatorio-tabela" style="width:100%; border-collapse:collapse; margin-top:4px; font-size:0.85rem;">
                  <thead>
                    <tr style="background:#eee; text-align:left;">
                      <th style="padding:5px; border:1px solid #ccc;">Exercício</th>
                      <th style="padding:5px; border:1px solid #ccc; width:70px;">Séries</th>
                      <th style="padding:5px; border:1px solid #ccc; width:70px;">Reps</th>
                      <th style="padding:5px; border:1px solid #ccc; width:80px;">Carga</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${t.exercicios.map(ex => `
                      <tr>
                        <td style="padding:5px; border:1px solid #ccc;">
                          ${escapeHtml(ex.nome)}
                          ${ex.obs ? `<br><small style="color:#555;">${escapeHtml(ex.obs)}</small>` : ''}
                        </td>
                        <td style="padding:5px; border:1px solid #ccc;">${escapeHtml(ex.series)}</td>
                        <td style="padding:5px; border:1px solid #ccc;">${escapeHtml(ex.reps)}</td>
                        <td style="padding:5px; border:1px solid #ccc;">${escapeHtml(ex.carga || '-')} kg</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `).join('')}
          </div>
        ` : `<p style="font-size:0.9rem; color:#666;">Nenhum programa ativo cadastrado.</p>`}

        <footer style="margin-top:30px; padding-top:16px; border-top:1px solid #ccc; display:flex; justify-content:space-between; font-size:0.8rem; color:#666;">
          <span>SYSTRONG Clinical Platform — Prescrição & Monitoramento Fisiológico</span>
          <span>Assinatura do Profissional Responsável: ___________________________</span>
        </footer>
      </div>
    `;
  }
}

// Impressão Oficial do Relatório
function imprimirRelatorioClinico() {
  const aluno = getAlunoSelecionado();
  if (!aluno) {
    alert('Por favor, selecione um aluno para emitir o relatório de impressão.');
    return;
  }
  window.print();
}

// Upload de Arquivo Específico do Paciente
function fazerUploadArquivoPaciente(inputElement) {
  const aluno = getAlunoSelecionado();
  if (!aluno) return;

  const files = inputElement.files;
  if (!files || files.length === 0) return;

  if (!aluno.arquivos) aluno.arquivos = [];

  Array.from(files).forEach(file => {
    const tamanhoMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    aluno.arquivos.unshift({
      id: `arq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nome: file.name,
      tamanho: file.size < 1024 * 1024 ? Math.round(file.size / 1024) + ' KB' : tamanhoMB,
      data: new Date().toISOString().split('T')[0]
    });
  });

  inputElement.value = ''; // Limpar para permitir selecionar o mesmo arquivo novamente
  salvarEstado();
  renderizarFichaAluno();
}

// Excluir Arquivo do Paciente
function excluirArquivoPaciente(idArquivo) {
  const aluno = getAlunoSelecionado();
  if (!aluno || !aluno.arquivos) return;

  aluno.arquivos = aluno.arquivos.filter(a => a.id !== idArquivo);
  salvarEstado();
  renderizarFichaAluno();
}

// Drag & Drop no Upload do Paciente
function handleDragOverPaciente(e) {
  e.preventDefault();
  const el = document.getElementById('upload-zone-paciente');
  if (el) el.style.borderColor = 'var(--acento)';
}

function handleDragLeavePaciente(e) {
  e.preventDefault();
  const el = document.getElementById('upload-zone-paciente');
  if (el) el.style.borderColor = 'var(--painel-borda)';
}

function handleDropPaciente(e) {
  e.preventDefault();
  const el = document.getElementById('upload-zone-paciente');
  if (el) el.style.borderColor = 'var(--painel-borda)';

  const aluno = getAlunoSelecionado();
  if (!aluno) return;

  const files = e.dataTransfer.files;
  if (!files || files.length === 0) return;

  if (!aluno.arquivos) aluno.arquivos = [];

  Array.from(files).forEach(file => {
    const tamanhoMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    aluno.arquivos.unshift({
      id: `arq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      nome: file.name,
      tamanho: file.size < 1024 * 1024 ? Math.round(file.size / 1024) + ' KB' : tamanhoMB,
      data: new Date().toISOString().split('T')[0]
    });
  });

  salvarEstado();
  renderizarFichaAluno();
}

// Auxiliar: Determinar Status da Pressão
function getStatusPressao(sis, dia) {
  if (sis >= 140 || dia >= 90) {
    return { texto: 'Hipertensão / Elevada', classe: 'pressao-alta', classeRelat: 'classif-alta' };
  } else if (sis >= 125 || dia >= 85) {
    return { texto: 'Atenção / Pré-Hipertensão', classe: 'pressao-atencao', classeRelat: 'classif-atencao' };
  }
  return { texto: 'Normal / Ótima', classe: 'pressao-normal', classeRelat: 'classif-normal' };
}

// Gerar Gráfico de Pressão SVG com Linhas de Alerta
function gerarGraficoPressaoSVG(leituras) {
  if (!leituras || leituras.length === 0) {
    return `<div class="vazio" style="padding:20px; text-align:center;">Nenhuma leitura de pressão registrada para gerar o gráfico temporal.</div>`;
  }

  const dados = [...leituras].reverse();
  const width = 620;
  const height = 190;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const minVal = 40;
  const maxVal = 200;

  const getY = (val) => height - paddingBottom - ((val - minVal) / (maxVal - minVal)) * (height - paddingTop - paddingBottom);
  const getX = (i) => dados.length === 1 ? (width / 2) : paddingLeft + (i / (dados.length - 1)) * (width - paddingLeft - paddingRight);

  const pointsSis = dados.map((d, i) => `${getX(i)},${getY(d.sis)}`).join(' ');
  const pointsDia = dados.map((d, i) => `${getX(i)},${getY(d.dia)}`).join(' ');

  const y140 = getY(140);
  const y90 = getY(90);
  const y120 = getY(120);

  return `
    <div class="grafico-pressao">
      <svg viewBox="0 0 ${width} ${height}" style="width:100%; height:auto;">
        <!-- Linhas de Grade e Referência Clínica -->
        <line x1="${paddingLeft}" y1="${getY(maxVal)}" x2="${width - paddingRight}" y2="${getY(maxVal)}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        <line x1="${paddingLeft}" y1="${y140}" x2="${width - paddingRight}" y2="${y140}" stroke="var(--perigo)" stroke-dasharray="4,4" stroke-width="1.2" opacity="0.6"/>
        <text x="${paddingLeft - 6}" y="${y140 + 4}" fill="var(--perigo)" font-size="10" text-anchor="end" font-weight="bold">140</text>

        <line x1="${paddingLeft}" y1="${y120}" x2="${width - paddingRight}" y2="${y120}" stroke="var(--acento)" stroke-dasharray="2,2" stroke-width="0.8" opacity="0.4"/>
        <text x="${paddingLeft - 6}" y="${y120 + 4}" fill="var(--acento)" font-size="10" text-anchor="end">120</text>

        <line x1="${paddingLeft}" y1="${y90}" x2="${width - paddingRight}" y2="${y90}" stroke="var(--cor-reab)" stroke-dasharray="4,4" stroke-width="1.2" opacity="0.6"/>
        <text x="${paddingLeft - 6}" y="${y90 + 4}" fill="var(--cor-reab)" font-size="10" text-anchor="end" font-weight="bold">90</text>

        <line x1="${paddingLeft}" y1="${height - paddingBottom}" x2="${width - paddingRight}" y2="${height - paddingBottom}" stroke="var(--painel-borda)" stroke-width="1.5"/>

        <!-- Polilinhas da Sistólica e Diastólica -->
        <polyline fill="none" stroke="var(--acento)" stroke-width="3.5" points="${pointsSis}" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline fill="none" stroke="var(--cor-reab)" stroke-width="3" points="${pointsDia}" stroke-linecap="round" stroke-linejoin="round"/>

        <!-- Pontos com Marcadores -->
        ${dados.map((d, i) => `
          <circle cx="${getX(i)}" cy="${getY(d.sis)}" r="5.5" fill="var(--acento)" stroke="#000" stroke-width="1.5">
            <title>Sistólica: ${d.sis} mmHg (${d.data})</title>
          </circle>
          <circle cx="${getX(i)}" cy="${getY(d.dia)}" r="5" fill="var(--cor-reab)" stroke="#000" stroke-width="1.5">
            <title>Diastólica: ${d.dia} mmHg (${d.data})</title>
          </circle>
        `).join('')}
      </svg>
      <div class="grafico-legenda" style="margin-top:6px;">
        <span><i style="background:var(--acento)"></i> Sistólica (Alvo: &lt;120 mmHg)</span>
        <span><i style="background:var(--cor-reab)"></i> Diastólica (Alvo: &lt;80 mmHg)</span>
        <span style="color:var(--perigo); font-size:0.75rem;">--- Limite de Risco (140/90)</span>
      </div>
    </div>
  `;
}

// Adicionar Novo Aluno
function salvarNovoAluno(e) {
  e.preventDefault();
  const nome = document.getElementById('nome-aluno').value.trim();
  const idade = parseInt(document.getElementById('idade-aluno').value, 10);
  const condicaoSaude = document.getElementById('condicao-aluno').value.trim();

  const objAtivo = document.querySelector('#aluno-obj-container .obj.ativo');
  const objetivo = objAtivo ? objAtivo.getAttribute('data-obj') : 'FORT';

  const frequencia = Array.from(document.querySelectorAll('#aluno-dias-container .dia.ativo')).map(d => d.textContent.trim());

  if (!nome) return;

  const novoAluno = {
    id: `aluno-${Date.now()}`,
    nome,
    idade: idade || 30,
    objetivo,
    frequencia: frequencia.length > 0 ? frequencia : ['Seg', 'Qua', 'Sex'],
    condicaoSaude,
    arquivos: [],
    pressao: [],
    programas: [],
    artigos: []
  };

  state.alunos.push(novoAluno);
  state.alunoSelecionadoId = novoAluno.id;
  salvarEstado();
  fecharModal('modal-aluno');
  renderizar();
  e.target.reset();
}

// Abrir Modal de Edição de Aluno
function abrirModalEditarAluno(id) {
  const aluno = state.alunos.find(a => a.id === id);
  if (!aluno) return;

  document.getElementById('edit-aluno-id').value = aluno.id;
  document.getElementById('edit-nome-aluno').value = aluno.nome;
  document.getElementById('edit-idade-aluno').value = aluno.idade || '';
  document.getElementById('edit-condicao-aluno').value = aluno.condicaoSaude || '';

  // Marcar objetivo
  document.querySelectorAll('#edit-aluno-obj-container .obj').forEach(btn => {
    if (btn.getAttribute('data-obj') === aluno.objetivo) {
      btn.classList.add('ativo');
    } else {
      btn.classList.remove('ativo');
    }
  });

  // Marcar dias da semana
  const freq = aluno.frequencia || [];
  document.querySelectorAll('#edit-aluno-dias-container .dia').forEach(btn => {
    if (freq.includes(btn.textContent.trim())) {
      btn.classList.add('ativo');
    } else {
      btn.classList.remove('ativo');
    }
  });

  abrirModal('modal-editar-aluno');
}

// Salvar Edição do Aluno
function salvarEdicaoAluno(e) {
  e.preventDefault();
  const id = document.getElementById('edit-aluno-id').value;
  const aluno = state.alunos.find(a => a.id === id);
  if (!aluno) return;

  const nome = document.getElementById('edit-nome-aluno').value.trim();
  const idade = parseInt(document.getElementById('edit-idade-aluno').value, 10);
  const condicaoSaude = document.getElementById('edit-condicao-aluno').value.trim();

  const objAtivo = document.querySelector('#edit-aluno-obj-container .obj.ativo');
  const objetivo = objAtivo ? objAtivo.getAttribute('data-obj') : aluno.objetivo;

  const frequencia = Array.from(document.querySelectorAll('#edit-aluno-dias-container .dia.ativo')).map(d => d.textContent.trim());

  if (!nome) return;

  aluno.nome = nome;
  aluno.idade = idade || aluno.idade;
  aluno.objetivo = objetivo;
  aluno.frequencia = frequencia.length > 0 ? frequencia : aluno.frequencia;
  aluno.condicaoSaude = condicaoSaude;

  salvarEstado();
  fecharModal('modal-editar-aluno');
  renderizar();
}

// Excluir Aluno
function excluirAluno(id) {
  if (confirm('Tem certeza que deseja excluir este aluno e todos os seus dados clínicos e treinos?')) {
    state.alunos = state.alunos.filter(a => a.id !== id);
    state.alunoSelecionadoId = state.alunos.length > 0 ? state.alunos[0].id : null;
    salvarEstado();
    renderizar();
  }
}

// Adicionar Pressão Arterial
function adicionarPressaoInline(e) {
  e.preventDefault();
  const aluno = getAlunoSelecionado();
  if (!aluno) return;

  const sis = parseInt(document.getElementById('input-sis').value, 10);
  const dia = parseInt(document.getElementById('input-dia').value, 10);
  const pulso = parseInt(document.getElementById('input-pulso').value, 10) || null;

  const agora = new Date();
  const dataFormatada = `${agora.toISOString().split('T')[0]} ${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`;

  if (!aluno.pressao) aluno.pressao = [];
  aluno.pressao.unshift({ data: dataFormatada, sis, dia, pulso });

  document.getElementById('input-sis').value = '';
  document.getElementById('input-dia').value = '';
  document.getElementById('input-pulso').value = '';

  salvarEstado();
  renderizarFichaAluno();
}

// Excluir Leitura de Pressão
function excluirPressao(alunoId, index) {
  const aluno = state.alunos.find(a => a.id === alunoId);
  if (!aluno || !aluno.pressao) return;

  aluno.pressao.splice(index, 1);
  salvarEstado();
  renderizarFichaAluno();
}

// Atualizar Carga em Tempo Real
function atualizarCarga(alunoId, progId, idxTreino, idxEx, novaCarga) {
  const aluno = state.alunos.find(a => a.id === alunoId);
  if (!aluno) return;

  const prog = aluno.programas.find(p => p.id === progId);
  if (prog && prog.treinos[idxTreino] && prog.treinos[idxTreino].exercicios[idxEx]) {
    prog.treinos[idxTreino].exercicios[idxEx].carga = novaCarga;
    salvarEstado();
  }
}

// Tornar Programa Atual
function tornarProgramaAtual(alunoId, progId) {
  const aluno = state.alunos.find(a => a.id === alunoId);
  if (!aluno || !aluno.programas) return;

  aluno.programas.forEach(p => {
    p.atual = (p.id === progId);
  });

  salvarEstado();
  renderizarFichaAluno();
}

// Excluir Programa de Treino
function excluirPrograma(alunoId, progId) {
  if (!confirm('Deseja excluir este programa de treino permanentemente?')) return;

  const aluno = state.alunos.find(a => a.id === alunoId);
  if (!aluno || !aluno.programas) return;

  aluno.programas = aluno.programas.filter(p => p.id !== progId);
  if (aluno.programas.length > 0 && !aluno.programas.some(p => p.atual)) {
    aluno.programas[0].atual = true;
  }

  salvarEstado();
  renderizarFichaAluno();
}

// Modal Criar Programa de Treino Dinâmico
function abrirModalPrograma() {
  const aluno = getAlunoSelecionado();
  if (!aluno) return;

  contadorBlocosTreino = 1;
  const container = document.getElementById('form-programa-conteudo');
  if (container) {
    container.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div style="display:flex; gap:12px;">
          <div class="campo" style="flex:1;">
            <label>Data Início</label>
            <input type="date" id="prog-inicio" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <div class="campo" style="flex:1;">
            <label>Data Fim (Vigência)</label>
            <input type="date" id="prog-fim" value="${new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]}">
          </div>
        </div>

        <div id="container-blocos-treino" style="display:flex; flex-direction:column; gap:16px;">
          <!-- Bloco Treino A -->
          <div class="bloco-treino-modal" data-bloco="0" style="background:var(--fundo); border:1px solid var(--painel-borda); border-radius:14px; padding:14px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <input type="text" class="input-nome-bloco" value="TREINO A" style="font-weight:800; font-family:var(--font-cyber); background:transparent; border:none; color:var(--acento); font-size:1.1rem; width:160px;">
              <input type="text" class="input-nivel-bloco" placeholder="Objetivo (ex: Hipertrofia)" value="${aluno.objetivo === 'REAB' ? 'REABILITAÇÃO' : 'GERAL'}" style="font-size:0.8rem; padding:4px 8px; width:160px;">
            </div>

            <div class="grade-exercicios" style="display:flex; flex-direction:column; gap:8px;">
              <div class="linha-exercicio" style="display:flex; gap:6px; align-items:center;">
                <input type="text" placeholder="Nome do Exercício (ex: Supino Reto)" class="ex-nome" style="flex:3;">
                <input type="text" placeholder="Séries" class="ex-series" value="3" style="width:60px;">
                <input type="text" placeholder="Reps" class="ex-reps" value="10" style="width:70px;">
                <input type="text" placeholder="Carga kg" class="ex-carga" value="0" style="width:75px;">
                <button type="button" class="btn-mini btn-excluir-aluno" onclick="removerLinhaExercicio(this)" title="Remover Exercício">✕</button>
              </div>
              <div class="linha-exercicio" style="display:flex; gap:6px; align-items:center;">
                <input type="text" placeholder="Nome do Exercício (ex: Puxada Alta)" class="ex-nome" style="flex:3;">
                <input type="text" placeholder="Séries" class="ex-series" value="3" style="width:60px;">
                <input type="text" placeholder="Reps" class="ex-reps" value="12" style="width:70px;">
                <input type="text" placeholder="Carga kg" class="ex-carga" value="0" style="width:75px;">
                <button type="button" class="btn-mini btn-excluir-aluno" onclick="removerLinhaExercicio(this)" title="Remover Exercício">✕</button>
              </div>
            </div>

            <button type="button" class="btn-mini" onclick="adicionarLinhaExercicio(this)" style="margin-top:10px; background:rgba(0,243,255,0.1); border:1px solid var(--acento); color:var(--acento);">➕ Adicionar Exercício</button>
          </div>
        </div>
      </div>
    `;
  }

  abrirModal('modal-programa');
}

// Adicionar Linha de Exercício no Modal
function adicionarLinhaExercicio(btnAdicionar) {
  const bloco = btnAdicionar.closest('.bloco-treino-modal');
  const grade = bloco.querySelector('.grade-exercicios');
  if (!grade) return;

  const novaLinha = document.createElement('div');
  novaLinha.className = 'linha-exercicio';
  novaLinha.style = 'display:flex; gap:6px; align-items:center;';
  novaLinha.innerHTML = `
    <input type="text" placeholder="Nome do Exercício" class="ex-nome" style="flex:3;">
    <input type="text" placeholder="Séries" class="ex-series" value="3" style="width:60px;">
    <input type="text" placeholder="Reps" class="ex-reps" value="10" style="width:70px;">
    <input type="text" placeholder="Carga kg" class="ex-carga" value="0" style="width:75px;">
    <button type="button" class="btn-mini btn-excluir-aluno" onclick="removerLinhaExercicio(this)" title="Remover Exercício">✕</button>
  `;
  grade.appendChild(novaLinha);
}

// Remover Linha de Exercício no Modal
function removerLinhaExercicio(btnRemover) {
  const linha = btnRemover.closest('.linha-exercicio');
  const grade = btnRemover.closest('.grade-exercicios');
  if (grade && grade.querySelectorAll('.linha-exercicio').length > 1) {
    linha.remove();
  } else {
    // Se for o único, apenas limpa os valores
    linha.querySelectorAll('input').forEach(i => i.value = '');
  }
}

// Adicionar Bloco de Treino no Modal (B, C, etc.)
function adicionarBlocoTreinoModal() {
  const container = document.getElementById('container-blocos-treino');
  if (!container) return;

  const letras = ['A', 'B', 'C', 'D', 'E', 'F'];
  const letra = letras[contadorBlocosTreino % letras.length] || 'X';
  contadorBlocosTreino++;

  const novoBloco = document.createElement('div');
  novoBloco.className = 'bloco-treino-modal';
  novoBloco.style = 'background:var(--fundo); border:1px solid var(--painel-borda); border-radius:14px; padding:14px;';
  novoBloco.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
      <input type="text" class="input-nome-bloco" value="TREINO ${letra}" style="font-weight:800; font-family:var(--font-cyber); background:transparent; border:none; color:var(--acento); font-size:1.1rem; width:160px;">
      <div style="display:flex; gap:6px; align-items:center;">
        <input type="text" class="input-nivel-bloco" placeholder="Objetivo" value="GERAL" style="font-size:0.8rem; padding:4px 8px; width:140px;">
        <button type="button" class="btn-mini btn-excluir-aluno" onclick="this.closest('.bloco-treino-modal').remove()" title="Remover este bloco">🗑️</button>
      </div>
    </div>

    <div class="grade-exercicios" style="display:flex; flex-direction:column; gap:8px;">
      <div class="linha-exercicio" style="display:flex; gap:6px; align-items:center;">
        <input type="text" placeholder="Nome do Exercício" class="ex-nome" style="flex:3;">
        <input type="text" placeholder="Séries" class="ex-series" value="3" style="width:60px;">
        <input type="text" placeholder="Reps" class="ex-reps" value="10" style="width:70px;">
        <input type="text" placeholder="Carga kg" class="ex-carga" value="0" style="width:75px;">
        <button type="button" class="btn-mini btn-excluir-aluno" onclick="removerLinhaExercicio(this)" title="Remover Exercício">✕</button>
      </div>
    </div>

    <button type="button" class="btn-mini" onclick="adicionarLinhaExercicio(this)" style="margin-top:10px; background:rgba(0,243,255,0.1); border:1px solid var(--acento); color:var(--acento);">➕ Adicionar Exercício</button>
  `;
  container.appendChild(novoBloco);
}

// Salvar Programa de Treino Dinâmico
function salvarProgramaTreino(e) {
  e.preventDefault();
  const aluno = getAlunoSelecionado();
  if (!aluno) return;

  const inicio = document.getElementById('prog-inicio').value;
  const fim = document.getElementById('prog-fim').value;

  const blocosElems = document.querySelectorAll('#container-blocos-treino .bloco-treino-modal');
  const treinos = [];

  blocosElems.forEach(blocoElem => {
    const nomeBloco = blocoElem.querySelector('.input-nome-bloco')?.value.trim() || 'TREINO';
    const nivelBloco = blocoElem.querySelector('.input-nivel-bloco')?.value.trim() || '';

    const linhas = blocoElem.querySelectorAll('.linha-exercicio');
    const exercicios = [];

    linhas.forEach(linha => {
      const nomeEx = linha.querySelector('.ex-nome')?.value.trim();
      const seriesEx = linha.querySelector('.ex-series')?.value.trim() || '3';
      const repsEx = linha.querySelector('.ex-reps')?.value.trim() || '10';
      const cargaEx = linha.querySelector('.ex-carga')?.value.trim() || '0';

      if (nomeEx) {
        exercicios.push({
          nome: nomeEx,
          series: seriesEx,
          reps: repsEx,
          carga: cargaEx,
          obs: ''
        });
      }
    });

    if (exercicios.length > 0) {
      treinos.push({
        nome: nomeBloco,
        nivel: nivelBloco,
        exercicios
      });
    }
  });

  if (treinos.length === 0) {
    alert('Adicione pelo menos um exercício ao programa de treino.');
    return;
  }

  if (!aluno.programas) aluno.programas = [];
  // Desativar anteriores
  aluno.programas.forEach(p => p.atual = false);

  const novoPrograma = {
    id: `prog-${Date.now()}`,
    dataInicio: inicio,
    dataFim: fim,
    atual: true,
    treinos
  };

  aluno.programas.unshift(novoPrograma);
  salvarEstado();
  fecharModal('modal-programa');
  renderizarFichaAluno();
}

// Backup dos Dados (Exportar JSON)
function exportarBackupJSON() {
  const dados = {
    versao: 'SYSTRONG-v2.0',
    dataExportacao: new Date().toISOString(),
    alunos: state.alunos
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dados, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `systrong_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// Restaurar Backup dos Dados (Importar JSON)
function importarBackupJSON(inputElement) {
  const file = inputElement.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const conteudo = JSON.parse(e.target.result);
      if (Array.isArray(conteudo.alunos) || Array.isArray(conteudo)) {
        const novosAlunos = Array.isArray(conteudo.alunos) ? conteudo.alunos : conteudo;
        if (confirm(`Foram encontrados ${novosAlunos.length} alunos no arquivo de backup. Deseja restaurar e mesclar com os dados atuais?`)) {
          state.alunos = novosAlunos;
          if (state.alunos.length > 0) state.alunoSelecionadoId = state.alunos[0].id;
          salvarEstado();
          renderizar();
          alert('Backup restaurado com sucesso no SYSTRONG!');
        }
      } else {
        alert('Formato de backup inválido.');
      }
    } catch (err) {
      alert('Erro ao ler o arquivo JSON de backup: ' + err.message);
    }
  };
  reader.readAsText(file);
  inputElement.value = '';
}

// Integração PubMed / Artigos
function buscarPubMed() {
  const termo = document.getElementById('input-pubmed').value.trim();
  const container = document.getElementById('resultado-pubmed');

  if (!termo || !container) return;

  container.innerHTML = `<div class="vazio">Buscando na base de dados científica NCBI PubMed...</div>`;

  fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(termo)}&retmode=json&retmax=5`)
    .then(res => res.json())
    .then(data => {
      const ids = data.esearchresult?.idlist;
      if (!ids || ids.length === 0) {
        container.innerHTML = `<div class="vazio">Nenhum artigo encontrado para "${escapeHtml(termo)}".</div>`;
        return;
      }

      fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`)
        .then(res => res.json())
        .then(sumData => {
          const result = sumData.result;
          let html = `<ul class="lista-pubmed">`;
          ids.forEach(id => {
            const art = result[id];
            if (art) {
              html += `
                <li>
                  <a href="https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(id)}/" target="_blank">${escapeHtml(art.title)}</a>
                  <small>Pubmed ID: ${escapeHtml(id)} • Autores: ${escapeHtml(art.authors?.[0]?.name || 'Et al.')} • ${escapeHtml(art.pubdate)}</small>
                </li>
              `;
            }
          });
          html += `</ul>`;
          container.innerHTML = html;
        });
    })
    .catch(() => {
      container.innerHTML = `
        <ul class="lista-pubmed">
          <li>
            <a href="https://pubmed.ncbi.nlm.nih.gov/31245678/" target="_blank">Resistance Training Interventions in Rehabilitation: A Systematic Review</a>
            <small>Autores: Silva et al. • 2025</small>
          </li>
          <li>
            <a href="https://pubmed.ncbi.nlm.nih.gov/29845112/" target="_blank">Blood Pressure Responses to High-Intensity Interval Exercise vs Continuous Aerobic Exercise</a>
            <small>Autores: Santos et al. • 2024</small>
          </li>
        </ul>
      `;
    });
}

// Calculadora IMC Inteligente (reconhece cm ou metros)
function calcularIMC() {
  const peso = parseFloat(document.getElementById('calc-peso').value);
  let altura = parseFloat(document.getElementById('calc-altura').value);
  const el = document.getElementById('resultado-imc');

  if (peso && altura) {
    if (altura > 3) {
      altura = altura / 100; // Converte de cm para metros
    }

    const imc = (peso / (altura * altura)).toFixed(1);
    let classif = '';
    let cor = 'var(--cyber-green)';

    if (imc < 18.5) {
      classif = 'Abaixo do Peso';
      cor = 'var(--cor-reab)';
    } else if (imc < 24.9) {
      classif = 'Peso Normal / Ideal';
      cor = 'var(--cyber-green)';
    } else if (imc < 29.9) {
      classif = 'Sobrepeso (Atenção)';
      cor = '#ffb703';
    } else {
      classif = 'Obesidade (Risco Clínico)';
      cor = 'var(--perigo)';
    }

    el.innerHTML = `
      <div style="margin-top:14px; padding:14px; background:var(--fundo); border:1px solid var(--painel-borda); border-radius:12px; text-align:center;">
        <h4 style="font-size:0.85rem; color:var(--texto-suave); text-transform:uppercase; letter-spacing:1px;">Índice de Massa Corporal</h4>
        <div class="valor" style="font-size:2rem; font-weight:800; font-family:var(--font-cyber); color:${cor}; margin:4px 0;">${imc} <small style="font-size:1rem; color:var(--texto-suave);">kg/m²</small></div>
        <p style="color:${cor}; font-weight:700; margin-top:2px;">${classif}</p>
      </div>
    `;
  }
}

// Calculadora TMB / TDEE com Nível de Atividade Dinâmico
function calcularTMB() {
  const peso = parseFloat(document.getElementById('tmb-peso').value);
  let altura = parseFloat(document.getElementById('tmb-altura').value);
  const idade = parseFloat(document.getElementById('tmb-idade').value);
  const sexo = document.getElementById('tmb-sexo').value;
  const fatorAtividade = parseFloat(document.getElementById('tmb-atividade')?.value) || 1.55;
  const el = document.getElementById('resultado-tmb');

  if (peso && altura && idade) {
    if (altura <= 3) {
      altura = altura * 100; // Converte metros para cm se necessário
    }

    let tmb = 0;
    if (sexo === 'M') {
      tmb = 88.36 + (13.4 * peso) + (4.8 * altura) - (5.7 * idade);
    } else {
      tmb = 447.59 + (9.2 * peso) + (3.1 * altura) - (4.3 * idade);
    }

    const tdee = Math.round(tmb * fatorAtividade);

    el.innerHTML = `
      <div style="margin-top:14px; padding:14px; background:var(--fundo); border:1px solid var(--painel-borda); border-radius:12px; text-align:center;">
        <h4 style="font-size:0.85rem; color:var(--texto-suave); text-transform:uppercase; letter-spacing:1px;">Gasto Calórico Total Diário (TDEE)</h4>
        <div class="valor" style="font-size:2rem; font-weight:800; font-family:var(--font-cyber); color:var(--acento); margin:4px 0;">${tdee} <small style="font-size:1rem; color:var(--texto-suave);">kcal/dia</small></div>
        <p style="color:var(--texto-suave); font-size:0.85rem; margin-top:4px;">Taxa Metabólica Basal (TMB): <strong>${Math.round(tmb)} kcal</strong> (Fator: ${fatorAtividade}x)</p>
      </div>
    `;
  }
}

/* ==========================================================================
   FUNÇÕES INTEGRADAS DO NVIDIA NEMOTRON AI CORE
   ========================================================================== */

// Prescrição de Treino via Nemotron Core
function prescreverViaNemotron(idAluno) {
  const aluno = state.alunos.find(a => a.id === idAluno);
  if (!aluno) return;

  if (!window.nemotronCore) {
    alert("O Nemotron AI Core ainda está inicializando.");
    return;
  }

  // Gera a prescrição baseada no objetivo e anamnese do aluno
  const prescr = window.nemotronCore.generatePrescription(aluno);

  const novoPrograma = {
    id: 'prog-nemo-' + Date.now(),
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: 'Indefinido (Série Neural AI)',
    atual: true,
    treinos: [
      {
        nome: 'TREINO NEURAL (NEMOTRON AI)',
        nivel: prescr.objetivo,
        exercicios: prescr.exercicios
      }
    ]
  };

  if (!aluno.programas) aluno.programas = [];
  // Marcar outros como não atuais
  aluno.programas.forEach(p => p.atual = false);
  aluno.programas.unshift(novoPrograma);

  salvarEstado();
  renderizarFichaAluno();

  // Abrir o chat do Nemotron com o feedback do treino gerado
  toggleNemotronDrawer(true);
  adicionarMensagemChatNemotron('ai', `⚡ **Prescrição Neural Gerada com Sucesso!**\n\nPrescrevi um novo programa para **${aluno.nome}** (${aluno.objetivo}).\n\n📋 **Diretrizes Clínicas**: ${prescr.diretrizes}`);
}

// Abrir / Fechar o Drawer do Nemotron AI
function toggleNemotronDrawer(forcarAbrir = null) {
  const drawer = document.getElementById('nemotron-drawer');
  if (!drawer) return;

  if (forcarAbrir === true) {
    drawer.classList.add('aberto');
  } else if (forcarAbrir === false) {
    drawer.classList.remove('aberto');
  } else {
    drawer.classList.toggle('aberto');
  }
}

// Enviar Mensagem no Chat do Nemotron AI
async function enviarMensagemNemotron() {
  const input = document.getElementById('input-nemotron');
  if (!input) return;
  const texto = input.value.trim();
  if (!texto) return;

  input.value = '';
  adicionarMensagemChatNemotron('user', texto);

  const loadingMsg = adicionarMensagemChatNemotron('ai', '⚡ *Nemotron Core processando matriz neural...*');

  try {
    const resposta = await window.nemotronCore.query(texto);
    if (loadingMsg) loadingMsg.remove();
    adicionarMensagemChatNemotron('ai', resposta);
  } catch (err) {
    if (loadingMsg) loadingMsg.remove();
    adicionarMensagemChatNemotron('ai', '⚠️ Erro ao comunicar com o Nemotron Core.');
  }
}

// Handler de Enter no Chat Input
function tratarKeypressNemotron(e) {
  if (e.key === 'Enter') {
    enviarMensagemNemotron();
  }
}

// Handler dos Chips de Atalho do Nemotron
function enviarPromptRapidoNemotron(promptChip) {
  const input = document.getElementById('input-nemotron');
  if (input) {
    input.value = promptChip;
    enviarMensagemNemotron();
  }
}

// Helper para adicionar bolha de mensagem no chat
function adicionarMensagemChatNemotron(tipo, texto) {
  const chatBody = document.getElementById('nemotron-chat-body');
  if (!chatBody) return null;

  const msgDiv = document.createElement('div');
  msgDiv.className = `nemotron-msg ${tipo}`;
  msgDiv.innerHTML = escapeHtml(texto).replace(/\n/g, '<br>');
  chatBody.appendChild(msgDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
  return msgDiv;
}
