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

app.post('/agendamentos', (req, res) => {
    const { empresa, dataHora, tecnico, tipoServico, observacoes, pecas } = req.body;

    // Validação simples para garantir que os campos obrigatórios não estão vazios
    if (!empresa || !dataHora || !tecnico || !tipoServico) {
        return res.status(400).json({ message: 'Campos obrigatórios não podem estar vazios.' });
    }

    // Inserir o agendamento no banco de dados SQLite
    const sqlAgendamento = `
        INSERT INTO agendamentos (empresa, dataHora, tecnico, tipoServico, observacoes)
        VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(sqlAgendamento, [empresa, dataHora, tecnico, tipoServico, observacoes], function(err) {
        if (err) {
            console.error('Erro ao criar agendamento:', err);
            return res.status(500).json({ message: 'Erro ao criar agendamento' });
        }

        const agendamentoId = this.lastID;  // ID do agendamento recém-criado

        // Inserir as peças associadas ao agendamento
        const stmtProduto = db.prepare('INSERT INTO agendamentos_produtos (id_agendamento, id_produto, quantidade) VALUES (?, ?, ?)');

        pecas.forEach(peca => {
            stmtProduto.run(agendamentoId, peca.id_produto, peca.quantidade, (err) => {
                if (err) {
                    console.error('Erro ao inserir peça:', err);
                }
            });
        });

        stmtProduto.finalize((err) => {
            if (err) {
                console.error('Erro ao finalizar inserção de peças:', err);
                return res.status(500).json({ message: 'Erro ao associar as peças ao agendamento.' });
            }
            res.status(201).json({ id: agendamentoId, message: 'Agendamento e peças criados com sucesso!' });
        });
    });
});


// Obter todos os agendamentos
app.get('/agendamentos', (req, res) => {
    const sql = `
        SELECT agendamentos.*, agendamentos_produtos.id_produto, agendamentos_produtos.quantidade, produtos.produto 
        FROM agendamentos
        LEFT JOIN agendamentos_produtos ON agendamentos.id = agendamentos_produtos.id_agendamento
        LEFT JOIN produtos ON agendamentos_produtos.id_produto = produtos.id
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Erro ao carregar os agendamentos:', err);
            return res.status(500).json({ message: 'Erro ao carregar os agendamentos.' });
        }
        res.json({ agendamentos: rows });
    });
});

// Editar um agendamento
app.put('/agendamentos/:id', (req, res) => {
    const { id } = req.params;
    const { empresa, dataHora, tecnico, tipoServico, observacoes, pecas } = req.body;

    // Atualizar o agendamento no banco de dados
    const sqlAgendamento = `
        UPDATE agendamentos
        SET empresa = ?, dataHora = ?, tecnico = ?, tipoServico = ?, observacoes = ?
        WHERE id = ?
    `;
    
    db.run(sqlAgendamento, [empresa, dataHora, tecnico, tipoServico, observacoes, id], function (err) {
        if (err) {
            console.error('Erro ao atualizar agendamento:', err);
            return res.status(500).json({ message: 'Erro ao atualizar agendamento' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Agendamento não encontrado.' });
        }

        // Excluir as peças associadas e re-inserir
        db.run('DELETE FROM agendamentos_produtos WHERE id_agendamento = ?', [id], (err) => {
            if (err) {
                console.error('Erro ao excluir peças antigas:', err);
                return res.status(500).json({ message: 'Erro ao excluir peças antigas.' });
            }

            const stmtProduto = db.prepare('INSERT INTO agendamentos_produtos (id_agendamento, id_produto, quantidade) VALUES (?, ?, ?)');
            
            pecas.forEach(peca => {
                stmtProduto.run(id, peca.id_produto, peca.quantidade, (err) => {
                    if (err) {
                        console.error('Erro ao inserir peça:', err);
                    }
                });
            });

            stmtProduto.finalize((err) => {
                if (err) {
                    console.error('Erro ao finalizar inserção de peças:', err);
                    return res.status(500).json({ message: 'Erro ao associar as peças ao agendamento.' });
                }
                res.json({ message: 'Agendamento e peças atualizados com sucesso!' });
            });
        });
    });
});

// Excluir um agendamento
app.delete('/agendamentos/:id', (req, res) => {
    const { id } = req.params;

    // Excluir as peças associadas
    db.run('DELETE FROM agendamentos_produtos WHERE id_agendamento = ?', [id], (err) => {
        if (err) {
            console.error('Erro ao excluir peças associadas:', err);
            return res.status(500).json({ message: 'Erro ao excluir peças associadas.' });
        }

        // Excluir o agendamento
        const sql = "DELETE FROM agendamentos WHERE id = ?";
        db.run(sql, [id], function (err) {
            if (err) {
                console.error('Erro ao excluir agendamento:', err);
                return res.status(500).json({ message: 'Erro ao excluir agendamento' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Agendamento não encontrado.' });
            }
            res.json({ message: 'Agendamento excluído com sucesso!' });
        });
    });
});



app.listen(port, 'localhost', () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
