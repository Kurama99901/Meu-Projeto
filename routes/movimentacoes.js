const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho do banco de dados
const dbPath = path.join(__dirname, '..', 'estoque.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados:', err);
    } else {
        console.log('Banco de dados conectado com sucesso!');
    }
});

// Rota para salvar movimentações (POST)
router.post('/', (req, res) => {
    const { produto, operacao, dataHora, responsavel, quantidade } = req.body;

    // Validação básica
    if (!produto || !operacao || !dataHora || !quantidade) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }

    // Buscar o estoque atual do produto
    db.get('SELECT estoqueFinal FROM produtos WHERE produto = ?', [produto], (err, row) => {
        if (err) {
            console.error('Erro ao buscar estoque:', err);
            return res.status(500).json({ error: 'Erro ao buscar estoque' });
        }

        if (!row) {
            return res.status(404).json({ error: 'Produto não encontrado' });
        }

        // Definir estoqueAntes e estoqueDepois
        const estoqueAntes = row.estoqueFinal;

        let estoqueDepois;
        if (operacao === 'entrada') {
            estoqueDepois = estoqueAntes + quantidade;
        } else if (operacao === 'retirada' || operacao === 'devolucao') {
            estoqueDepois = estoqueAntes - quantidade;
        }

        // Inserir a movimentação no banco de dados
        const stmt = db.prepare(`
            INSERT INTO movimentacoes (produto, operacao, dataHora, responsavel, quantidade, estoqueAntes, estoqueDepois)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(produto, operacao, dataHora, responsavel, quantidade, estoqueAntes, estoqueDepois, (err) => {
            if (err) {
                console.error('Erro ao salvar movimentação:', err);
                return res.status(500).json({ error: 'Erro ao salvar movimentação' });
            }

            // Atualizar o estoque do produto
            db.run('UPDATE produtos SET estoqueFinal = ? WHERE produto = ?', [estoqueDepois, produto], (err) => {
                if (err) {
                    console.error('Erro ao atualizar estoque:', err);
                    return res.status(500).json({ error: 'Erro ao atualizar estoque' });
                }
                res.status(201).json({ message: 'Movimentação registrada e estoque atualizado com sucesso' });
            });
        });

        stmt.finalize();
    });
});

// Rota para buscar movimentações com filtros (GET)
router.get('/', (req, res) => {
    const { produto, dataInicio, dataFim, operacao, responsavel } = req.query;

    let sql = "SELECT * FROM movimentacoes WHERE 1=1";
    let params = [];

    // Filtrar por produto
    if (produto) {
        sql += " AND produto LIKE ?";
        params.push(`%${produto}%`);
    }

    // Filtrar por data
    if (dataInicio || dataFim) {
        const inicio = dataInicio || '1970-01-01';
        const fim = dataFim || '9999-12-31';

        sql += " AND dataHora BETWEEN ? AND ?";
        params.push(inicio, fim);
    }

    // Filtrar por operação
    if (operacao) {
        sql += " AND operacao = ?";
        params.push(operacao);
    }

    // Filtrar por responsável
    if (responsavel) {
        sql += " AND responsavel LIKE ?";
        params.push(`%${responsavel}%`);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Erro ao carregar movimentações:', err);
            return res.status(500).json({ error: 'Erro ao carregar movimentações' });
        }
        res.json(rows);
    });
});

module.exports = router;
