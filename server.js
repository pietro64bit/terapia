const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares para aceitar JSON e liberar acesso do navegador
app.use(cors());
app.use(express.json());

// ==========================================
// BANCO DE DADOS EM MEMÓRIA (Arrays Temporários)
// ==========================================
const usuarios = [
    { id: 1, email: 'zokaalan', senha: 'admin', tipo: 'profissional', nome: 'Dr. ZokaAlan' }
];

const notasDiario = [];

// ==========================================
// ROTAS DA API
// ==========================================

// Rota 1: Login
app.post('/api/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Preencha todos os campos.' });
    }

    // Procura o usuário no array temporário
    const usuario = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha);

    if (!usuario) {
        // Se não achar no array padrão, autoriza como paciente comum para testes
        return res.json({
            mensagem: 'Login comum realizado!',
            usuario: { nome: email.split('@')[0], tipo: 'paciente' }
        });
    }

    res.json({
        mensagem: 'Login realizado com sucesso!',
        usuario: { nome: usuario.nome || usuario.email, tipo: usuario.tipo }
    });
});

// Rota 2: Salvar Nota no Diário
app.post('/api/diario', (req, res) => {
    const { texto } = req.body;

    if (!texto) {
        return res.status(400).json({ erro: 'O texto não pode estar vazio.' });
    }

    const novaNota = { id: Date.now(), texto, data: new Date() };
    notasDiario.push(novaNota);

    res.status(201).json({
        mensagem: 'Anotação salva com sucesso na API!',
        nota: novaNota
    });
});

// Inicialização do servidor na porta 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 API rodando sem banco em: http://localhost:${PORT}`);
});