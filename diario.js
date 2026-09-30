/**
 * Master Mind - Módulo do Diário Emocional
 * Inclui: Auto-salvamento em tempo real (não perde nada ao sair ou recarregar),
 * persistência permanente no Firebase / LocalStorage, seletor de humor,
 * histórico de anotações com exclusão e exportação.
 */

let humorSelecionado = 'calmo';

// Restaura o rascunho salvo do usuário assim que a página é carregada
function restaurarRascunhoDiario() {
    const textarea = document.getElementById('texto-diario');
    const statusAutosave = document.getElementById('autosave-texto');
    if (!textarea) return;

    const rascunhoSalvo = localStorage.getItem('mastermind_diario_rascunho');
    if (rascunhoSalvo && rascunhoSalvo.trim() !== '') {
        textarea.value = rascunhoSalvo;
        if (statusAutosave) {
            statusAutosave.textContent = 'Rascunho restaurado da sua última sessão.';
        }
        console.log('📝 [Diário] Rascunho não salvo restaurado com sucesso.');
    }

    const humorSalvo = localStorage.getItem('mastermind_diario_humor');
    if (humorSalvo) {
        selecionarHumor(humorSalvo);
    }
}

// Salva em tempo real enquanto o usuário digita
function configurarAutoSave() {
    const textarea = document.getElementById('texto-diario');
    const statusAutosave = document.getElementById('autosave-texto');
    if (!textarea) return;

    let debounceTimer = null;

    textarea.addEventListener('input', () => {
        const texto = textarea.value;
        localStorage.setItem('mastermind_diario_rascunho', texto);

        if (statusAutosave) {
            statusAutosave.innerHTML = '<i class="fa-solid fa-pen-nib"></i> Digitando...';
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            if (statusAutosave) {
                statusAutosave.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #2ecc71;"></i> Salvo automaticamente às ${agora}`;
            }
        }, 400);
    });

    // Salva também ao sair da página (beforeunload)
    window.addEventListener('beforeunload', () => {
        if (textarea.value) {
            localStorage.setItem('mastermind_diario_rascunho', textarea.value);
        }
    });
}

function selecionarHumor(humor) {
    humorSelecionado = humor;
    localStorage.setItem('mastermind_diario_humor', humor);

    const botoesHumor = document.querySelectorAll('.btn-humor');
    botoesHumor.forEach(btn => {
        if (btn.dataset.humor === humor) {
            btn.classList.add('selecionado');
        } else {
            btn.classList.remove('selecionado');
        }
    });
}

// Carrega as notas salvas
async function carregarNotasDiario() {
    const listaNotas = document.getElementById('lista-diario');
    if (!listaNotas) return;

    try {
        const notas = await window.DB.carregarNotas();
        listaNotas.innerHTML = '';

        if (!notas || notas.length === 0) {
            listaNotas.innerHTML = `
                <li class="item-diario-vazio">
                    <i class="fa-regular fa-clipboard"></i>
                    <p>Nenhuma nota salva ainda. Escreva seu primeiro registro acima!</p>
                </li>
            `;
            return;
        }

        notas.forEach(nota => adicionarNotaNaTela(nota));
    } catch (e) {
        console.error('Erro ao carregar histórico do diário:', e);
    }
}

// Salva anotação permanente ao clicar no botão "Salvar Nota"
async function salvarNotaDiario(event) {
    if (event) event.preventDefault();

    const textarea = document.getElementById('texto-diario');
    const statusAutosave = document.getElementById('autosave-texto');
    if (!textarea) return;

    const texto = textarea.value.trim();
    if (!texto) {
        alert('Por favor, escreva como foi seu dia antes de salvar!');
        textarea.focus();
        return;
    }

    const btnSalvar = document.getElementById('btn-salvar-diario');
    if (btnSalvar) {
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';
    }

    try {
        const novaNota = await window.DB.salvarNota({
            texto: texto,
            humor: humorSelecionado,
            data: new Date().toISOString()
        });

        // Limpa o rascunho
        localStorage.removeItem('mastermind_diario_rascunho');
        textarea.value = '';

        if (statusAutosave) {
            statusAutosave.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #2ecc71;"></i> Nota arquivada no histórico!';
        }

        // Recarrega lista
        await carregarNotasDiario();

        // Alerta amigável
        mostrarNotificacaoToast('Sua reflexão foi registrada com segurança!');

    } catch (erro) {
        console.error('Erro ao salvar nota:', erro);
        alert('Ocorreu um erro ao salvar sua nota. Tente novamente.');
    } finally {
        if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar Nota';
        }
    }
}

