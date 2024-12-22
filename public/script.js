// Define a URL base para a API
const API_BASE_URL = 'http://192.168.15.200:3000'; // Incluindo a porta 3000


// Função para carregar as movimentações com base nos filtros
async function loadMovimentacoes(filtros = {}) {
    const query = new URLSearchParams(filtros).toString();
    const url = `${API_BASE_URL}/movimentacoes?${query}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.statusText}`);
        }

        const data = await response.json();
        renderHistorico(data); // Chama a função para renderizar o histórico
    } catch (error) {
        console.error('Erro ao carregar movimentações:', error);
        alert('Erro ao carregar as movimentações. Tente novamente mais tarde.');
    }
}

// Inicializa o modal
window.onload = function() {
    const modal = document.getElementById('modalOperacoes');
    if (modal) modal.style.display = 'none'; // Garante que o modal não será exibido no início
};

// Renderiza o histórico no modal
function renderHistorico(movimentacoes) {
    const tabelaHistorico = document.getElementById('tabelaHistorico');
    tabelaHistorico.innerHTML = ''; // Limpa o conteúdo antes de adicionar os novos dados

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Data</th>
                <th>Operação</th>
                <th>Produto</th>
                <th>Quantidade</th>
                <th>Responsável</th>
                <th>Estoque Antes</th>
                <th>Estoque Depois</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    movimentacoes.forEach((m) => {
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
        tbody.appendChild(row);
    });

    tabelaHistorico.appendChild(table); // Adiciona a tabela ao modal
}

// Função para abrir o modal
document.getElementById('btnOperacoes').addEventListener('click', function() {
    const modal = document.getElementById('modalOperacoes');
    modal.style.display = 'flex'; // Exibe o modal
    document.body.classList.add('modal-aberta'); // Desabilita a rolagem da página
    loadMovimentacoes(); // Carrega as movimentações ao abrir o modal
});

// Fecha o modal
function fecharModal() {
    const modal = document.getElementById('modalOperacoes');
    modal.style.display = 'none'; // Oculta o modal
    document.body.classList.remove('modal-aberta'); // Restaura a rolagem
}

document.getElementById('fecharModal').addEventListener('click', fecharModal);

// Fecha o modal ao clicar fora do conteúdo
window.addEventListener('click', function(event) {
    const modal = document.getElementById('modalOperacoes');
    if (event.target === modal) fecharModal();
});

// Abre/fecha o formulário de filtros
document.getElementById('btnFiltro').addEventListener('click', function() {
    const filtrosDiv = document.getElementById('filtros');
    filtrosDiv.style.display = filtrosDiv.style.display === 'none' ? 'block' : 'none';
});

// Aplica filtros
document.getElementById('btnAplicarFiltro').addEventListener('click', function() {
    const filtros = {
        produto: document.getElementById('filtroProduto').value,
        dataInicio: document.getElementById('filtroDataInicio').value,
        dataFim: document.getElementById('filtroDataFim').value,
        operacao: document.getElementById('filtroOperacao').value,
    };

    loadMovimentacoes(filtros); // Carrega as movimentações com filtros
    document.getElementById('filtros').style.display = 'none'; // Fecha os filtros
});
