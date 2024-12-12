const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
require('dotenv').config();

const port = process.env.PORT || 3000;
const secretKey = process.env.SECRET_KEY;

app.use(cors()); // Permite todas as origens
// Ou para permitir apenas uma origem específica

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Caminho correto para o banco de dados dentro da pasta "public/Estoque"
const dbPath = path.join(__dirname, 'public', 'Estoque', 'estoque.db');

// Cria ou abre o banco de dados SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err);
  } else {
    console.log('Banco de dados conectado com sucesso!');
  }
});

// Cria a tabela produtos caso ela não exista
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto TEXT,
            estoqueFinal INTEGER,
            codSistema TEXT,
            local TEXT
        )
    `);
});

app.get('/', (req, res) => {
    const dados = {
        titulo: 'Minha Dashboard',
        mensagem: 'Este é um servidor Node.js com Express renderizando HTML com EJS!'
    };
    res.render('index', dados);
});

// Rota POST para salvar dados de estoque
app.post('/salvar-estoque', (req, res) => {
    const estoqueData = req.body;

    if (!Array.isArray(estoqueData)) {
        return res.status(400).json({ message: 'Dados inválidos: esperado um array.' });
    }

    const stmt = db.prepare("INSERT INTO produtos (produto, estoqueFinal, codSistema, local) VALUES (?, ?, ?, ?)");
    let erroOcorreu = false;

    estoqueData.forEach(item => {
        stmt.run(item.produto, item.estoqueFinal, item.codSistema, item.local, (err) => {
            if (err) {
                console.error('Erro ao salvar no banco de dados:', err);
                erroOcorreu = true;
            }
        });
    });

    stmt.finalize(() => {
        if (erroOcorreu) {
            return res.status(500).json({ message: 'Alguns itens falharam ao salvar no banco de dados.' });
        }
        console.log('Dados do estoque salvos com sucesso!');
        res.json({ message: 'Estoque salvo com sucesso!' });
    });
});


// Rota GET para obter os dados de estoque do banco de dados
app.get('/estoque', (req, res) => {
    db.all("SELECT * FROM produtos", [], (err, rows) => {
        if (err) {
            console.error('Erro ao carregar dados do banco de dados:', err);
            return res.status(500).json({ message: 'Erro ao carregar o estoque.' });
        }
        res.json({ estoque: rows }); // Retorna com a chave "estoque"
    });
});


// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
