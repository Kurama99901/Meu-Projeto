// Importa os módulos necessários
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configurações do middleware
app.use(cors());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Caminho do banco de dados
const dbPath = path.join(__dirname, 'public', 'Estoque', 'estoque.db');

// Cria ou abre o banco de dados SQLite
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados:', err);
    } else {
        console.log('Banco de dados conectado com sucesso!');
    }
});

// Criação da tabela "produtos" com `codSistema` como chave única
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            produto TEXT,
            estoqueFinal INTEGER,
            codSistema TEXT UNIQUE,
            local TEXT
        )
    `, (err) => {
        if (err) {
            console.error('Erro ao criar a tabela:', err);
        } else {
            console.log('Tabela "produtos" verificada/criada com sucesso.');
        }
    });
});

// Rota principal para renderizar a página inicial
app.get('/', (req, res) => {
    const dados = {
        titulo: 'Minha Dashboard',
        mensagem: 'Este é um servidor Node.js com Express renderizando HTML com EJS!'
    };
    res.render('index', dados);
});

// Rota POST para salvar os dados no banco de dados
app.post('/salvar-estoque', (req, res) => {
    const estoqueData = req.body;

    if (!Array.isArray(estoqueData)) {
        return res.status(400).json({ message: 'Dados inválidos: esperado um array.' });
    }

    const stmt = db.prepare(`
        INSERT INTO produtos (produto, estoqueFinal, codSistema, local)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(codSistema) DO UPDATE SET
            produto = ?,
            estoqueFinal = ?,
            local = ?
    `);

    let erroOcorreu = false;

    db.serialize(() => {
        estoqueData.forEach(item => {
            stmt.run(
                item.produto, item.estoqueFinal, item.codSistema, item.local, // Valores para INSERT
                item.produto, item.estoqueFinal, item.local, // Valores para UPDATE
                (err) => {
                    if (err) {
                        console.error('Erro ao salvar no banco de dados para item:', item, err);
                        erroOcorreu = true;
                    }
                }
            );
        });

        stmt.finalize((err) => {
            if (err) {
                console.error('Erro ao finalizar a transação:', err);
                return res.status(500).json({ message: 'Erro ao salvar os dados do estoque.' });
            }

            if (erroOcorreu) {
                return res.status(500).json({ message: 'Alguns itens falharam ao salvar no banco de dados.' });
            }

            console.log('Dados do estoque salvos com sucesso!');
            res.json({ message: 'Estoque salvo com sucesso!' });
        });
    });
});

// Rota GET para obter os dados de estoque do banco de dados
app.get('/estoque', (req, res) => {
    db.all("SELECT * FROM produtos", [], (err, rows) => {
        if (err) {
            console.error('Erro ao carregar dados do banco de dados:', err);
            return res.status(500).json({ message: 'Erro ao carregar o estoque.' });
        }
        res.json({ estoque: rows });
    });
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});