// Importa os módulos necessários
const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express(); // Inicializando o aplicativo Express
const port = process.env.PORT || 3000;
app.use(express.json()); // Para processar JSON

// Inicialização do banco de dados
const dbPath = path.join(__dirname, 'estoque.db'); // Ajuste o caminho se necessário
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados SQLite com sucesso.');
    }
});

// Roteamento
const movimentacoesRoutes = require('./routes/movimentacoes'); // Ajuste o caminho
app.use('/movimentacoes', movimentacoesRoutes);

// Rota dashboard
const dashboardRouter = require('./routes/dashboard');
app.use('/dashboard', dashboardRouter);

// Configurações do middleware
app.use(cors());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Rota checklist
app.get('/checklist', (req, res) => {
    const sql = "SELECT * FROM produtos"; // Query SQL para buscar os produtos
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao carregar dados do checklist:', err);
            return res.status(500).json({ message: 'Erro ao carregar o checklist.' });
        }
        res.json({ checklist: rows }); // Retorna os dados do checklist
    });
});

// Criação da tabela "produtos"
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
    res.render('login', dados);
});

// Rota POST para salvar os dados no banco de dados
app.post('/salvar-estoque', (req, res) => {
    const estoqueData = req.body;

    if (!Array.isArray(estoqueData)) {
        return res.status(400).json({ message: 'Dados inválidos: esperado um array.' });
    }

    db.serialize(() => {
        const stmt = db.prepare(`
            INSERT INTO produtos (produto, estoqueFinal, codSistema, local)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(codSistema) DO UPDATE SET
                produto = excluded.produto,
                estoqueFinal = excluded.estoqueFinal,
                local = excluded.local
        `, (err) => {
            if (err) {
                console.error('Erro ao preparar a declaração:', err);
                return res.status(500).json({ message: 'Erro interno do servidor.' });
            }
        });

        estoqueData.forEach((item) => {
            stmt.run(
                item.produto,
                item.estoqueFinal,
                item.codSistema,
                item.local,
                (err) => {
                    if (err) {
                        console.error('Erro ao salvar item:', item, err);
                    }
                }
            );
        });

        stmt.finalize((err) => {
            if (err) {
                console.error('Erro ao finalizar a declaração:', err);
                return res.status(500).json({ message: 'Erro ao finalizar a operação.' });
            }
            console.log('Dados salvos com sucesso!');
            res.json({ message: 'Estoque salvo com sucesso!' });
        });
    });
});

// Rota GET para obter os dados de estoque do banco de dados
app.get('/estoque.db', (req, res) => {
    db.all("SELECT * FROM produtos", [], (err, rows) => {
        if (err) {
            console.error('Erro ao carregar dados do banco de dados:', err);
            return res.status(500).json({ message: 'Erro ao carregar o estoque.' });
        }
        res.json({ estoque: rows });
    });
});


app.listen(port, 'localhost', () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
