// Define a URL base para a API
const API_BASE_URL = 'http://localhost:3000'; // Usando localhost para a requisição
// Incluindo a porta 3000


// Função para carregar as movimentações com base nos filtros
async function loadMovimentacoes(filtros = {}) {
    const query = new URLSearchParams(filtros).toString();
    const url = `${API_BASE_URL}/movimentacoes?${query}`;

    try {
        const response = await fetch(`${API_BASE_URL}/movimentacoes?${query}`);

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
window.onload = function () {
    const modal = document.getElementById('modalOperacoes');
    modal.style.display = 'none'; // Garante que o modal esteja oculto ao carregar a página
};

// Função para renderizar o histórico no modal
function renderHistorico(movimentacoes) {
    const tabelaHistorico = document.getElementById('tabelaHistorico');
    tabelaHistorico.innerHTML = ''; // Limpa o conteúdo antes de adicionar os novos dados

    if (movimentacoes.length === 0) {
        tabelaHistorico.innerHTML = '<p>Não há movimentações para exibir.</p>';
        return; // Se não houver movimentações, exibe mensagem e retorna
    }

    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Data</th>
                <th>Técnico</th>
                <th>Empresa Atendida</th>
                <th>Detalhes</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    movimentacoes.forEach((m) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(m.dataHora).toLocaleDateString('pt-BR')} ${new Date(m.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
            <td>${m.responsavel || 'N/A'}</td>
            <td>${m.produto || 'N/A'}</td>
            <td>
                <button class="btn btn-info btn-sm" onclick="mostrarDetalhes(${m.id})">
                    <i class="fa fa-info-circle"></i> Ver detalhes
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    tabelaHistorico.appendChild(table); // Adiciona a tabela ao modal
}

// Função para mostrar os detalhes da movimentação
function mostrarDetalhes(idMovimentacao) {
    // Requisição para pegar os detalhes completos dessa movimentação
    fetch(`${API_BASE_URL}/movimentacoes/${idMovimentacao}`)
        .then(response => response.json())
        .then(data => {
            // Criar e exibir o modal com as informações completas
            const modalDetalhes = document.getElementById('modalDetalhes');
            const modalBody = modalDetalhes.querySelector('.modal-body');
            modalBody.innerHTML = `
                <p><strong>Produto:</strong> ${data.produto}</p>
                <p><strong>Operação:</strong> ${data.operacao}</p>
                <p><strong>Data:</strong> ${new Date(data.dataHora).toLocaleString()}</p>
                <p><strong>Responsável:</strong> ${data.responsavel}</p>
                <p><strong>Quantidade:</strong> ${data.quantidade}</p>
                <p><strong>Estoque Antes:</strong> ${data.estoqueAntes}</p>
                <p><strong>Estoque Depois:</strong> ${data.estoqueDepois}</p>
            `;
            modalDetalhes.style.display = 'block';
        })
        .catch(error => {
            console.error('Erro ao carregar os detalhes:', error);
            alert('Erro ao carregar os detalhes da movimentação.');
        });
}

// Fechar o modal de detalhes
document.getElementById('fecharModalDetalhes').addEventListener('click', () => {
    document.getElementById('modalDetalhes').style.display = 'none';
});

// Função para abrir o modal
document.getElementById('btnOperacoes').addEventListener('click', function() {
    const modal = document.getElementById('modalOperacoes');
    modal.classList.remove('d-none'); // Exibe o modal removendo a classe 'd-none'
    modal.classList.add('d-flex'); // Garante que ele tenha um layout flex para centralizar
    document.body.classList.add('modal-aberta'); // Desabilita a rolagem da página
    loadMovimentacoes(); // Carrega as movimentações ao abrir o modal
});

// Função para fechar o modal
function fecharModal() {
    const modal = document.getElementById('modalOperacoes');
    modal.classList.add('d-none'); // Oculta o modal adicionando a classe 'd-none'
    document.body.classList.remove('modal-aberta'); // Restaura a rolagem da página
}

document.getElementById('fecharModal').addEventListener('click', fecharModal);

// Fecha o modal ao clicar fora do conteúdo
window.addEventListener('click', function(event) {
    const modal = document.getElementById('modalOperacoes');
    if (event.target === modal) fecharModal();
});

    // Abre/fecha o formulário de filtros dentro do modal
    document.getElementById('btnFiltro').addEventListener('click', function () {
        const filtrosDiv = document.getElementById('filtros');
        // Alterna a visibilidade do painel de filtros dentro do modal
        filtrosDiv.classList.toggle('d-none');
    });

  // Aplica o filtro ao clicar em "Aplicar Filtro"
  document.getElementById('btnAplicarFiltro').addEventListener('click', function () {
    const filtros = {
        tecnico: document.getElementById('filtroTecnico').value, // Captura o técnico selecionado
        dataInicio: document.getElementById('filtroDataInicio').value,
        dataFim: document.getElementById('filtroDataFim').value,
        operacao: document.getElementById('filtroOperacao').value,
    };


    loadMovimentacoes(filtros); // Carrega as movimentações com os filtros aplicados
    document.getElementById('filtros').classList.add('d-none'); // Fecha o filtro após aplicar
});
