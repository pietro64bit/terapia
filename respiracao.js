/**
 * Master Mind - Controlador Interativo de Respiração Quadrada (Box Breathing)
 * Permite Pausar, Retomar, Reiniciar, além de exibir contagem regressiva
 * precisa de cada fase (Inspire 4s, Segure 4s, Expire 4s, Aguarde 4s).
 */

const ControladorRespiracao = {
    estaPausado: false,
    faseAtualIndex: 0,
    segundosRestantesNaFase: 4,
    intervaloId: null,
    totalCiclos: 0,

    fases: [
        { nome: 'Inspire', duracao: 4, classe: 'fase-inspirar', escala: 2.2, corFundo: '#a8e6cf', instrucao: 'Puxe o ar suavemente pelas narinas enchendo o abdômen.' },
        { nome: 'Segure', duracao: 4, classe: 'fase-segurar-cheio', escala: 2.2, corFundo: '#ffeaa7', instrucao: 'Mantenha os pulmões cheios e relaxe os ombros.' },
        { nome: 'Expire', duracao: 4, classe: 'fase-expirar', escala: 1.0, corFundo: '#fab1a0', instrucao: 'Solte o ar devagar pela boca esvaziando todo o ar.' },
        { nome: 'Aguarde', duracao: 4, classe: 'fase-aguardar-vazio', escala: 1.0, corFundo: '#81ecec', instrucao: 'Fique em repouso com os pulmões vazios antes do próximo ciclo.' }
    ],

    iniciar() {
        this.estaPausado = false;
        this.faseAtualIndex = 0;
        this.segundosRestantesNaFase = this.fases[0].duracao;
        this.aplicarFaseVisual(this.fases[0]);
        this.iniciarTick();
        this.atualizarBotaoPausa();
    },

    iniciarTick() {
        if (this.intervaloId) clearInterval(this.intervaloId);

        this.intervaloId = setInterval(() => {
            if (this.estaPausado) return;

            this.segundosRestantesNaFase--;
            this.atualizarContadorVisual();

            if (this.segundosRestantesNaFase <= 0) {
                // Passa para a próxima fase
                this.faseAtualIndex++;
                if (this.faseAtualIndex >= this.fases.length) {
                    this.faseAtualIndex = 0;
                    this.totalCiclos++;
                    this.atualizarContadorCiclos();
                }

                const proximaFase = this.fases[this.faseAtualIndex];
                this.segundosRestantesNaFase = proximaFase.duracao;
                this.aplicarFaseVisual(proximaFase);
            }
        }, 1000);
    },

    alternarPausa() {
        this.estaPausado = !this.estaPausado;
        const circulo = document.getElementById('circulo-pulsante');
        
        if (this.estaPausado) {
            if (circulo) circulo.classList.add('pausado');
            console.log('⏸️ [Respiração] Exercício pausado.');
        } else {
            if (circulo) circulo.classList.remove('pausado');
            console.log('▶️ [Respiração] Exercício retomado.');
        }

        this.atualizarBotaoPausa();
    },

    reiniciar() {
        this.faseAtualIndex = 0;
        this.segundosRestantesNaFase = this.fases[0].duracao;
        this.estaPausado = false;

        const circulo = document.getElementById('circulo-pulsante');
        if (circulo) circulo.classList.remove('pausado');

        this.aplicarFaseVisual(this.fases[0]);
        this.iniciarTick();
        this.atualizarBotaoPausa();
        console.log('🔄 [Respiração] Exercício reiniciado.');
    },

    aplicarFaseVisual(fase) {
        const circulo = document.getElementById('circulo-pulsante');
        const rotuloFase = document.getElementById('respiracao-nome-fase');
        const dicaFase = document.getElementById('respiracao-dica-fase');

        if (rotuloFase) {
            rotuloFase.textContent = `${fase.nome} (${this.segundosRestantesNaFase}s)`;
        }

        if (dicaFase) {
            dicaFase.textContent = fase.instrucao;
        }

        if (circulo) {
            circulo.style.transition = `transform ${fase.duracao}s ease-in-out, background-color ${fase.duracao}s ease-in-out`;
            circulo.style.transform = `scale(${fase.escala})`;
            circulo.style.backgroundColor = fase.corFundo;
        }

        this.atualizarContadorVisual();
    },

    atualizarContadorVisual() {
        const rotuloFase = document.getElementById('respiracao-nome-fase');
        const contagemRegressiva = document.getElementById('respiracao-cronometro');
        const fase = this.fases[this.faseAtualIndex];

        if (rotuloFase && fase) {
            rotuloFase.textContent = `${fase.nome} (${this.segundosRestantesNaFase}s)`;
        }

        if (contagemRegressiva) {
            contagemRegressiva.textContent = `${this.segundosRestantesNaFase}s`;
        }
    },

    atualizarBotaoPausa() {
        const btnPausar = document.getElementById('btn-toggle-respiracao');
        const textoBtn = document.getElementById('texto-btn-respiracao');
        const iconeBtn = document.getElementById('icone-btn-respiracao');

        if (btnPausar && textoBtn && iconeBtn) {
            if (this.estaPausado) {
                textoBtn.textContent = 'Continuar';
                iconeBtn.className = 'fa-solid fa-play';
                btnPausar.classList.add('btn-pausado');
            } else {
                textoBtn.textContent = 'Pausar';
                iconeBtn.className = 'fa-solid fa-pause';
                btnPausar.classList.remove('btn-pausado');
            }
        }
    },

    atualizarContadorCiclos() {
        const spanCiclos = document.getElementById('contador-ciclos-respiracao');
        if (spanCiclos) {
            spanCiclos.textContent = `${this.totalCiclos} ${this.totalCiclos === 1 ? 'ciclo concluído' : 'ciclos concluídos'}`;
        }
    }
};

// Vincula controles quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Inicia controlador automaticamente
    ControladorRespiracao.iniciar();

    const btnToggle = document.getElementById('btn-toggle-respiracao');
    if (btnToggle) {
        btnToggle.addEventListener('click', () => ControladorRespiracao.alternarPausa());
    }

    const btnReset = document.getElementById('btn-reset-respiracao');
    if (btnReset) {
        btnReset.addEventListener('click', () => ControladorRespiracao.reiniciar());
    }
});

window.ControladorRespiracao = ControladorRespiracao;
