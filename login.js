// CONTROLES DOS MODAIS
function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.add('ativo');
        console.log(`[Info] Modal '${id}' aberto com sucesso.`);
    } else {
        console.error(`[Erro] Modal com ID '${id}' não foi encontrado no DOM.`);
    }
}

function fecharModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('ativo');
        console.log(`[Info] Modal '${id}' fechado.`);
    } else {
        console.error(`[Erro] Modal com ID '${id}' não foi encontrado no DOM.`);
    }
}

function alternarAuth(modalFechar, modalAbrir) {
    fecharModal(modalFechar);
    abrirModal(modalAbrir);
}

// TROCA DE ABAS
function mudarAba(abaId) {
    const abas = document.querySelectorAll('.aba-conteudo');
    const botoes = document.querySelectorAll('.aba-btn');
    
    abas.forEach(aba => aba.classList.remove('ativa'));
    botoes.forEach(btn => btn.classList.remove('ativa'));
    
    const abaSelecionada = document.getElementById(abaId);
    if (abaSelecionada) {
        abaSelecionada.classList.add('ativa');
        console.log(`[Navegação] Aba alterada para '${abaId}'.`);
    } else {
        console.error(`[Erro] Aba de destino com ID '${abaId}' não foi encontrada.`);
    }

    botoes.forEach(btn => {
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(abaId)) {
            btn.classList.add('ativa');
        }
    });
}

// LÓGICA DE LOGIN COM SUPORTE AO TESTE "ZOKAALAN / ADMIN" E CAPTURA DE ERROS
function fazerLogin(event) {
    try {
        event.preventDefault();
        
        const inputUsuario = document.getElementById('email-login');
        const inputSenha = document.getElementById('senha-login');

        if (!inputUsuario || !inputSenha) {
            console.error('[Erro Fatal] Elementos de input do formulário de login não foram localizados.');
            return;
        }

        const usuario = inputUsuario.value.trim();
        const senha = inputSenha.value.trim();
        
        if (!usuario || !senha) {
            console.warn('[Aviso] Tentativa de envio de login com campos incompletos.');
            alert('Por favor, preencha todos os campos!');
            return;
        }

        // LOGIN DO TESTE PROFISSIONAL ZOKAALAN
        if ((usuario.toLowerCase() === 'zokaalan' || usuario.toLowerCase() === 'zokaalan@mastermind.com') && senha === 'admin') {
            console.log('[Autenticação] Login como ESPECIALISTA (Dr. ZokaAlan) realizado com sucesso.');
            efetuarLoginSucesso('Dr. ZokaAlan', 'profissional', 'Neurologia');
            fecharModal('modal-login');
            return;
        }
        
        // LOGIN PACIENTE COMUM
        console.log(`[Autenticação] Login comum realizado para o usuário: "${usuario}".`);
        efetuarLoginSucesso(usuario.split('@')[0], 'paciente', '');
        fecharModal('modal-login');

    } catch (erro) {
        console.error('[Erro Inesperado] Falha ao processar o formulário de login:', erro);
    }
}

function efetuarLoginSucesso(nome, tipoConta, especialidade) {
    try {
        const areaNav = document.getElementById('area-autenticacao');
        const painelProf = document.getElementById('painel-exclusivo-profissional');
        
        if (!areaNav) {
            console.error('[Erro UI] O container #area-autenticacao não existe na página.');
            return;
        }

        if (tipoConta === 'profissional') {
            areaNav.innerHTML = `
                <div class="perfil-logado">
                    <div class="avatar-header"><i class="fa-solid fa-user-doctor"></i></div>
                    <div>
                        <strong>${nome}</strong> <i class="fa-solid fa-circle-check selo-verificado-icon" title="Especialista Verificado"></i>
                        <button class="btn-sair" onclick="fazerLogout()">Sair</button>
                    </div>
                </div>
            `;
            
            if (painelProf) {
                painelProf.style.display = 'block';
                console.log('[Painel Profissional] Exibido no topo da aba de profissionais.');
            } else {
                console.warn('[Aviso UI] O container #painel-exclusivo-profissional não foi localizado.');
            }
            
            mudarAba('profissionais');
        } else {
            areaNav.innerHTML = `
                <div class="perfil-logado">
                    <div class="avatar-header">${nome.charAt(0).toUpperCase()}</div>
                    <div>
                        <strong>${nome}</strong>
                        <button class="btn-sair" onclick="fazerLogout()">Sair</button>
                    </div>
                </div>
            `;
            if (painelProf) painelProf.style.display = 'none';
        }
    } catch (erro) {
        console.error('[Erro UI] Ocorreu uma falha ao renderizar a área logada:', erro);
    }
}

function fazerLogout() {
    try {
        const areaNav = document.getElementById('area-autenticacao');
        const painelProf = document.getElementById('painel-exclusivo-profissional');
        
        if (areaNav) {
            areaNav.innerHTML = `
                <button class="btn-login-nav" onclick="abrirModal('modal-login')">
                    <i class="fa-solid fa-user-lock"></i> Entrar
                </button>
            `;
            console.log('[Autenticação] Usuário encerrou a sessão (Logout).');
        } else {
            console.error('[Erro UI] Elemento #area-autenticacao não encontrado ao tentar sair.');
        }
        
        if (painelProf) painelProf.style.display = 'none';
    } catch (erro) {
        console.error('[Erro Inesperado] Falha ao executar logout:', erro);
    }
}