const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve arquivos estáticos (HTML, CSS, JS, imagens)

// BANCO DE DADOS SQLITE
const dbPath = path.join(__dirname, 'banco.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao SQLite:', err.message);
    } else {
        console.log('📦 Banco SQLite conectado com sucesso em:', dbPath);
    }
});

// CRIAÇÃO E INICIALIZAÇÃO DAS TABELAS
db.serialize(() => {
    // 1. Tabela de Usuários
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            email TEXT UNIQUE,
            senha TEXT,
            tipo TEXT,
            especialidade TEXT,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 2. Tabela de Profissionais
    db.run(`
        CREATE TABLE IF NOT EXISTS profissionais (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE,
            senha TEXT,
            especialidade TEXT,
            crp_crm TEXT,
            telefone TEXT,
            whatsapp TEXT,
            modalidade TEXT DEFAULT 'online',
            descricao TEXT,
            avaliacao REAL DEFAULT 5.0,
            avaliacoes_qtd INTEGER DEFAULT 1,
            verificado INTEGER DEFAULT 1,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 3. Tabela de Notas do Diário
    db.run(`
        CREATE TABLE IF NOT EXISTS notas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            texto TEXT NOT NULL,
            humor TEXT DEFAULT 'calmo',
            data TEXT NOT NULL,
            usuario_id TEXT DEFAULT 'anonimo'
        )
    `);

    // Insere usuário e profissional padrão se não existirem
    db.get("SELECT COUNT(*) as total FROM usuarios", (err, row) => {
        if (!err && row && row.total === 0) {
            db.run(`
                INSERT INTO usuarios (email, senha, tipo, nome, especialidade) 
                VALUES ('zokaalan', 'admin', 'profissional', 'Dr. ZokaAlan', 'Neurologia')
            `);
            console.log('👤 Usuário padrão (Dr. ZokaAlan) registrado.');
        }
    });

    db.get("SELECT COUNT(*) as total FROM profissionais", (err, row) => {
        if (!err && row && row.total === 0) {
            db.run(`
                INSERT INTO profissionais (nome, email, especialidade, crp_crm, telefone, whatsapp, modalidade, descricao, avaliacao, avaliacoes_qtd)
                VALUES (
                    'Dr. ZokaAlan',
                    'zokaalan@mastermind.com',
                    'Neurologia',
                    'CRM 198273-SP',
                    '(19) 98991-2719',
                    '5519989912719',
                    'online',
                    'Especialista no tratamento de alterações do sistema nervoso, estresse crônico e regulação neuroemocional com abordagem humanizada.',
                    4.9,
                    28
                )
            `);
            db.run(`
                INSERT INTO profissionais (nome, email, especialidade, crp_crm, telefone, whatsapp, modalidade, descricao, avaliacao, avaliacoes_qtd)
                VALUES (
                    'Dra. Mariana Costa',
                    'mariana.costa@mastermind.com',
                    'TCC - Terapia Cognitivo-Comportamental',
                    'CRP 06/158932',
                    '(11) 97123-4567',
                    '5511971234567',
                    'online',
                    'Psicóloga clínica focada em transtornos de ansiedade, síndrome do pânico, burnout e reestruturação cognitiva.',
                    5.0,
                    42
                )
            `);
            console.log('👨‍⚕️ Especialistas iniciais inseridos com sucesso.');
        }
    });
});

// ==========================================
// ROTAS DA API
// ==========================================

// Status da API
app.get('/api/status', (req, res) => {
    res.json({ status: 'online', timestamp: new Date().toISOString() });
});

// 1. Rota de Login
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Preencha usuário/e-mail e senha.' });
    }

    const sql = `
        SELECT nome, email, tipo, especialidade 
        FROM usuarios 
        WHERE (LOWER(email) = LOWER(?) OR LOWER(nome) = LOWER(?)) AND senha = ?
    `;

    db.get(sql, [email, email, senha], (err, usuario) => {
        if (err) return res.status(500).json({ erro: 'Erro interno ao consultar o banco.' });

        if (!usuario) {
            return res.status(401).json({ erro: 'Usuário ou senha incorretos.' });
        }

        res.json({
            mensagem: 'Login realizado com sucesso!',
            usuario: {
                nome: usuario.nome || usuario.email,
                email: usuario.email,
                tipo: usuario.tipo || 'paciente',
                especialidade: usuario.especialidade
            }
        });
    });
});

// 2. Rota de Cadastro de Usuário
app.post('/api/cadastro', (req, res) => {
    const { nome, email, senha, tipo, especialidade } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    }

    const sql = `INSERT INTO usuarios (nome, email, senha, tipo, especialidade) VALUES (?, LOWER(?), ?, ?, ?)`;

    db.run(sql, [nome, email, senha, tipo || 'paciente', especialidade || null], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
            }
            return res.status(500).json({ erro: 'Erro ao cadastrar novo usuário.' });
        }

        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso!',
            id: this.lastID
        });
    });
});

// 3. Rota de Listagem e Busca de Profissionais
app.get('/api/profissionais', (req, res) => {
    const { termo, modalidade } = req.query;

    let sql = `SELECT * FROM profissionais WHERE 1=1`;
    const params = [];

    if (termo && termo.trim() !== '') {
        sql += ` AND (LOWER(nome) LIKE LOWER(?) OR LOWER(especialidade) LIKE LOWER(?) OR LOWER(descricao) LIKE LOWER(?))`;
        const termoBusca = `%${termo.trim()}%`;
        params.push(termoBusca, termoBusca, termoBusca);
    }

    if (modalidade && modalidade.trim() !== '') {
        sql += ` AND (modalidade = ? OR modalidade = 'hibrido')`;
        params.push(modalidade.trim());
    }

    sql += ` ORDER BY avaliacao DESC, id DESC`;

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar profissionais.' });
        res.json(rows);
    });
});

// 4. Rota para Cadastrar Novo Profissional
app.post('/api/profissionais', (req, res) => {
    const { nome, email, senha, especialidade, crp_crm, telefone, whatsapp, modalidade, descricao } = req.body;

    if (!nome || !email || !especialidade) {
        return res.status(400).json({ erro: 'Nome, e-mail e especialidade são obrigatórios.' });
    }

    const sql = `
        INSERT INTO profissionais (nome, email, senha, especialidade, crp_crm, telefone, whatsapp, modalidade, descricao)
        VALUES (?, LOWER(?), ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [nome, email, senha || '123456', especialidade, crp_crm || 'Em análise', telefone || '', whatsapp || '', modalidade || 'online', descricao || ''], function (err) {
        if (err) {
            console.error('Erro ao inserir profissional:', err);
            return res.status(500).json({ erro: 'Erro ao registrar profissional no banco de dados.' });
        }

        res.status(201).json({
            mensagem: 'Profissional registrado com sucesso!',
            id: this.lastID
        });
    });
});

