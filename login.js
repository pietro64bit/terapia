// URL base da sua API
const API_URL = 'http://localhost:3000/api';

// ==========================================
// GERENCIAMENTO DE MODAIS (LOGIN / CADASTRO)
// ==========================================

function abrirModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) {
        modal.classList.add('ativo');
    }
}

function fecharModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) {
        modal.classList.remove('ativo');
    }
}

function alternarAuth(modalAtual, proximoModal) {
    fecharModal(modalAtual);
    abrirModal(proximoModal);
}

// Fechar ao clicar fora da modal
window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal-auth')) {
        event.target.classList.remove('ativo');
    }
});

// ==========================================
// TROCA DE ABAS (ESPAÇO DE DESENVOLVIMENTO)
// ==========================================

function mudarAba(idAba) {
    // Remove classe ativa de todas as abas e botões
    const conteudos = document.querySelectorAll('.aba-conteudo');
    const botoes = document.querySelectorAll('.aba-btn');

    conteudos.forEach(c => c.classList.remove('ativa'));
    botoes.forEach(b => b.classList.remove('ativa'));

    // Ativa a aba e o botão correspondente
    const abaSelecionada = document.getElementById(idAba);
    if (abaSelecionada) {
        abaSelecionada.classList.add('ativa');
    }

    // Marca o botão certo como ativo
    const btnAtivo = Array.from(botoes).find(b => b.getAttribute('onclick').includes(idAba));
    if (btnAtivo) {
        btnAtivo.classList.add('ativa');
    }
}

// ==========================================
// INTEGRAÇÃO COM O BACKEND E BANCO DOCKER
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

    // 1. FORMULÁRIO DE LOGIN
    const formLogin = document.querySelector('#modal-login form');
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email-login').value;
            const senha = document.getElementById('senha-login').value;

            try {
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                const dados = await res.json();

                if (res.ok) {
                    alert('Login efetuado com sucesso!');
                    // Salva o ID do usuário localmente no navegador
                    localStorage.setItem('usuario_id', dados.usuario.id);
                    localStorage.setItem('usuario_email', dados.usuario.email);
                    fecharModal('modal-login');
                } else {
                    alert(dados.erro);
                }
            } catch (err) {
                console.error(err);
                alert('Erro ao conectar com o servidor! Verifique se o server.js está rodando.');
            }
        });
    }

    // 2. FORMULÁRIO DE CADASTRO
    const formCadastro = document.querySelector('#modal-cadastro form');
    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email-cadastro').value;
            const senha = document.getElementById('senha-cadastro').value;

            try {
                const res = await fetch(`${API_URL}/cadastro`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                const dados = await res.json();

                if (res.ok) {
                    alert('Conta cadastrada com sucesso! Faça seu login.');
                    localStorage.setItem('usuario_id', dados.usuario.id);
                    alternarAuth('modal-cadastro', 'modal-login');
                } else {
                    alert(dados.erro);
                }
            } catch (err) {
                console.error(err);
                alert('Erro ao conectar com o servidor!');
            }
        });
    }

    // 3. BOTÃO DE SALVAR DIÁRIO EMOCIONAL
    const btnSalvarDiario = document.querySelector('#diario .contato-btn');
    if (btnSalvarDiario) {
        btnSalvarDiario.addEventListener('click', async () => {
            const textarea = document.querySelector('#diario textarea');
            const texto = textarea.value;
            const usuarioId = localStorage.getItem('usuario_id');

            if (!usuarioId) {
                alert('Você precisa estar logado para salvar seu diário!');
                abrirModal('modal-login');
                return;
            }

            if (!texto.trim()) {
                alert('Escreva algo na caixa de texto antes de salvar.');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/diario`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuario_id: usuarioId, texto })
                });

                const dados = await res.json();

                if (res.ok) {
                    alert('Anotação registrada com sucesso no banco de dados!');
                    textarea.value = ''; // Limpa o campo
                } else {
                    alert(dados.erro);
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão ao tentar salvar o diário.');
            }
        });
    }
});