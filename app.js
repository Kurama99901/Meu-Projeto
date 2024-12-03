const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const secretKey = process.env.SECRET_KEY;

app.use(cors()); // Permite todas as origens
// Ou para permitir apenas uma origem específica
// app.use(cors({ origin: 'https://estoquejmbrasilia.onrender.com' }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
    const dados = {
        titulo: 'Minha Dashboard',
        mensagem: 'Este é um servidor Node.js com Express renderizando HTML com EJS!'
    };
    res.render('index', dados);
});

app.post('/salvar-estoque', (req, res) => {
    const estoqueData = req.body;
    const estoqueFilePath = path.join(__dirname, 'public', 'estoque.json');

    fs.writeFile(estoqueFilePath, JSON.stringify({ estoque: estoqueData }, null, 2), (err) => {
        if (err) {
            console.error('Erro ao salvar o arquivo:', err);
            return res.status(500).json({ message: 'Erro ao salvar o estoque.' });
        }
        console.log('Arquivo salvo com sucesso!');
        res.json({ message: 'Estoque salvo com sucesso!' });
    });
});

app.get('/estoque', (req, res) => {
    const estoqueFilePath = path.join(__dirname, 'public', 'estoque.json');

    fs.readFile(estoqueFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Erro ao carregar o arquivo:', err);
            return res.status(500).json({ message: 'Erro ao carregar o estoque.' });
        }
        res.json(JSON.parse(data));
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