// 5. Rota de Histórico do Diário
app.get('/api/diario', (req, res) => {
    const sql = "SELECT * FROM notas ORDER BY id DESC";
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ erro: 'Erro ao consultar notas.' });
        res.json(rows);
    });
});

// 6. Rota para Salvar Nota no Diário
app.post('/api/diario', (req, res) => {
    const { texto, humor, data, usuarioId } = req.body;

    if (!texto || texto.trim() === '') {
        return res.status(400).json({ erro: 'O texto da nota não pode estar vazio.' });
    }

    const dataRegistro = data || new Date().toISOString();
    const sql = "INSERT INTO notas (texto, humor, data, usuario_id) VALUES (?, ?, ?, ?)";

    db.run(sql, [texto.trim(), humor || 'calmo', dataRegistro, usuarioId || 'anonimo'], function (err) {
        if (err) return res.status(500).json({ erro: 'Erro ao arquivar nota no diário.' });

        res.status(201).json({
            mensagem: 'Anotação salva com sucesso!',
            nota: { id: this.lastID, texto, humor, data: dataRegistro }
        });
    });
});

// 7. Rota para Excluir Nota
app.delete('/api/diario/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM notas WHERE id = ?";

    db.run(sql, [id], function (err) {
        if (err) return res.status(500).json({ erro: 'Erro ao excluir nota.' });
        res.json({ mensagem: 'Nota excluída com sucesso.', removidos: this.changes });
    });
});

// Inicialização na porta 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Master Mind Backend rodando em: http://localhost:${PORT}`);
});