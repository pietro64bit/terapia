/**
 * Master Mind - Módulo de Cadastro de Usuários e Especialistas
 * Integração com Firebase, LocalStorage e API SQLite.
 */

// -------------------------------------------------------------
// CADASTRO GERAL (PACIENTES / USUÁRIOS)
// -------------------------------------------------------------
async function fazerCadastro(event) {
    if (event) event.preventDefault();

    const inputNome = document.getElementById('nome-cadastro');
    const inputEmail = document.getElementById('email-cadastro');
    const inputSenha = document.getElementById('senha-cadastro');
    const radioTipo = document.querySelector('input[name="tipo_conta"]:checked');

    if (!inputNome || !inputEmail || !inputSenha) {
        alert('Erro: Campos do formulário de cadastro não foram encontrados.');
        return;
    }

    const nome = inputNome.value.trim();
    const email = inputEmail.value.trim().toLowerCase();
    const senha = inputSenha.value.trim();
    const tipo = radioTipo ? radioTipo.value : 'paciente';

    if (!nome || !email || !senha) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return;
    }

    const btnSubmit = document.querySelector('#form-cadastro button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Cadastrando...';
    }

    try {
        const novoUsuario = { nome, email, senha, tipo, dataCriacao: new Date().toISOString() };

        // 1. Salva no registro local
        const usuariosLocais = JSON.parse(localStorage.getItem('mastermind_usuarios') || '[]');
        if (usuariosLocais.some(u => u.email === email)) {
            alert('Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.');
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'Cadastrar';
            }
            return;
        }

        usuariosLocais.push(novoUsuario);
        localStorage.setItem('mastermind_usuarios', JSON.stringify(usuariosLocais));

        // 2. Se for profissional, já adiciona aos profissionais
        if (tipo === 'profissional') {
            await window.DB.cadastrarProfissional({
                nome: nome.startsWith('Dr') ? nome : `Dr(a). ${nome}`,
                email: email,
                especialidade: 'Clínica Geral / Saúde Mental',
                modalidade: 'online',
                descricao: 'Profissional recém-cadastrado no Master Mind.'
            });
            if (typeof carregarProfissionais === 'function') {
                carregarProfissionais();
            }
        }

        // 3. Tenta salvar na API Node.js/SQLite
        try {
            fetch('http://localhost:3000/api/cadastro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoUsuario)
            }).catch(() => {});
        } catch (_) {}

        alert(`Cadastro realizado com sucesso, ${nome}! Agora você já pode acessar sua conta.`);
        
        // Limpa formulário
        inputNome.value = '';
        inputEmail.value = '';
        inputSenha.value = '';

        fecharModal('modal-cadastro');
        abrirModal('modal-login');

        // Pré-preenche e-mail no login
        const emailLogin = document.getElementById('email-login');
        if (emailLogin) emailLogin.value = email;

    } catch (erro) {
        console.error('Erro no cadastro:', erro);
        alert('Erro ao realizar cadastro. Tente novamente.');
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Cadastrar';
        }
    }
}

// -------------------------------------------------------------
// CADASTRO DEDICADO DE PROFISSIONAIS DA SAÚDE
// -------------------------------------------------------------
async function salvarProfissionalModal(event) {
    if (event) event.preventDefault();

    const nome = document.getElementById('prof-modal-nome')?.value.trim();
    const email = document.getElementById('prof-modal-email')?.value.trim().toLowerCase();
    const senha = document.getElementById('prof-modal-senha')?.value.trim();
    const especialidade = document.getElementById('prof-modal-especialidade')?.value.trim();
    const crpCrm = document.getElementById('prof-modal-crp')?.value.trim();
    const whatsapp = document.getElementById('prof-modal-whatsapp')?.value.trim();
    const modalidade = document.getElementById('prof-modal-modalidade')?.value || 'online';
    const descricao = document.getElementById('prof-modal-descricao')?.value.trim();

    if (!nome || !email || !especialidade) {
        alert('Por favor, preencha os campos obrigatórios (Nome, E-mail e Especialidade)!');
        return;
    }

    try {
        const dadosProf = {
            nome: nome.startsWith('Dr') ? nome : `Dr(a). ${nome}`,
            email,
            senha,
            especialidade,
            crp_crm: crpCrm || 'CRP/CRM em Análise',
            telefone: whatsapp || '(19) 98991-2719',
            whatsapp: whatsapp || '5519989912719',
            modalidade,
            descricao
        };

        await window.DB.cadastrarProfissional(dadosProf);

        // Também cadastra como usuário profissional para poder fazer login
        const usuarios = JSON.parse(localStorage.getItem('mastermind_usuarios') || '[]');
        if (!usuarios.some(u => u.email === email)) {
            usuarios.push({
                nome: dadosProf.nome,
                email,
                senha: senha || '123456',
                tipo: 'profissional',
                especialidade
            });
            localStorage.setItem('mastermind_usuarios', JSON.stringify(usuarios));
        }

        alert(`Especialista ${dadosProf.nome} cadastrado com sucesso! Seu perfil já está visível para os pacientes.`);

        // Limpa formulário e fecha modal
        document.getElementById('form-modal-prof')?.reset();
        fecharModal('modal-cadastro-profissional');

        // Recarrega lista
        if (typeof carregarProfissionais === 'function') {
            await carregarProfissionais();
        }

    } catch (e) {
        console.error('Erro ao cadastrar profissional:', e);
        alert('Não foi possível salvar o profissional. Tente novamente.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', fazerCadastro);
    }

    const formProf = document.getElementById('form-modal-prof');
    if (formProf) {
        formProf.addEventListener('submit', salvarProfissionalModal);
    }
});

window.fazerCadastro = fazerCadastro;
window.salvarProfissionalModal = salvarProfissionalModal;