const express = require('express');
const router = express.Router();

// Array para simular o banco de dados (até você configurar o banco real)
let movimentacoes = [];

// Rota para salvar movimentações (POST)
router.post('/', (req, res) => {
    const movimentacao = req.body;

    // Validação básica
    if (!movimentacao.produto || !movimentacao.operacao || !movimentacao.dataHora) {
        return res.status(400).json({ error: 'Dados inválidos' });
    }

    // Adiciona a movimentação ao array
    movimentacoes.push(movimentacao);
    return res.status(201).json({ message: 'Movimentação registrada' });
});

// Rota para buscar movimentações com filtros (GET)
router.get('/', (req, res) => {
    const { produto, dataInicio, dataFim, operacao, responsavel } = req.query;

    let resultado = movimentacoes;

    // Filtrar por produto
    if (produto) {
        resultado = resultado.filter(m => m.produto.toLowerCase().includes(produto.toLowerCase()));
    }

    // Filtrar por data
    if (dataInicio || dataFim) {
        const inicio = new Date(dataInicio || '1970-01-01');
        const fim = new Date(dataFim || '9999-12-31');

        resultado = resultado.filter(m => {
            const dataMov = new Date(m.dataHora);
            return dataMov >= inicio && dataMov <= fim;
        });
    }

    // Filtrar por operação
    if (operacao) {
        resultado = resultado.filter(m => m.operacao === operacao);
    }

    // Filtrar por responsável
    if (responsavel) {
        resultado = resultado.filter(m => m.responsavel?.toLowerCase().includes(responsavel.toLowerCase()));
    }

    res.json(resultado);
});

// Exportar as rotas
module.exports = router;
