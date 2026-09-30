/**
 * Master Mind - Módulo de Autenticação e Controle de Interface
 */

// ==========================================
// CONTROLES DOS MODAIS
// ==========================================
function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('ativo');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Impede scroll ao fundo
    } else {
        console.warn(`[Modal] Elemento #${id} não encontrado.`);
    }
}

function fecharModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('ativo');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function alternarAuth(modalFechar, modalAbrir) {
    fecharModal(modalFechar);
    abrirModal(modalAbrir);
}

// Fecha modal clicando fora da caixa
window.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal-auth')) {
        fecharModal(e.target.id);
    }
});

// ==========================================
// NAVEGAÇÃO DE ABAS
// ==========================================
function mudarAba(abaId) {
    const abas = document.querySelectorAll('.aba-conteudo');
    const botoes = document.querySelectorAll('.aba-btn');

    abas.forEach(aba => aba.classList.remove('ativa'));
    botoes.forEach(btn => btn.classList.remove('ativa'));

    const abaAlvo = document.getElementById(abaId);
    if (abaAlvo) {
        abaAlvo.classList.add('ativa');
    }

    botoes.forEach(btn => {
        const attr = btn.getAttribute('onclick');
        if (attr && attr.includes(abaId)) {
            btn.classList.add('ativa');
        }
    });

    // Se mudou para a aba de respiração, garante que os controles estão sincronizados
    if (abaId === 'respiracao' && window.ControladorRespiracao) {
        window.ControladorRespiracao.atualizarContadorVisual();
    }
}

// ==========================================
// AUTENTICAÇÃO COM SUPORTE HÍBRIDO (API + LOCAL + FIREBASE)
// ==========================================
async function fazerLogin(event) {
    if (event) event.preventDefault();

    const inputUsuario = document.getElementById('email-login');
    const inputSenha = document.getElementById('senha-login');

    if (!inputUsuario || !inputSenha) {
        alert('Erro nos campos de login.');
        return;
    }

    const usuario = inputUsuario.value.trim().toLowerCase();
    const senha = inputSenha.value.trim();

    if (!usuario || !senha) {
        alert('Por favor, informe seu usuário/e-mail e sua senha.');
        return;
    }

    const btnEntrar = document.querySelector('#form-login button[type="submit"]');
    if (btnEntrar) {
        btnEntrar.disabled = true;
        btnEntrar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Entrando...';
    }

    try {
        // 1. Caso especial: Usuário de teste Dr. ZokaAlan
        if ((usuario === 'zokaalan' || usuario === 'zokaalan@mastermind.com') && senha === 'admin') {
            efetuarLoginSucesso('Dr. ZokaAlan', 'profissional', 'Neurologia', 'zokaalan@mastermind.com');
            fecharModal('modal-login');
            return;
        }

        // 2. Tenta autenticar via API Node.js/SQLite
        let autenticadoApi = false;
        try {
            const resp = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: usuario, senha })
            });

            if (resp.ok) {
                const dados = await resp.json();
                efetuarLoginSucesso(dados.usuario.nome, dados.usuario.tipo, dados.usuario.especialidade || '', usuario);
                fecharModal('modal-login');
                autenticadoApi = true;
                return;
            }
        } catch (_) {}

        if (autenticadoApi) return;

        // 3. Fallback no banco local (usuários cadastrados no navegador)
        const usuariosLocais = JSON.parse(localStorage.getItem('mastermind_usuarios') || '[]');
        const usuarioEncontrado = usuariosLocais.find(u => (u.email === usuario || u.nome.toLowerCase() === usuario) && u.senha === senha);

        if (usuarioEncontrado) {
            efetuarLoginSucesso(usuarioEncontrado.nome, usuarioEncontrado.tipo || 'paciente', usuarioEncontrado.especialidade || '', usuarioEncontrado.email);
            fecharModal('modal-login');
            return;
        }

        alert('E-mail ou senha incorretos! Verifique suas credenciais ou crie uma nova conta.');

    } catch (err) {
        console.error('Erro no login:', err);
        alert('Não foi possível efetuar o login. Tente novamente.');
    } finally {
        if (btnEntrar) {
            btnEntrar.disabled = false;
            btnEntrar.innerHTML = 'Entrar';
        }
    }
}

function efetuarLoginSucesso(nome, tipoConta, especialidade, email = '') {
    const dadosUsuario = { nome, tipoConta, especialidade, email, loginEm: new Date().toISOString() };
    window.DB.salvarSessaoUsuario(dadosUsuario);

    const areaNav = document.getElementById('area-autenticacao');
    const painelProf = document.getElementById('painel-exclusivo-profissional');
    const bannerBoasVindas = document.getElementById('banner-usuario-logado');

    if (areaNav) {
        const inicial = nome.replace(/^(Dr\.|Dra\.)\s*/, '').charAt(0).toUpperCase() || 'U';
        const iconeTipo = tipoConta === 'profissional' ? '<i class="fa-solid fa-user-doctor"></i>' : inicial;

        areaNav.innerHTML = `
            <div class="perfil-logado">
                <div class="avatar-header" title="${nome}">${iconeTipo}</div>
                <div class="info-usuario-nav">
                    <span class="nome-usuario">${nome}</span>
                    <span class="badge-nav-tipo">${tipoConta === 'profissional' ? 'Especialista' : 'Paciente'}</span>
                </div>
                <button class="btn-sair" onclick="fazerLogout()" title="Sair da conta">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        `;
    }

    if (bannerBoasVindas) {
        bannerBoasVindas.style.display = 'block';
        bannerBoasVindas.innerHTML = `
            <div class="banner-box">
                <span>👋 Bem-vindo(a) de volta, <strong>${nome}</strong>! Seus registros e progresso estão sendo salvos com segurança.</span>
            </div>
        `;
    }

    if (tipoConta === 'profissional') {
        if (painelProf) {
            painelProf.style.display = 'block';
            const nomeProfDisplay = document.getElementById('nome-prof-display');
            if (nomeProfDisplay) nomeProfDisplay.textContent = nome;
        }
        mudarAba('profissionais');
    } else {
        if (painelProf) painelProf.style.display = 'none';
    }

    // Atualiza notas com filtro do usuário
    if (typeof carregarNotasDiario === 'function') {
        carregarNotasDiario();
    }
}

function fazerLogout() {
    window.DB.encerrarSessao();

    const areaNav = document.getElementById('area-autenticacao');
    const painelProf = document.getElementById('painel-exclusivo-profissional');
    const bannerBoasVindas = document.getElementById('banner-usuario-logado');

    if (areaNav) {
        areaNav.innerHTML = `
            <button class="btn-login-nav" onclick="abrirModal('modal-login')">
                <i class="fa-solid fa-user-lock"></i> Entrar
            </button>
        `;
    }

    if (painelProf) painelProf.style.display = 'none';
    if (bannerBoasVindas) bannerBoasVindas.style.display = 'none';

    // Recarrega notas do modo anônimo
    if (typeof carregarNotasDiario === 'function') {
        carregarNotasDiario();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Restaura sessão salva
    const usuarioSalvo = window.DB.obterUsuarioAtual();
    if (usuarioSalvo) {
        efetuarLoginSucesso(usuarioSalvo.nome, usuarioSalvo.tipoConta, usuarioSalvo.especialidade, usuarioSalvo.email);
    }

    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', fazerLogin);
    }
});

window.abrirModal = abrirModal;
window.fecharModal = fecharModal;
window.alternarAuth = alternarAuth;
window.mudarAba = mudarAba;
window.fazerLogin = fazerLogin;
window.fazerLogout = fazerLogout;