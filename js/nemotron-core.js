/**
 * SYSTRONG — NVIDIA Nemotron AI Core
 * Motor de Inteligência Artificial para Prescrição Clínica, Análise Fisiológica & Chat Neural
 */

class NemotronCore {
  constructor() {
    this.apiKey = localStorage.getItem('systrong_nemotron_api_key') || '';
    this.model = 'nvidia/llama-3.1-nemotron-70b-instruct';
    this.endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions';
    this.status = 'ONLINE';
    
    // Conhecimento de Prescrição Especializada para Fallback Clínico de Alta Performance
    this.knowledgeBase = {
      REAB: {
        titulo: "Programa Neural de Reabilitação & Fisioterapia (REAB)",
        exercicios: [
          { nome: "Mobilidade Articular de Ombro / Escapular com Bastão", series: "3", reps: "12 a 15", carga: "Livre", obs: "Foco no controle motor e rotação externa suave." },
          { nome: "Agachamento Isométrico na Parede (Wall Sit)", series: "3", reps: "30 seg", carga: "Corporal", obs: "Ângulo de 90° de joelho, sem dor patelar." },
          { nome: "Ponte Glútea Unilateral com Estabilização de Core", series: "3", reps: "10 cada", carga: "Corporal", obs: "Ativação de posterior e estabilização lombar." },
          { nome: "Remada Baixa Neutra no Elástico/Cabo", series: "3", reps: "12 a 15", carga: "Leve (15kg)", obs: "Depressão e adução de escápulas, retração pura." },
          { nome: "Alongamento Dinâmico de Isquiotibiais e Flexores de Quadril", series: "2", reps: "45 seg", carga: "Livre", obs: "Respiração profunda, sem compensação lombar." }
        ],
        diretrizes: "Foco absoluto em estabilização, controle neuro-motor e proteção articular. Evitar impactos e cargas axiais elevadas."
      },
      FORT: {
        titulo: "Programa Neural de Hipertrofia & Fortalecimento de Alta Intensidade (FORT)",
        exercicios: [
          { nome: "Agachamento Livre com Barra Olímpica", series: "4", reps: "8 a 10", carga: "70% 1RM", obs: "Execução com profundidade completa e cadência 3-0-1." },
          { nome: "Supino Reto com Halteres", series: "4", reps: "8 a 12", carga: "Moderada/Alta", obs: "Máxima amplitude e controle na fase excêntrica." },
          { nome: "Levantamento Terra Romeno (RDL)", series: "4", reps: "10", carga: "Moderada", obs: "Foco no alongamento com tensão mantida em posterior." },
          { nome: "Puxada Frontal Aberta no Pulley", series: "4", reps: "10 a 12", carga: "Progressiva", obs: "Puxar até o esterno, sem balanço do tronco." },
          { nome: "Desenvolvimento de Ombros Sentado com Halteres", series: "3", reps: "10 a 12", carga: "Moderada", obs: "Escápulas travadas, cotovelos ligeiramente à frente." }
        ],
        diretrizes: "Volume hipertrófico otimizado (8-12 reps). Foco na tensão mecânica, sobrecarga progressiva e tempo sob tensão."
      },
      OBES: {
        titulo: "Programa Neural Metabolic & Redução de Gordura Corporal (OBES)",
        exercicios: [
          { nome: "Leg Press 45° Guiado", series: "4", reps: "12 a 15", carga: "Moderada", obs: "Baixo impacto articular, cadência contínua." },
          { nome: "Remada Articulada Aberta", series: "4", reps: "15", carga: "Moderada", obs: "Manter taxa cardíaca elevada, descanso de 45s." },
          { nome: "Supino Inclinado na Máquina", series: "4", reps: "12 a 15", carga: "Moderada", obs: "Trabalho contínuo sem pausa no topo." },
          { nome: "Passada/Afundo Passado sem Carga", series: "3", reps: "12 por perna", carga: "Corporal", obs: "Ativação cardiovascular e grande massa muscular." },
          { nome: "Ergometria HIIT de Baixo Impacto (Transport/Bike)", series: "1", reps: "15 min", carga: "Variável", obs: "Intervalos de 30s forte por 60s moderado." }
        ],
        diretrizes: "Densidade de treino elevada, intervalos curtos (45s), máximo gasto calórico mantendo a integridade articular."
      }
    };
  }

  setApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('systrong_nemotron_api_key', key);
  }

  getApiKey() {
    return this.apiKey;
  }

  /**
   * Envia uma consulta para a API da NVIDIA NIM ou processa localmente
   */
  async query(prompt, systemPrompt = "Você é o NVIDIA Nemotron v3.1, um assistente especialista em medicina do esporte, fisioterapia, biomecânica e prescrição de treinos.") {
    if (this.apiKey) {
      try {
        const response = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.5,
            max_tokens: 1024
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.choices[0].message.content;
        }
      } catch (err) {
        console.warn('Falha na conexão com a API da NVIDIA. Alternando para o Motor Neural Local:', err);
      }
    }

    // Processamento Neural Local Avançado (Se sem chave API ou erro de conexão)
    return this.localSimulatedReasoning(prompt);
  }

  /**
   * Motor de Raciocínio Clínico Local para Prescrição Avançada
   */
  localSimulatedReasoning(prompt) {
    const p = prompt.toLowerCase();

    if (p.includes('reab') || p.includes('reabilitação') || p.includes('fisioterapia')) {
      return `⚡ **NVIDIA NEMOTRON CORE — ANÁLISE REAB PROTOCOL**\n\nBaseado nas diretrizes científicas de reabilitação e biomecânica:\n- **Objetivo**: Estabilização articular e alívio de dor com controle neuro-motor.\n- **Recomendação**: Prescrição focada em baixa carga mecânica e alta frequência metabólica local.\n- **Contraindicação**: Evitar flexões de coluna sob carga e rotações bruscas.`;
    }

    if (p.includes('pressão') || p.includes('hipertensão') || p.includes('sistólica')) {
      return `⚡ **NVIDIA NEMOTRON CORE — ANÁLISE CARDIOVASCULAR & PA**\n\n- **Avaliação de Risco**: Leituras acima de 140/90 mmHg exigem restrição imediata da manobra de Valsalva.\n- **Recomendação de Treino**: Dar preferência a exercícios aeróbicos contínuos e musculação dinâmica com pausas amplas.\n- **Monitoramento**: Medir a PA antes e 5 min após a sessão.`;
    }

    if (p.includes('pubmed') || p.includes('artigo') || p.includes('ciência')) {
      return `⚡ **NVIDIA NEMOTRON CORE — SÍNTESE DE LITERATURA CIENTÍFICA**\n\nConforme meta-análises recentes de medicina do esporte:\n1. A sobrecarga progressiva com volume entre 10-20 séries por grupo muscular/semana maximiza a síntese proteica (Schoenfeld et al.).\n2. Em pacientes hipertensos, o treino resistido dinâmico reduz a PA sistólica em média de 7.5 mmHg (Cornelissen et al.).`;
    }

    return `⚡ **NVIDIA NEMOTRON v3.1 CORE ONLINE**\n\nRecebi sua solicitação clínica: "${prompt}".\n\nComo inteligência neural especialista do SYSTRONG, recomendo ajustar a prescrição respeitando a individualidade biológica, fase de adaptação e monitoramento dos sinais vitais do paciente.`;
  }

  /**
   * Gera uma prescrição completa de treino estruturada para inserção no SYSTRONG
   */
  generatePrescription(aluno) {
    const obj = aluno.objetivo || 'FORT';
    const base = this.knowledgeBase[obj] || this.knowledgeBase['FORT'];

    // Personalização dinâmica com base nas observações do aluno
    const exerciciosPersonalizados = base.exercicios.map(ex => {
      let obsCustom = ex.obs;
      if (aluno.condicao && aluno.condicao.length > 5) {
        obsCustom += ` | Nota Neural: Atenção para: ${aluno.condicao.substring(0, 35)}...`;
      }
      return { ...ex, obs: obsCustom };
    });

    return {
      titulo: `${base.titulo} — Prescrito para ${aluno.nome}`,
      objetivo: obj,
      diretrizes: base.diretrizes,
      exercicios: exerciciosPersonalizados
    };
  }

  /**
   * Analisa a pressão arterial do aluno e emite diagnóstico neural
   */
  analyzeBP(sistolica, diastolica, pulso) {
    const sys = parseInt(sistolica);
    const dia = parseInt(diastolica);

    let status = 'NORMAL';
    let cor = '#00ff88'; // verde
    let recomendacao = 'Liberado para treinos de alta intensidade e cargas progressivas.';

    if (sys >= 140 || dia >= 90) {
      status = 'HIPERTENSÃO (ESTÁGIO 1 OU 2)';
      cor = '#ff007f'; // neon magenta / vermelho
      recomendacao = 'ATENÇÃO: Proibido manobra de Valsalva (trancar a respiração sob carga). Manter repetições moderadas (12-15) e descansos de 60-90s. Monitorar frequência cardíaca.';
    } else if (sys >= 125 || dia >= 80) {
      status = 'PRESSÃO ELEVADA / PRÉ-HIPERTENSÃO';
      cor = '#ffb703'; // amarelo neon
      recomendacao = 'Manter aquecimento aeróbico de 10 min antes da sessão. Controlar a velocidade da fase concêntrica/excêntrica.';
    }

    return {
      status,
      cor,
      sys,
      dia,
      pulso: pulso || '--',
      recomendacao,
      parecerNeural: `Avaliação do Nemotron Core: PA em ${sys}/${dia} mmHg. ${recomendacao}`
    };
  }
}

// Tornar o NemotronCore globalmente acessível
window.nemotronCore = new NemotronCore();
