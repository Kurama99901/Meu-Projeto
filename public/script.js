// Função para carregar as movimentações com base nos filtros
async function loadMovimentacoes(filtros = {}) {
    const query = new URLSearchParams(filtros).toString();
    const response = await fetch(`http://145.223.30.125:3000/movimentacoes?${query}`);  // Alterar para a URL correta
    const data = await response.json();

    renderHistorico(data); // Chama a função para renderizar o histórico
    
}
// Certifique-se de que o modal esteja oculto ao carregar a página
window.onload = function() {
    const modal = document.getElementById('modalOperacoes');
    modal.style.display = 'none';  // Garante que o modal não será exibido no início
};


// Função para renderizar o histórico no modal
function renderHistorico(movimentacoes) {
    const tabelaHistorico = document.getElementById('tabelaHistorico');
    tabelaHistorico.innerHTML = ''; // Limpa o conteúdo antes de adicionar os novos dados

    const table = document.createElement('table');
    table.innerHTML = `
        <tr>
            <th>Data</th>
            <th>Operação</th>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Responsável</th>
            <th>Estoque Antes</th>
            <th>Estoque Depois</th>
        </tr>
    `;

    movimentacoes.forEach(m => {
        const row = document.createElement('tr');
        row.innerHTML = `
    <td>${new Date(m.dataHora).toLocaleDateString('pt-BR')} ${new Date(m.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
    <td>${m.operacao}</td>
    <td>${m.produto}</td>
    <td>${m.quantidade}</td>
    <td>${m.responsavel || 'N/A'}</td>
    <td>${m.estoqueAntes}</td>
    <td>${m.estoqueDepois}</td>
`;

        table.appendChild(row);
    });

    tabelaHistorico.appendChild(table); // Adiciona a tabela ao modal
}

// Função para abrir o modal ao clicar no link "Operações"
document.getElementById('btnOperacoes').addEventListener('click', function() {
    const modal = document.getElementById('modalOperacoes');
    modal.style.display = 'flex'; // Exibe o modal (usando 'flex' para centralizar)
    document.body.classList.add('modal-aberta'); // Desabilita a rolagem da página
    loadMovimentacoes(); // Carrega as movimentações quando o modal é aberto
});

// Fechar o modal ao clicar no botão de fechar
document.getElementById('fecharModal').addEventListener('click', function() {
    const modal = document.getElementById('modalOperacoes');
    modal.style.display = 'none'; // Fecha o modal
    document.body.classList.remove('modal-aberta'); // Restaura a rolagem da página
});

// Fechar o modal se o usuário clicar fora do conteúdo do modal
window.addEventListener('click', function(event) {
    const modal = document.getElementById('modalOperacoes');
    if (event.target === modal) {
        modal.style.display = 'none'; // Fecha o modal
        document.body.classList.remove('modal-aberta'); // Restaura a rolagem da página
    }
});

// Abrir e fechar o formulário de filtro
document.getElementById('btnFiltro').addEventListener('click', function() {
    const filtrosDiv = document.getElementById('filtros');
    filtrosDiv.style.display = filtrosDiv.style.display === 'none' ? 'block' : 'none';
});

// Aplicar filtro
document.getElementById('btnAplicarFiltro').addEventListener('click', function() {
    const filtros = {
        produto: document.getElementById('filtroProduto').value,
        dataInicio: document.getElementById('filtroDataInicio').value,
        dataFim: document.getElementById('filtroDataFim').value,
        operacao: document.getElementById('filtroOperacao').value,
    };

    loadMovimentacoes(filtros); // Carrega as movimentações com base nos filtros
    document.getElementById('filtros').style.display = 'none'; // Fecha o filtro
});

