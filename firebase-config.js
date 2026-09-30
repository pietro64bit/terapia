/**
 * Master Mind - Camada de Conexão com Firebase e Banco de Dados (Offline-First)
 * Suporta Firebase Auth & Firestore, com sincronização automática e fallback
 * para LocalStorage e API Local (Node.js/SQLite), garantindo que funcione
 * 100% no GitHub Pages e em ambiente de desenvolvimento local.
 */

// =============================================================================
// CONFIGURAÇÃO DO FIREBASE
// Cole aqui as credenciais do seu projeto Firebase Console:
// https://console.firebase.google.com/
// =============================================================================
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "mastermind-terapia.firebaseapp.com",
    projectId: "mastermind-terapia",
    storageBucket: "mastermind-terapia.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456"
};

let firebaseAtivo = false;
let authFirebase = null;
let firestoreDb = null;

// Inicializa Firebase com segurança se a SDK estiver carregada e chave informada
try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('SUA_API_KEY')) {
        firebase.initializeApp(firebaseConfig);
        authFirebase = firebase.auth();
        firestoreDb = firebase.firestore();
        firebaseAtivo = true;
        console.log('🔥 [Firebase] Conectado ao Firestore e Auth com sucesso!');
    } else {
        console.log('ℹ️ [Firebase] Modo Híbrido/Offline-First ativo (LocalStorage + API Local). Para conectar com a nuvem, configure seu firebaseConfig em firebase-config.js.');
    }
} catch (e) {
    console.warn('⚠️ [Firebase] Erro ao inicializar Firebase SDK:', e.message);
    firebaseAtivo = false;
}

