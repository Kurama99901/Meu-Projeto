const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho do banco de dados
const dbPath = path.join(__dirname, '..', 'public', 'Estoque', 'estoque.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados:', err);
    } else {
        console.log('Banco de dados conectado com sucesso!');
    }
});

// Rota para dados da dashboard
router.get('/dados', async (req, res) => {
    try {
        const produtosSaidas = await new Promise((resolve, reject) => {
            db.all(
                `SELECT produto, SUM(quantidade) AS totalSaidas
                 FROM movimentacoes
                 WHERE operacao = 'retirada'
                 GROUP BY produto
                 ORDER BY totalSaidas DESC
                 LIMIT 5`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        const tecnicosRetiradas = await new Promise((resolve, reject) => {
            db.all(
                `SELECT responsavel, COUNT(*) AS totalRetiradas
                 FROM movimentacoes
                 WHERE operacao = 'retirada'
                 GROUP BY responsavel
                 ORDER BY totalRetiradas DESC
                 LIMIT 5`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        const produtosEstoqueBaixo = await new Promise((resolve, reject) => {
            db.all(
                `SELECT produto, estoqueFinal
                 FROM produtos
                 WHERE estoqueFinal < (
                    SELECT AVG(estoqueFinal)
                    FROM produtos
                 )
                 ORDER BY estoqueFinal ASC
                 LIMIT 5`,
                [],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        res.json({
            produtosSaidas,
            tecnicosRetiradas,
            produtosEstoqueBaixo,
        });
    } catch (error) {
        console.error('Erro ao buscar dados da dashboard:', error);
        res.status(500).json({ error: 'Erro ao buscar dados da dashboard' });
    }
});

module.exports = router;
