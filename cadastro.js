// ==========================================
// FUNÇÃO DE CADASTRO DE NOVO USUÁRIO
// ==========================================
async function fazerCadastro(event) {
    if (event) event.preventDefault();

    // Captura os campos do formulário de cadastro
    const inputNome = document.getElementById('nome-cadastro');
    const inputEmail = document.getElementById('email-cadastro');
    const inputSenha = document.getElementById('senha-cadastro');
    const inputTipo = document.getElementById('tipo-cadastro'); // Campo opcional (paciente ou profissional)

    if (!inputNome || !inputEmail || !inputSenha) {
        alert('Erro: Campos do formulário de cadastro não foram encontrados.');
        return;
    }

    const nome = inputNome.value.trim();
    const email = inputEmail.value.trim();
    const senha = inputSenha.value.trim();
    const tipo = inputTipo ? inputTipo.value : 'paciente';

    if (!nome || !email || !senha) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    try {
        // Envia os dados para a API Node.js / SQLite
        const resposta = await fetch('http://localhost:3000/api/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, tipo })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert(dados.mensagem || 'Cadastro realizado com sucesso!');
            
            // Limpa os campos após cadastrar
            inputNome.value = '';
            inputEmail.value = '';
            inputSenha.value = '';

            // Fecha o modal de cadastro e abre o de login (se existirem as funções)
            if (typeof fecharModal === 'function') fecharModal('modal-cadastro');
            if (typeof abrirModal === 'function') abrirModal('modal-login');
        } else {
            alert(dados.erro || 'Erro ao realizar cadastro.');
        }
    } catch (erro) {
        console.error('Erro ao conectar com a API:', erro);
        alert('Erro de conexão. Certifique-se de que rodou "node server.js".');
    }
}

// Associa a função ao formulário assim que a página carrega
document.addEventListener('DOMContentLoaded', () => {
    const formCadastro = document.getElementById('form-cadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', fazerCadastro);
    }
});