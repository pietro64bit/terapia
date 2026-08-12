// ==========================================
// FUNÇÕES DO DIÁRIO DE ANOTAÇÕES
// ==========================================

async function salvarNotaDiario(event) {
    event.preventDefault();

    const inputTexto = document.getElementById('texto-diario');

    if (!inputTexto) {
        alert('Campo de texto do diário não encontrado.');
        return;
    }

    const texto = inputTexto.value.trim();

    if (!texto) {
        alert('Por favor, escreva alguma anotação antes de salvar!');
        return;
    }

    try {
        // Envia a anotação para a API em memória no Node.js
        const resposta = await fetch('http://localhost:3000/api/diario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: texto })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert(dados.mensagem);
            inputTexto.value = ''; // Limpa a caixa de texto
            adicionarNotaNaTela(dados.nota);
        } else {
            alert(dados.erro || 'Erro ao salvar anotação.');
        }
    } catch (erro) {
        console.error('Erro de conexão com a API:', erro);
        alert('Servidor desconectado! Certifique-se de que a API está rodando no terminal.');
    }
}

// Função para renderizar a nota adicionada na lista visual
function adicionarNotaNaTela(nota) {
    const listaNotas = document.getElementById('lista-diario');
    if (!listaNotas) return;

    const item = document.createElement('li');
    item.className = 'item-diario';

    const dataFormatada = new Date(nota.data).toLocaleString('pt-BR');

    item.innerHTML = `
        <p class="texto-nota">${nota.texto}</p>
        <span class="data-nota">${dataFormatada}</span>
    `;

    // Insere o novo item no topo da lista
    listaNotas.prepend(item);
}

// Inicializa os ouvintes do diário ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const formDiario = document.getElementById('form-diario');
    if (formDiario) {
        formDiario.addEventListener('submit', salvarNotaDiario);
    }
});