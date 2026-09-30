/**
 * Master Mind - Módulo de Gestão e Busca de Profissionais
 * Implementa filtro por especialidade/nome, modalidade e tratamento
 * para exibir "Profissional não avaliado" caso não haja resultados.
 */

async function carregarProfissionais() {
    const inputFiltro = document.getElementById('filtro-especialidade');
    const selectModalidade = document.getElementById('filtro-modalidade');
    const containerLista = document.getElementById('lista-profissionais');

    if (!containerLista) return;

    const termo = inputFiltro ? inputFiltro.value.trim() : '';
    const modalidade = selectModalidade ? selectModalidade.value : '';

    // Efeito de carregamento
    containerLista.innerHTML = `
        <div class="loading-profissionais" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
            <i class="fa-solid fa-spinner fa-spin fa-2x" style="color: var(--teal);"></i>
            <p style="margin-top: 10px; color: var(--gray-600);">Buscando especialistas qualificados...</p>
        </div>
    `;

    try {
        const profissionais = await window.DB.obterProfissionais(termo, modalidade);

        containerLista.innerHTML = '';

        // Se NÃO houver resultados para a busca, exibe o aviso "Profissional não avaliado"
        if (!profissionais || profissionais.length === 0) {
            containerLista.innerHTML = `
                <div class="empty-prof-card" style="grid-column: 1 / -1;">
                    <div class="empty-prof-icon">
                        <i class="fa-solid fa-user-slash"></i>
                    </div>
                    <h3>Profissional não avaliado</h3>
                    <p>Não encontramos nenhum especialista com os termos informados ("<strong>${termo || 'filtro aplicado'}</strong>") ou o profissional ainda não concluiu a verificação de credenciais clínicas.</p>
                    <div class="empty-prof-actions">
                        <button class="btn-primary" onclick="limparFiltrosProfissionais()">
                            <i class="fa-solid fa-rotate-left"></i> Ver Todos os Profissionais
                        </button>
                        <button class="btn-secondary" onclick="abrirModal('modal-cadastro-profissional')">
                            <i class="fa-solid fa-user-plus"></i> Cadastrar como Especialista
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // Renderiza cada profissional encontrado
        profissionais.forEach(prof => {
            const card = document.createElement('div');
            card.className = 'card-prof';

            const mensagemWhats = encodeURIComponent(`Olá ${prof.nome}, encontrei seu perfil no Master Mind e gostaria de agendar uma consulta.`);
            const whatsUrl = `https://wa.me/${prof.whatsapp}?text=${mensagemWhats}`;

            card.innerHTML = `
                <div class="card-prof-header">
                    <div class="card-prof-avatar">
                        <i class="fa-solid fa-user-doctor"></i>
                    </div>
                    <div class="card-prof-badges">
                        <span class="badge-verificado"><i class="fa-solid fa-circle-check"></i> Verificado</span>
                        <span class="badge-modalidade-tag">${prof.modalidade === 'online' ? '🌐 Online' : prof.modalidade === 'presencial' ? '🏢 Presencial' : '🔄 Híbrido'}</span>
                    </div>
                </div>
                
                <h3>${prof.nome}</h3>
                <span class="badge-especialidade"><i class="fa-solid fa-brain"></i> ${prof.especialidade}</span>
                <span class="registro-crp-crm"><i class="fa-solid fa-id-badge"></i> ${prof.crp_crm || 'Registro Validado'}</span>
                
                <p class="prof-descricao">${prof.descricao || 'Atendimento humanizado focado em saúde mental e desenvolvimento individual.'}</p>
                
                <div class="prof-meta">
                    <span class="meta-item"><i class="fa-solid fa-star" style="color: #f1c40f;"></i> ${prof.avaliacao || '5.0'}/5 (${prof.avaliacoesQtd || 10} avaliações)</span>
                    <span class="meta-item"><i class="fa-solid fa-clock"></i> ${prof.tempoResposta || 'Responde em 2h'}</span>
                </div>
                
                <div class="prof-contato-info">
                    <i class="fa-solid fa-phone"></i> ${prof.telefone || '(19) 98991-2719'}
                </div>
                
                <a href="${whatsUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary btn-whatsapp-prof">
                    <i class="fa-brands fa-whatsapp"></i> Conversar no WhatsApp
                </a>
            `;

            containerLista.appendChild(card);
        });

    } catch (e) {
        console.error('Erro ao renderizar profissionais:', e);
        containerLista.innerHTML = `
            <div class="empty-prof-card" style="grid-column: 1 / -1;">
                <h3>Profissional não avaliado</h3>
                <p>Ocorreu uma instabilidade momentânea na busca de dados. Tente novamente em instantes.</p>
                <button class="btn-primary" onclick="carregarProfissionais()">Tentar novamente</button>
            </div>
        `;
    }
}

function limparFiltrosProfissionais() {
    const inputFiltro = document.getElementById('filtro-especialidade');
    const selectModalidade = document.getElementById('filtro-modalidade');
    if (inputFiltro) inputFiltro.value = '';
    if (selectModalidade) selectModalidade.value = '';
    carregarProfissionais();
}

document.addEventListener('DOMContentLoaded', () => {
    carregarProfissionais();

    const inputFiltro = document.getElementById('filtro-especialidade');
    if (inputFiltro) {
        // Busca dinâmica com debounce leve ao digitar
        let timer = null;
        inputFiltro.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(carregarProfissionais, 350);
        });

        inputFiltro.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                carregarProfissionais();
            }
        });
    }

    const selectModalidade = document.getElementById('filtro-modalidade');
    if (selectModalidade) {
        selectModalidade.addEventListener('change', carregarProfissionais);
    }
});

window.carregarProfissionais = carregarProfissionais;
window.limparFiltrosProfissionais = limparFiltrosProfissionais;
