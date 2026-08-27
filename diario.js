// Carrega as anotações salvas no banco assim que abre a página
async function carregarNotasDiario() {
    try {
        const resposta = await fetch('http://localhost:3000/api/diario');
        if (resposta.ok) {
            const notas = await resposta.json();
            const listaNotas = document.getElementById('lista-diario');
            if (listaNotas) {
                listaNotas.innerHTML = ''; // Limpa antes de renderizar
                notas.forEach(nota => adicionarNotaNaTela(nota));
            }
        }
    } catch (erro) {
        console.error('Erro ao buscar historico do diário:', erro);
    }
}

// Salva nova anotação
async function salvarNotaDiario(event) {
    event.preventDefault();

    const inputTexto = document.getElementById('texto-diario');
    if (!inputTexto) return;

    const texto = inputTexto.value.trim();
    if (!texto) {
        alert('Por favor, escreva alguma anotação!');
        return;
    }

    try {
        const resposta = await fetch('http://localhost:3000/api/diario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto: texto })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert(dados.mensagem);
            inputTexto.value = '';
            // Recarrega a lista do banco para garantir ordem e persistência
            carregarNotasDiario();
        } else {
            alert(dados.erro || 'Erro ao salvar anotação.');
        }
    } catch (erro) {
        console.error('Erro de conexão com a API:', erro);
        alert('Certifique-se de que a API está rodando no terminal com "node server.js".');
    }
}

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

    listaNotas.appendChild(item);
}

document.addEventListener('DOMContentLoaded', () => {
    carregarNotasDiario();

    const formDiario = document.getElementById('form-diario');
    if (formDiario) {
        formDiario.addEventListener('submit', salvarNotaDiario);
    }
});