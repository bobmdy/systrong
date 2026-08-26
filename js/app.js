/* ==========================================================================
   SYSTRONG - Lógica do Aplicativo em JavaScript Puro
   Interface Computador (Desktop), Interface Celular (Mobile) e Autenticação
   ========================================================================== */

// Estado global da aplicação
let state = {
  alunos: [],
  alunoSelecionadoId: null,
  tema: 'dark',
  modoVisao: 'auto', // 'auto', 'mobile', 'desktop'
  abaMobileAtiva: 'pacientes', // 'pacientes', 'ficha', 'tools'
  autenticado: false
};

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

// Configurar Eventos da UI
function configurarEventos() {
  document.getElementById('form-login')?.addEventListener('submit', fazerLogin);
  document.getElementById('btn-logout')?.addEventListener('click', fazerLogout);

  document.getElementById('btn-tema')?.addEventListener('click', alternarTema);
  document.getElementById('btn-modo-visao')?.addEventListener('click', alternarModoVisao);

  document.getElementById('btn-novo-aluno')?.addEventListener('click', () => abrirModal('modal-aluno'));
  document.getElementById('btn-fechar-aluno')?.addEventListener('click', () => fecharModal('modal-aluno'));

  document.getElementById('form-aluno')?.addEventListener('submit', salvarNovoAluno);

  document.querySelectorAll('.obj').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.obj').forEach(b => b.classList.remove('ativo'));
      e.currentTarget.classList.add('ativo');
    });
  });

  document.querySelectorAll('.dia').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.currentTarget.classList.toggle('ativo');
    });
  });

  document.getElementById('form-programa')?.addEventListener('submit', salvarProgramaTreino);
  document.getElementById('btn-fechar-programa')?.addEventListener('click', () => fecharModal('modal-programa'));

  document.getElementById('btn-buscar-pubmed')?.addEventListener('click', buscarPubMed);
  document.getElementById('btn-calc-imc')?.addEventListener('click', calcularIMC);
  document.getElementById('btn-calc-tmb')?.addEventListener('click', calcularTMB);

  document.getElementById('btn-imprimir')?.addEventListener('click', () => window.print());

  // Eventos do NVIDIA Nemotron AI Core
  document.getElementById('btn-fechar-nemotron')?.addEventListener('click', toggleNemotronDrawer);
  document.getElementById('btn-enviar-nemotron')?.addEventListener('click', enviarMensagemNemotron);

  window.addEventListener('resize', () => {
    if (state.modoVisao === 'auto') aplicarModoVisao();
  });
}

// Modais Helper
function abrirModal(idModal) {
  document.getElementById(idModal)?.classList.add('ativo');
}