// =============================================================================
// REPOSITÓRIO DE DADOS UNIFICADO (DB SERVICE)
// Garante persistência em nuvem (Firebase) ou local (LocalStorage / SQLite)
// =============================================================================
const DB = {
    // ----------------- DIÁRIO EMOCIONAL -----------------
    async salvarNota(nota) {
        // Estrutura padrão da nota
        const novaNota = {
            id: nota.id || 'nota_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            texto: nota.texto,
            humor: nota.humor || 'tranquilo',
            data: nota.data || new Date().toISOString(),
            usuarioId: nota.usuarioId || DB.obterUsuarioAtual()?.email || 'anonimo'
        };

        // 1. Salva sempre no LocalStorage (garante que nada seja perdido)
        const notasLocais = DB.obterNotasLocais();
        notasLocais.unshift(novaNota);
        localStorage.setItem('mastermind_notas_diario', JSON.stringify(notasLocais));

        // 2. Se Firebase estiver ativo, salva no Firestore
        if (firebaseAtivo && firestoreDb) {
            try {
                await firestoreDb.collection('diario').doc(novaNota.id).set(novaNota);
                console.log('☁️ [Firebase] Nota salva no Firestore!');
            } catch (err) {
                console.warn('⚠️ [Firebase] Erro ao salvar nota na nuvem, mantida localmente:', err);
            }
        }

        // 3. Tenta sincronizar com API Node.js local se estiver rodando
        try {
            fetch('http://localhost:3000/api/diario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novaNota)
            }).catch(() => {});
        } catch (_) {}

        return novaNota;
    },

    async carregarNotas(usuarioId = null) {
        const idAlvo = usuarioId || DB.obterUsuarioAtual()?.email || 'anonimo';

        // Tenta obter do Firestore se online
        if (firebaseAtivo && firestoreDb) {
            try {
                const snapshot = await firestoreDb.collection('diario')
                    .where('usuarioId', 'in', [idAlvo, 'anonimo'])
                    .get();
                if (!snapshot.empty) {
                    const notasRemotas = [];
                    snapshot.forEach(doc => notasRemotas.push(doc.data()));
                    notasRemotas.sort((a, b) => new Date(b.data) - new Date(a.data));
                    // Atualiza cache local
                    localStorage.setItem('mastermind_notas_diario', JSON.stringify(notasRemotas));
                    return notasRemotas;
                }
            } catch (err) {
                console.warn('⚠️ [Firebase] Buscando notas do cache local devido a:', err.message);
            }
        }

        // Tenta buscar da API local SQLite
        try {
            const resp = await fetch('http://localhost:3000/api/diario');
            if (resp.ok) {
                const notasApi = await resp.json();
                if (Array.isArray(notasApi) && notasApi.length > 0) {
                    return notasApi;
                }
            }
        } catch (_) {}

        // Fallback robusto LocalStorage
        return DB.obterNotasLocais();
    },

    obterNotasLocais() {
        try {
            const salvas = localStorage.getItem('mastermind_notas_diario');
            return salvas ? JSON.parse(salvas) : [];
        } catch (e) {
            return [];
        }
    },

    async excluirNota(notaId) {
        let notasLocais = DB.obterNotasLocais();
        notasLocais = notasLocais.filter(n => n.id !== notaId);
        localStorage.setItem('mastermind_notas_diario', JSON.stringify(notasLocais));

        if (firebaseAtivo && firestoreDb) {
            try {
                await firestoreDb.collection('diario').doc(notaId).delete();
            } catch (e) {
                console.warn('Erro ao deletar nota no Firestore:', e);
            }
        }

        try {
            fetch(`http://localhost:3000/api/diario/${notaId}`, { method: 'DELETE' }).catch(() => {});
        } catch (_) {}

        return true;
    },

    // ----------------- PROFISSIONAIS -----------------
    obterProfissionaisPadrao() {
        return [
            {
                id: 'prof_zokaalan',
                nome: 'Dr. ZokaAlan',
                especialidade: 'Neurologia',
                crp_crm: 'CRM 198273-SP',
                telefone: '(19) 98991-2719',
                whatsapp: '5519989912719',
                modalidade: 'online',
                avaliacao: 4.9,
                avaliacoesQtd: 28,
                tempoResposta: 'Responde em 2h',
                descricao: 'Especialista no tratamento de alterações do sistema nervoso, estresse crônico e regulação neuroemocional com abordagem humanizada.',
                verificado: true
            },
            {
                id: 'prof_mariana',
                nome: 'Dra. Mariana Costa',
                especialidade: 'TCC - Terapia Cognitivo-Comportamental',
                crp_crm: 'CRP 06/158932',
                telefone: '(11) 97123-4567',
                whatsapp: '5511971234567',
                modalidade: 'online',
                avaliacao: 5.0,
                avaliacoesQtd: 42,
                tempoResposta: 'Responde em 1h',
                descricao: 'Psicóloga clínica focada em transtornos de ansiedade, síndrome do pânico, burnout e reestruturação de crenças limitantes.',
                verificado: true
            },
            {
                id: 'prof_felipe',
                nome: 'Dr. Felipe Vasconcelos',
                especialidade: 'Psiquiatria e Saúde Mental',
                crp_crm: 'CRM 214589-SP',
                telefone: '(19) 99882-3344',
                whatsapp: '5519998823344',
                modalidade: 'presencial',
                avaliacao: 4.8,
                avaliacoesQtd: 19,
                tempoResposta: 'Responde em 3h',
                descricao: 'Médico psiquiatra integrativo. Acompanhamento focado em qualidade do sono, regulação de humor e redução de psicofármacos.',
                verificado: true
            },
            {
                id: 'prof_juliana',
                nome: 'Dra. Juliana Mendes',
                especialidade: 'Mindfulness e Neurociência',
                crp_crm: 'CRP 06/177401',
                telefone: '(11) 98555-1122',
                whatsapp: '5511985551122',
                modalidade: 'online',
                avaliacao: 4.9,
                avaliacoesQtd: 35,
                tempoResposta: 'Responde em 30min',
                descricao: 'Especialista em técnicas de redução do estresse baseadas em mindfulness (MBSR) e regulação fisiológica do sistema nervoso.',
                verificado: true
            }
        ];
    },

    async obterProfissionais(termo = '', modalidade = '') {
        let lista = [];

        // 1. Tenta carregar do Firestore se ativo
        if (firebaseAtivo && firestoreDb) {
            try {
                const snapshot = await firestoreDb.collection('profissionais').get();
                if (!snapshot.empty) {
                    snapshot.forEach(doc => lista.push(doc.data()));
                }
            } catch (err) {
                console.warn('⚠️ [Firebase] Erro ao carregar especialistas remotos:', err);
            }
        }

        // 2. Carrega do LocalStorage (profissionais cadastrados no navegador)
        const cadastradosLocal = JSON.parse(localStorage.getItem('mastermind_profissionais_custom') || '[]');

        // Mescla padrões + cadastrados locais + remotos evitando duplicatas por id
        const mapa = new Map();
        DB.obterProfissionaisPadrao().forEach(p => mapa.set(p.id, p));
        cadastradosLocal.forEach(p => mapa.set(p.id, p));
        lista.forEach(p => mapa.set(p.id, p));

        let todos = Array.from(mapa.values());

        // Aplica filtros se houver
        if (termo && termo.trim() !== '') {
            const t = termo.toLowerCase().trim();
            todos = todos.filter(p =>
                (p.nome && p.nome.toLowerCase().includes(t)) ||
                (p.especialidade && p.especialidade.toLowerCase().includes(t)) ||
                (p.descricao && p.descricao.toLowerCase().includes(t))
            );
        }

        if (modalidade && modalidade !== '') {
            todos = todos.filter(p => p.modalidade === modalidade || p.modalidade === 'hibrido');
        }

        return todos;
    },

    async cadastrarProfissional(dados) {
        const idProf = 'prof_' + Date.now();
        const novoProf = {
            id: idProf,
            nome: dados.nome,
            email: dados.email,
            especialidade: dados.especialidade,
            crp_crm: dados.crp_crm || dados.registro || 'Registro Pendente',
            telefone: dados.telefone || '(19) 98991-2719',
            whatsapp: dados.whatsapp ? dados.whatsapp.replace(/\D/g, '') : '5519989912719',
            modalidade: dados.modalidade || 'online',
            avaliacao: 5.0,
            avaliacoesQtd: 1,
            tempoResposta: 'Responde rapidamente',
            descricao: dados.descricao || `Especialista em ${dados.especialidade} focado em atendimento humanizado e regulação emocional.`,
            verificado: true,
            criadoEm: new Date().toISOString()
        };

        // Salva no LocalStorage
        const customProfs = JSON.parse(localStorage.getItem('mastermind_profissionais_custom') || '[]');
        customProfs.push(novoProf);
        localStorage.setItem('mastermind_profissionais_custom', JSON.stringify(customProfs));

        // Salva no Firestore se ativo
        if (firebaseAtivo && firestoreDb) {
            try {
                await firestoreDb.collection('profissionais').doc(idProf).set(novoProf);
                console.log('☁️ [Firebase] Profissional cadastrado no Firestore com sucesso!');
            } catch (e) {
                console.warn('⚠️ [Firebase] Erro ao salvar profissional no Firestore:', e);
            }
        }

        // Tenta salvar na API local SQLite
        try {
            fetch('http://localhost:3000/api/profissionais', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoProf)
            }).catch(() => {});
        } catch (_) {}

        return novoProf;
    },

    // ----------------- AUTENTICAÇÃO E SESSÃO -----------------
    obterUsuarioAtual() {
        try {
            const raw = localStorage.getItem('usuarioLogado');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    },

    salvarSessaoUsuario(usuario) {
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    },

    encerrarSessao() {
        localStorage.removeItem('usuarioLogado');
    }
};

window.DB = DB;
