const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(cors());
app.use(express.json());

// BANCO DE DADOS SQLITE
const db = new sqlite3.Database('./banco.db', (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao SQLite:', err.message);
    } else {
        console.log('📦 Banco SQLite conectado com sucesso!');
    }
});

// CRIAÇÃO DAS TABELAS
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            senha TEXT,
            tipo TEXT,
            nome TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS notas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            texto TEXT,
            data TEXT
        )
    `);

    // Insere usuário padrão se não existir nenhum
    db.get("SELECT COUNT(*) as total FROM usuarios", (err, row) => {
        if (row && row.total === 0) {
            db.run(`
                INSERT INTO usuarios (email, senha, tipo, nome) 
                VALUES ('zokaalan', 'admin', 'profissional', 'Dr. ZokaAlan')
            `);
            console.log('👤 Usuário padrão cadastrado!');
        }
    });
});

// ==========================================
// ROTAS DE USUÁRIOS
// ==========================================

// Rota 1: Login
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Preencha todos os campos.' });
    }

    const sql = "SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?) AND senha = ?";
    db.get(sql, [email, senha], (err, usuario) => {
        if (err) return res.status(500).json({ erro: 'Erro no banco de dados.' });

        if (!usuario) {
            return res.status(401).json({ erro: 'Usuário ou senha incorretos!' });
        }

        res.json({
            mensagem: 'Login realizado com sucesso!',
            usuario: { nome: usuario.nome || usuario.email, tipo: usuario.tipo }
        });
    });
});

// Rota 2: Cadastro de Novo Usuário
app.post('/api/cadastro', (req, res) => {
    const { nome, email, senha, tipo } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ erro: 'Preencha todos os campos obrigatórios.' });
    }

    const tipoConta = tipo || 'paciente';
    const sql = "INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)";

    db.run(sql, [nome, email, senha, tipoConta], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ erro: 'Este usuário/e-mail já está cadastrado.' });
            }
            return res.status(500).json({ erro: 'Erro ao salvar novo usuário.' });
        }

        res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
    });
});

// ==========================================
// ROTAS DO DIÁRIO
// ==========================================

// Rota 3: Buscar todas as anotações guardadas
app.get('/api/diario', (req, res) => {
    const sql = "SELECT * FROM notas ORDER BY id DESC";
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ erro: 'Erro ao buscar histórico.' });
        res.json(rows);
    });
});

// Rota 4: Salvar nova anotação
app.post('/api/diario', (req, res) => {
    const { texto } = req.body;

    if (!texto) {
        return res.status(400).json({ erro: 'O texto não pode estar vazio.' });
    }

    const dataAtual = new Date().toISOString();
    const sql = "INSERT INTO notas (texto, data) VALUES (?, ?)";

    db.run(sql, [texto, dataAtual], function (err) {
        if (err) return res.status(500).json({ erro: 'Erro ao salvar nota.' });

        res.status(201).json({
            mensagem: 'Anotação salva com sucesso!',
            nota: { id: this.lastID, texto, data: dataAtual }
        });
    });
});

const PORT = 3006;
app.listen(PORT, () => console.log(`🚀 API com SQLite rodando em: http://localhost:${PORT}`));