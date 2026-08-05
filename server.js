const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conexão com o banco MySQL rodando no Docker
const db = mysql.createConnection({
    host: 'localhost',
    port: 9405,
    user: 'root',
    password: 'admin', // Senha configurada no container
    database: 'master_mind'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao MySQL no Docker:', err.message);
    } else {
        console.log('🔥 Conectado com sucesso ao MySQL no Docker!');
    }
});

// ==========================================
// ROTAS DE AUTENTICAÇÃO (CADASTRO E LOGIN)
// ==========================================

// Rota para Cadastrar Novo Usuário
app.post('/api/cadastro', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    const sql = 'INSERT INTO usuarios (email, senha) VALUES (?, ?)';
    db.query(sql, [email, senha], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Este e-mail já está cadastrado ou ocorreu um erro.' });
        }
        res.status(201).json({ 
            mensagem: 'Conta criada com sucesso!', 
            usuario: { id: result.insertId, email } 
        });
    });
});

// Rota para Fazer Login
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Preencha todos os campos.' });
    }

    const sql = 'SELECT id, email FROM usuarios WHERE email = ? AND senha = ?';
    db.query(sql, [email, senha], (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
        }
        res.json({ 
            mensagem: 'Login realizado com sucesso!', 
            usuario: results[0] 
        });
    });
});

// ==========================================
// ROTAS DO DIÁRIO EMOCIONAL
// ==========================================

// Rota para Salvar Anotação no Diário
app.post('/api/diario', (req, res) => {
    const { usuario_id, texto } = req.body;

    if (!usuario_id || !texto) {
        return res.status(400).json({ erro: 'Usuário e texto são obrigatórios.' });
    }

    const sql = 'INSERT INTO diario (usuario_id, texto) VALUES (?, ?)';
    db.query(sql, [usuario_id, texto], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao salvar nota no diário.' });
        }
        res.status(201).json({ mensagem: 'Anotação salva com sucesso no banco de dados!' });
    });
});

// ==========================================
// ROTAS DE AGENDAMENTO DE CONSULTAS
// ==========================================

// Rota para Marcar Consulta
app.post('/api/agendar', (req, res) => {
    const { usuario_id, data_consulta, horario_consulta } = req.body;

    if (!usuario_id || !data_consulta || !horario_consulta) {
        return res.status(400).json({ erro: 'Preencha todos os dados da consulta.' });
    }

    const sql = 'INSERT INTO agendamentos (usuario_id, data_consulta, horario_consulta) VALUES (?, ?, ?)';
    db.query(sql, [usuario_id, data_consulta, horario_consulta], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ erro: 'Erro ao agendar consulta.' });
        }
        res.status(201).json({ mensagem: 'Consulta agendada no banco de dados com sucesso!' });
    });
});

// Inicia o Servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});