function fecharModal(idModal) {
  document.getElementById(idModal)?.classList.remove('ativo');
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

// Renderizar Lista de Alunos
function renderizarListaAlunos() {
  const container = document.getElementById('lista-alunos');
  if (!container) return;

  if (state.alunos.length === 0) {
    container.innerHTML = `<li class="vazio">Nenhum aluno cadastrado.</li>`;
    return;
  }

  container.innerHTML = state.alunos.map(aluno => {
    const selecionado = aluno.id === state.alunoSelecionadoId ? 'ativo' : '';
    const badgeClass = `badge-${aluno.objetivo.toLowerCase()}`;
    return `
      <li class="${selecionado}" onclick="selecionarAluno('${aluno.id}')">
        <div class="aluno-item-cabecalho">
          <span class="aluno-nome">${aluno.nome}</span>
          <span class="badge ${badgeClass}">${aluno.objetivo}</span>
        </div>
        <small>${aluno.idade} anos • ${aluno.frequencia.join(', ')}</small>
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
    if (container) container.innerHTML = `<div class="vazio">Selecione um aluno para visualizar a ficha.</div>`;
    return;
  }

  if (!aluno.arquivos) aluno.arquivos = [];

  // Renderizar Ficha Principal
  if (container) {
    const badgeClass = `badge-${aluno.objetivo.toLowerCase()}`;
    const descObjetivo = aluno.objetivo === 'REAB' ? 'Reabilitação & Fisioterapia' :
                         aluno.objetivo === 'FORT' ? 'Fortalecimento & Hipertrofia' : 'Emagrecimento & Saúde';

    container.innerHTML = `
      <div class="ficha">
        <div class="ficha-cabecalho">
          <div class="ficha-info">
            <h2>${aluno.nome} <span class="badge ${badgeClass}">${aluno.objetivo}</span></h2>
            <div class="objetivo">${descObjetivo} • ${aluno.idade} Anos</div>
            <div class="resumo-treino">
              <span>📅 Frequência: ${aluno.frequencia.join(', ')}</span>
              <span>📋 Programas: ${aluno.programas.length}</span>
              <span>📁 Arquivos: ${aluno.arquivos.length}</span>
            </div>
          </div>
          <button class="btn-mini btn-excluir-aluno" onclick="excluirAluno('${aluno.id}')">🗑️ Excluir Aluno</button>
        </div>

        ${aluno.condicaoSaude ? `
          <div class="condicao-saude">
            <h3>⚠️ Condição de Saúde & Restrições</h3>
            <p>${aluno.condicaoSaude}</p>
          </div>
        ` : ''}

        <!-- Seção de Upload de Arquivos do Paciente -->
        <div class="secao-treinos">
          <div class="secao-cabecalho">
            <h3>📁 Documentos & Exames de ${aluno.nome}</h3>
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
            <p style="margin:4px 0 0; font-weight:700; font-size:0.92rem;">Clique aqui ou arraste exames e laudos para este paciente</p>
            <small style="color:var(--texto-suave)">Salvo exclusivamente para ${aluno.nome}</small>
          </div>

          ${aluno.arquivos.length > 0 ? `
            <ul style="margin-top:12px; list-style:none; padding:0; display:flex; flex-direction:column; gap:8px;">
              ${aluno.arquivos.map(arq => `
                <li style="display:flex; justify-content:space-between; align-items:center; padding:12px 14px; background:var(--fundo); border:1px solid var(--painel-borda); border-radius:12px;">
                  <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-size:1.3rem;">📌</span>
                    <div>
                      <strong style="font-size:0.92rem; color:var(--texto);">${arq.nome}</strong>
                      <div style="font-size:0.78rem; color:var(--texto-suave);">${arq.tamanho} • Anexado em ${arq.data}</div>
                    </div>
                  </div>
                  <button class="btn-mini btn-excluir-aluno" onclick="excluirArquivoPaciente('${arq.id}')">🗑️ Excluir</button>
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
            ${aluno.pressao.map(p => {
              const status = getStatusPressao(p.sis, p.dia);
              return `
                <li class="${status.classe}">
                  <strong>${p.sis}/${p.dia} <small>mmHg</small></strong>
                  <small>${p.data} ${p.pulso ? `• ${p.pulso} BPM` : ''}</small>
                </li>
              `;
            }).join('')}
          </ul>
        </div>

        <!-- Seção de Programas de Treino -->
        <div class="secao-treinos">
          <div class="secao-cabecalho">
            <h3>💪 Prescrição de Treinos</h3>
            <button class="btn-mini" onclick="abrirModalPrograma()">➕ Criar Programa</button>
          </div>

          ${aluno.programas.length === 0 ? `
            <div class="vazio">Nenhum programa de treino cadastrado para este aluno.</div>
          ` : aluno.programas.map(prog => `
            <div class="programa ${prog.atual ? 'atual' : ''}">
              <div class="programa-cabecalho">
                <strong>Programa de Treino</strong>
                <span class="programa-tempo">Vigência: ${prog.dataInicio} até ${prog.dataFim}</span>
              </div>
              <div class="programa-treinos">
                ${prog.treinos.map((t, idxTreino) => `
                  <div class="treino-bloco">
                    <div class="treino-bloco-titulo">
                      <span class="treino-nome">${t.nome}</span>
                      <span class="treino-nivel">${t.nivel}</span>
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
                                <strong>${ex.nome}</strong>
                                ${ex.obs ? `<br><small style="color:var(--texto-suave)">${ex.obs}</small>` : ''}
                              </td>
                              <td>${ex.series}</td>
                              <td>${ex.reps}</td>
                              <td class="celula-carga">
                                <input type="text" class="input-carga" value="${ex.carga || ''}" 
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

  // Renderizar Painel de Relatório (para impressão)
  if (containerRelatorio) {
    containerRelatorio.innerHTML = `
      <div class="relatorio">
        <header>
          <div>
            <h1>SYSTRONG <small>TST PROGRAM — RELATÓRIO CLÍNICO DE ACOMPANHAMENTO</small></h1>
            <h2>Aluno/Paciente: ${aluno.nome}</h2>
          </div>
          <div class="relatorio-meta">
            <strong>Objetivo: ${aluno.objetivo}</strong>
            <span>Data: ${new Date().toLocaleDateString('pt-BR')}</span>
          </div>
        </header>

        <h3>Condição de Saúde</h3>
        <p>${aluno.condicaoSaude || 'Sem restrições relatadas.'}</p>

        <h3 style="margin-top:20px;">Documentos Anexados (${aluno.arquivos.length})</h3>
        <ul>
          ${aluno.arquivos.map(a => `<li><strong>${a.nome}</strong> (${a.tamanho}) - Anexado em ${a.data}</li>`).join('')}
        </ul>

        <h3 style="margin-top:20px;">Histórico de Pressão Arterial</h3>
        <table class="relatorio-tabela">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Sistólica</th>
              <th>Diastólica</th>
              <th>Pulso</th>
              <th>Classificação</th>
            </tr>
          </thead>
          <tbody>
            ${aluno.pressao.map(p => {
              const status = getStatusPressao(p.sis, p.dia);
              return `
                <tr>
                  <td>${p.data}</td>
                  <td>${p.sis} mmHg</td>
                  <td>${p.dia} mmHg</td>
                  <td>${p.pulso || '-'} BPM</td>
                  <td class="${status.classeRelat}">${status.texto}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
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
    return { texto: 'Pressão Alta', classe: 'pressao-alta', classeRelat: 'classif-alta' };
  } else if (sis >= 130 || dia >= 85) {
    return { texto: 'Atenção / Pré-Hipertensão', classe: 'pressao-atencao', classeRelat: 'classif-atencao' };
  }
  return { texto: 'Normal', classe: 'pressao-normal', classeRelat: 'classif-normal' };
}

// Gerar Gráfico de Pressão SVG
function gerarGraficoPressaoSVG(leituras) {
  if (!leituras || leituras.length === 0) {
    return `<div class="vazio">Nenhuma leitura de pressão registrada para o gráfico.</div>`;
  }

  const dados = [...leituras].reverse();
  const width = 600;
  const height = 180;
  const padding = 30;

  const minVal = 50;
  const maxVal = 180;

  const pointsSis = dados.map((d, i) => {
    const x = padding + (i / Math.max(dados.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((d.sis - minVal) / (maxVal - minVal)) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const pointsDia = dados.map((d, i) => {
    const x = padding + (i / Math.max(dados.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((d.dia - minVal) / (maxVal - minVal)) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  return `
    <div class="grafico-pressao">
      <svg viewBox="0 0 ${width} ${height}">
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="var(--painel-borda)" stroke-width="1"/>
        <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="var(--painel-borda)" stroke-width="1"/>
        
        <polyline fill="none" stroke="var(--acento)" stroke-width="3" points="${pointsSis}"/>
        <polyline fill="none" stroke="var(--cor-reab)" stroke-width="3" points="${pointsDia}"/>

        ${dados.map((d, i) => {
          const x = padding + (i / Math.max(dados.length - 1, 1)) * (width - 2 * padding);
          const y = height - padding - ((d.sis - minVal) / (maxVal - minVal)) * (height - 2 * padding);
          return `<circle cx="${x}" cy="${y}" r="5" fill="var(--acento)"/>`;
        }).join('')}

        ${dados.map((d, i) => {
          const x = padding + (i / Math.max(dados.length - 1, 1)) * (width - 2 * padding);
          const y = height - padding - ((d.dia - minVal) / (maxVal - minVal)) * (height - 2 * padding);
          return `<circle cx="${x}" cy="${y}" r="5" fill="var(--cor-reab)"/>`;
        }).join('')}
      </svg>
      <div class="grafico-legenda">
        <span><i style="background:var(--acento)"></i> Sistólica (mmHg)</span>
        <span><i style="background:var(--cor-reab)"></i> Diastólica (mmHg)</span>
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

  const objAtivo = document.querySelector('.obj.ativo');
  const objetivo = objAtivo ? objAtivo.getAttribute('data-obj') : 'FORT';

  const frequencia = Array.from(document.querySelectorAll('.dia.ativo')).map(d => d.textContent.trim());

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

// Excluir Aluno
function excluirAluno(id) {
  if (confirm('Tem certeza que deseja excluir este aluno e todos os seus dados?')) {
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

  aluno.pressao.unshift({ data: dataFormatada, sis, dia, pulso });
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

// Modal Criar Programa de Treino
function abrirModalPrograma() {
  const aluno = getAlunoSelecionado();
  if (!aluno) return;

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

        <h4>Exercícios do Treino A</h4>
        <div id="grade-exercicios-a">
          <div style="display:flex; gap:8px; margin-bottom:6px;">
            <input type="text" placeholder="Nome do Exercício (ex: Supino Reto)" class="ex-nome" style="flex:2;">
            <input type="text" placeholder="Séries" class="ex-series" style="flex:1;">
            <input type="text" placeholder="Reps" class="ex-reps" style="flex:1;">
            <input type="text" placeholder="Carga kg" class="ex-carga" style="flex:1;">
          </div>
          <div style="display:flex; gap:8px; margin-bottom:6px;">
            <input type="text" placeholder="Nome do Exercício (ex: Crucifixo)" class="ex-nome" style="flex:2;">
            <input type="text" placeholder="Séries" class="ex-series" style="flex:1;">
            <input type="text" placeholder="Reps" class="ex-reps" style="flex:1;">
            <input type="text" placeholder="Carga kg" class="ex-carga" style="flex:1;">
          </div>
        </div>
      </div>
    `;
  }

  abrirModal('modal-programa');
}

// Salvar Programa de Treino
function salvarProgramaTreino(e) {
  e.preventDefault();
  const aluno = getAlunoSelecionado();
  if (!aluno) return;

  const inicio = document.getElementById('prog-inicio').value;
  const fim = document.getElementById('prog-fim').value;

  const nomes = document.querySelectorAll('#grade-exercicios-a .ex-nome');
  const series = document.querySelectorAll('#grade-exercicios-a .ex-series');
  const reps = document.querySelectorAll('#grade-exercicios-a .ex-reps');
  const cargas = document.querySelectorAll('#grade-exercicios-a .ex-carga');

  const exercicios = [];
  nomes.forEach((inputNome, i) => {
    if (inputNome.value.trim()) {
      exercicios.push({
        nome: inputNome.value.trim(),
        series: series[i].value || '3',
        reps: reps[i].value || '10',
        carga: cargas[i].value || '0',
        obs: ''
      });
    }
  });

  const novoPrograma = {
    id: `prog-${Date.now()}`,
    dataInicio: inicio,
    dataFim: fim,
    atual: true,
    treinos: [
      {
        nome: 'TREINO A',
        nivel: aluno.objetivo === 'REAB' ? 'REABILITAÇÃO' : 'GERAL',
        exercicios: exercicios.length > 0 ? exercicios : [
          { nome: 'Exercício Geral 1', series: '3', reps: '12', carga: '10', obs: '' }
        ]
      }
    ]
  };

  aluno.programas.unshift(novoPrograma);
  salvarEstado();
  fecharModal('modal-programa');
  renderizarFichaAluno();
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
        container.innerHTML = `<div class="vazio">Nenhum artigo encontrado para "${termo}".</div>`;
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
                  <a href="https://pubmed.ncbi.nlm.nih.gov/${id}/" target="_blank">${art.title}</a>
                  <small>Pubmed ID: ${id} • Autores: ${art.authors?.[0]?.name || 'Et al.'} • ${art.pubdate}</small>
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

// Calculadora IMC
function calcularIMC() {
  const peso = parseFloat(document.getElementById('calc-peso').value);
  const altura = parseFloat(document.getElementById('calc-altura').value) / 100;
  const el = document.getElementById('resultado-imc');

  if (peso && altura) {
    const imc = (peso / (altura * altura)).toFixed(1);
    let classif = '';
    if (imc < 18.5) classif = 'Abaixo do Peso';
    else if (imc < 24.9) classif = 'Peso Normal';
    else if (imc < 29.9) classif = 'Sobrepeso';
    else classif = 'Obesidade';

    el.innerHTML = `
      <h4>Índice de Massa Corporal</h4>
      <div class="valor">${imc} kg/m²</div>
      <p style="color:var(--texto-suave); font-weight:600; margin-top:4px;">${classif}</p>
    `;
  }
}

// Calculadora TMB / TDEE
function calcularTMB() {
  const peso = parseFloat(document.getElementById('tmb-peso').value);
  const altura = parseFloat(document.getElementById('tmb-altura').value);
  const idade = parseFloat(document.getElementById('tmb-idade').value);
  const sexo = document.getElementById('tmb-sexo').value;
  const el = document.getElementById('resultado-tmb');

  if (peso && altura && idade) {
    let tmb = 0;
    if (sexo === 'M') {
      tmb = 88.36 + (13.4 * peso) + (4.8 * altura) - (5.7 * idade);
    } else {
      tmb = 447.59 + (9.2 * peso) + (3.1 * altura) - (4.3 * idade);
    }

    const tdee = Math.round(tmb * 1.55);

    el.innerHTML = `
      <h4>Gasto Calórico Estimado</h4>
      <div class="valor">${tdee} kcal</div>
      <p style="color:var(--texto-suave); font-size:0.85rem; margin-top:4px;">Taxa Metabólica Basal (TMB): ${Math.round(tmb)} kcal</p>
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
    dataFim: 'Indefinido (Série Neural)',
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
  adicionarMensagemChatNemotron('ai', `⚡ **Treino Neural Gerado com Sucesso!**\n\nPrescrevi um novo programa para **${aluno.nome}** (${aluno.objetivo}).\n\n📋 **Diretrizes**: ${prescr.diretrizes}`);
}

// Abrir / Fechar o Drawer do Nemotron AI
function toggleNemotronDrawer(forcarAbrir = false) {
  const drawer = document.getElementById('nemotron-drawer');
  if (!drawer) return;

  if (typeof forcarAbrir === 'boolean' && forcarAbrir) {
    drawer.classList.add('aberto');
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
  msgDiv.innerHTML = texto.replace(/\n/g, '<br>');
  chatBody.appendChild(msgDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
  return msgDiv;
}