function adicionarNotaNaTela(nota) {
    const listaNotas = document.getElementById('lista-diario');
    if (!listaNotas) return;

    const item = document.createElement('li');
    item.className = 'item-diario';
    item.id = `nota-${nota.id}`;

    const dataObj = new Date(nota.data);
    const dataFormatada = !isNaN(dataObj) ? dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Data recente';

    const emojisHumor = {
        feliz: '😊 Feliz / Grato',
        calmo: '😌 Tranquilo / Em Paz',
        neutro: '😐 Neutro',
        ansioso: '😰 Ansioso / Tenso',
        triste: '😔 Triste / Cansado'
    };

    const textoHumor = emojisHumor[nota.humor] || '🌿 Reflexão';

    item.innerHTML = `
        <div class="item-diario-cabecalho">
            <span class="tag-humor tag-${nota.humor || 'calmo'}">${textoHumor}</span>
            <span class="data-nota"><i class="fa-regular fa-clock"></i> ${dataFormatada}</span>
        </div>
        <p class="texto-nota">${escapeHtml(nota.texto)}</p>
        <div class="item-diario-rodape">
            <button class="btn-diario-acao" onclick="copiarNota('${nota.id}')" title="Copiar texto">
                <i class="fa-regular fa-copy"></i> Copiar
            </button>
            <button class="btn-diario-acao btn-excluir" onclick="removerNota('${nota.id}')" title="Excluir nota">
                <i class="fa-regular fa-trash-can"></i> Excluir
            </button>
        </div>
    `;

    listaNotas.appendChild(item);
}

async function removerNota(id) {
    if (confirm('Deseja realmente excluir este registro do seu diário?')) {
        await window.DB.excluirNota(id);
        const elemento = document.getElementById(`nota-${id}`);
        if (elemento) elemento.remove();
        mostrarNotificacaoToast('Registro removido.');
    }
}

function copiarNota(id) {
    const elemento = document.getElementById(`nota-${id}`);
    if (elemento) {
        const texto = elemento.querySelector('.texto-nota').innerText;
        navigator.clipboard.writeText(texto).then(() => {
            mostrarNotificacaoToast('Texto copiado para a área de transferência!');
        });
    }
}

function exportarDiario() {
    const notas = window.DB.obterNotasLocais();
    if (!notas || notas.length === 0) {
        alert('Você ainda não tem notas para exportar.');
        return;
    }

    let conteudo = `=== MEU DIÁRIO MASTER MIND ===\nExportado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
    notas.forEach((n, i) => {
        conteudo += `[Registro #${i + 1}] - ${new Date(n.data).toLocaleString('pt-BR')}\nHumor: ${n.humor}\nReflexão:\n${n.texto}\n\n-----------------------------\n\n`;
    });

    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diario-mastermind-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function mostrarNotificacaoToast(msg) {
    const toastExistente = document.getElementById('toast-notificacao');
    if (toastExistente) toastExistente.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notificacao';
    toast.className = 'toast-notificacao';
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>${msg}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('visivel'), 50);
    setTimeout(() => {
        toast.classList.remove('visivel');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    restaurarRascunhoDiario();
    configurarAutoSave();
    carregarNotasDiario();

    const formDiario = document.getElementById('form-diario');
    if (formDiario) {
        formDiario.addEventListener('submit', salvarNotaDiario);
    }

    const btnSalvar = document.getElementById('btn-salvar-diario');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', salvarNotaDiario);
    }

    // Configura botões de humor
    const botoesHumor = document.querySelectorAll('.btn-humor');
    botoesHumor.forEach(btn => {
        btn.addEventListener('click', () => {
            selecionarHumor(btn.dataset.humor);
        });
    });
});

window.salvarNotaDiario = salvarNotaDiario;
window.removerNota = removerNota;
window.copiarNota = copiarNota;
window.selecionarHumor = selecionarHumor;
window.exportarDiario = exportarDiario;