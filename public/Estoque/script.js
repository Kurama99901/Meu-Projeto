document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search"); // Caixa de pesquisa principal
    const produtoInput = document.getElementById("produto"); // Caixa de pesquisa no modal
    const suggestionsDiv = document.getElementById("suggestions"); // Div das sugestões
    const estoqueDiv = document.getElementById("estoque"); // Div do estoque
    const modal = document.getElementById("modalLancamento");
    const btnFazerLancamento = document.getElementById("alterarEstoque");
    const btnFecharModal = document.querySelector(".fechar");
    const operacaoSelect = document.getElementById("operacao");
    const novoProdutoDiv = document.getElementById("novoProduto");
    const quantidadeInput = document.getElementById("quantidade"); // Campo de quantidade
    const quantidadeLabel = document.querySelector('label[for="quantidade"]'); // Rótulo de Quantidade
    const responsavelDiv = document.getElementById("responsavelDiv"); // Campo de responsável
    const responsavelInput = document.getElementById("responsavel"); // Campo de nome do responsável
    const codSistemaInput = document.getElementById("codSistema"); // Código do sistema
    const localInput = document.getElementById("local"); // Localização

    let estoqueData = []; // Variável para armazenar o estoque carregado
    let suggestionItems = []; // Variável para armazenar as sugestões geradas
    let currentIndex = -1; // Índice da sugestão selecionada
   // URL da API
  const apiUrl = 'http://192.168.15.200:3000';

   // Função para carregar o estoque do servidor
async function loadEstoqueData() {
    try {
        const response = await fetch(`${apiUrl}/estoque`);
        const data = await response.json();

        // Verifica se o formato de resposta contém a chave "estoque"
        if (data && Array.isArray(data.estoque)) {
            estoqueData = data.estoque; // Atualiza o array de dados
            renderTable(estoqueData);  // Renderiza a tabela com os dados
        } else {
            console.error("Formato de resposta inesperado:", data);
        }
    } catch (error) {
        console.error("Erro ao carregar os dados do servidor:", error);
    }
}
// operações
async function registerMovimentacao(movimentacao) {
    try {
        const response = await fetch('http://192.168.15.200:3000/movimentacoes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(movimentacao),
        });

        if (!response.ok) {
            throw new Error('Erro ao registrar movimentação');
        }

        console.log('Movimentação registrada:', await response.json());
    } catch (error) {
        console.error('Erro ao registrar movimentação:', error);
    }
}

   // Função para salvar o estoque no servidor
   function saveEstoqueData() {
       fetch(`${apiUrl}/salvar-estoque`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
           },
           body: JSON.stringify(estoqueData)
       })
       .then(response => {
           if (!response.ok) {
               throw new Error('Erro ao salvar os dados');
           }
           return response.json();
       })
       .then(data => {
           console.log('Dados salvos no servidor:', data.message);
       })
       .catch(error => {
           console.error('Erro ao salvar no servidor:', error);
       });
   }
       function renderTable(items) {
        estoqueDiv.innerHTML = '';
        const table = document.createElement('table');
        table.classList.add('tabela-estoque');
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = ` 
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Código do Sistema</th>
            <th>Localização</th>
        `;
        table.appendChild(headerRow);

        items.sort((a, b) => a.produto.localeCompare(b.produto));

        items.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = ` 
                <td>${item.produto}</td>
                <td>${item.estoqueFinal}</td>
                <td>${item.codSistema}</td>
                <td>${item.local}</td>
            `;
            table.appendChild(row);
        });

        estoqueDiv.appendChild(table);
    }

    function normalizeText(text) {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    function performSearch(searchTerm, sourceData) {
        const normalizedSearchTerm = normalizeText(searchTerm);
        return sourceData.filter(item => {
            const normalizedProduto = normalizeText(item.produto);
            const normalizedCodSistema = normalizeText(item.codSistema);
            return normalizedProduto.includes(normalizedSearchTerm) || normalizedCodSistema.includes(normalizedSearchTerm);
        });
    }

    function displaySuggestions(filteredItems) {
        suggestionItems = filteredItems;
        currentIndex = -1; // Resetando o índice de seleção
        if (filteredItems.length === 0) {
            suggestionsDiv.innerHTML = '<div>Nenhum produto encontrado</div>';
            suggestionsDiv.style.display = 'block';
            return;
        }

        suggestionsDiv.innerHTML = filteredItems.map(item =>
            `<div class="suggestion-item">${item.produto}</div>`
        ).join('');

        suggestionsDiv.style.display = 'block';
    }

    // Função para atualizar os campos do modal de acordo com a operação selecionada
    function updateModalFields() {
        const operacao = operacaoSelect.value;

        // Escondendo todos os campos
        responsavelDiv.style.display = 'none';
        novoProdutoDiv.style.display = 'none';
        quantidadeLabel.style.display = 'none';  // Esconde a quantidade por padrão
        quantidadeInput.style.display = 'none';  // Esconde o input de quantidade por padrão

        // Limpar campos
        produtoInput.value = '';
        quantidadeInput.value = '';
        responsavelInput.value = '';
        codSistemaInput.value = '';
        localInput.value = '';

        // Mostrar campos necessários para cada operação
        if (operacao === 'retirada' || operacao === 'devolucao') {
            responsavelDiv.style.display = 'block'; // Responsável é necessário para Retirada e Devolução
            quantidadeLabel.style.display = 'block'; // Quantidade necessária
            quantidadeInput.style.display = 'block'; // Exibe o campo de quantidade
        } else if (operacao === 'novo') {
            novoProdutoDiv.style.display = 'block'; // Mostrar campos de Novo Produto
            quantidadeLabel.style.display = 'block'; // Quantidade necessária
            quantidadeInput.style.display = 'block'; // Exibe o campo de quantidade
        } else if (operacao === 'chegada') {
            quantidadeLabel.style.display = 'block'; // Quantidade necessária
            quantidadeInput.style.display = 'block'; // Exibe o campo de quantidade
        }

        if (operacao === 'exclusao') {
            quantidadeLabel.style.display = 'none'; // Não precisa de quantidade para exclusão
            quantidadeInput.style.display = 'none'; // Esconde a quantidade para exclusão
        }
    }

    // Função para validar a quantidade (apenas números inteiros positivos)
    quantidadeInput.addEventListener('input', function () {
        quantidadeInput.value = quantidadeInput.value.replace(/[^0-9]/g, ''); // Remove caracteres não numéricos
    });
// Validação para o campo "Código do Sistema"
codSistemaInput.addEventListener('input', function () {
    // Remove qualquer caractere não numérico
    codSistemaInput.value = codSistemaInput.value.replace(/[^0-9]/g, '');

    // Limita a quantidade de caracteres a 6
    if (codSistemaInput.value.length > 6) {
        codSistemaInput.value = codSistemaInput.value.slice(0, 6);
    }
});
    // Função para lidar com as alterações no estoque
    async function handleStockOperation() {
        const operacao = operacaoSelect.value;
        const produto = produtoInput.value;
        const quantidade = parseInt(quantidadeInput.value, 10);
        const codSistema = codSistemaInput.value;
        const local = localInput.value;
        const responsavel = responsavelInput.value;
    
        if (operacao === "retirada" || operacao === "devolucao") {
            if (!produto || !quantidade || !responsavel) {
                alert("Por favor, preencha todos os campos para a operação.");
                return;
            }
        } else if (operacao === "novo") {
            if (!produto || !quantidade || !codSistema || !local) {
                alert("Por favor, preencha todos os campos para o novo produto.");
                return;
            }
    
            // Validação de código do sistema duplicado
            const codigoExistente = estoqueData.some(item => item.codSistema === codSistema);
            if (codigoExistente) {
                alert("Erro: Já existe um produto com este código de sistema no estoque.");
                return;
            }
        } else if (operacao === "chegada") {
            if (!produto || !quantidade) {
                alert("Por favor, preencha todos os campos para a chegada de produto.");
                return;
            }
        } else if (operacao === "exclusao") {
            if (!produto) {
                alert("Por favor, insira o nome do produto para exclusão.");
                return;
            }
        }
    
        if (isNaN(quantidade) || quantidade <= 0) {
            if (operacao !== "exclusao") {  // Ignorar a validação de quantidade para exclusão
                alert("Por favor, insira uma quantidade válida (maior que 0).");
                return;
            }
        }
    
        let item = estoqueData.find(item => item.produto.toLowerCase() === produto.toLowerCase());
    
        if (operacao === "retirada" || operacao === "devolucao") {
            if (item) {
                if (operacao === "retirada") {
                    item.estoqueFinal -= quantidade;
                } else if (operacao === "devolucao") {
                    item.estoqueFinal += quantidade;
                }
                saveEstoqueData();
            } else {
                alert("Produto não encontrado no estoque.");
                return;
            }
        } else if (operacao === "novo") {
            estoqueData.push({ produto, estoqueFinal: quantidade, codSistema, local });
            saveEstoqueData();
        } else if (operacao === "exclusao") {
            if (item) {
                const confirmDelete = confirm(`Tem certeza que deseja excluir o produto "${produto}"?`);
                if (confirmDelete) {
                    estoqueData = estoqueData.filter(item => item.produto.toLowerCase() !== produto.toLowerCase());
                    saveEstoqueData();
                }
            } else {
                alert("Produto não encontrado no estoque.");
            }
        }
    
        renderTable(estoqueData);
        closeModal();
    
        const movimentacao = {
            produto: item.produto || produto, // Ajuste para garantir que o produto seja encontrado
            quantidade,
            operacao, // Usando "operacao" corretamente aqui
            responsavel: responsavel || 'Desconhecido', // Responsável, se disponível
            codSistema: item.codSistema || codSistema,
            local: item.local || local,
            estoqueAntes: item.estoqueFinal || 0,
            estoqueDepois: operacao === 'retirada' 
                ? item.estoqueFinal - quantidade 
                : item.estoqueFinal + quantidade,
            dataHora: new Date().toISOString(),
        };
        
        await registerMovimentacao(movimentacao);
    }
    

    function closeModal() {
        modal.style.display = 'none';
        // Restaurar a rolagem da página
        document.body.style.overflow = 'auto';
    }

    function openModal() {
        modal.style.display = 'block';
        // Desabilitar a rolagem da página
        document.body.style.overflow = 'hidden';
    }

    // Gerenciar os eventos de navegação
    document.getElementById("navRetirada").addEventListener("click", function () {
        openModal();
        operacaoSelect.value = "retirada";
        updateModalFields();
    });

    document.getElementById("navDevolucao").addEventListener("click", function () {
        openModal();
        operacaoSelect.value = "devolucao";
        updateModalFields();
    });

    document.getElementById("navNovoProduto").addEventListener("click", function () {
        openModal();
        operacaoSelect.value = "novo";
        updateModalFields();
    });

    document.getElementById("navExcluirProduto").addEventListener("click", function () {
        openModal();
        operacaoSelect.value = "exclusao";
        updateModalFields();
    });

    btnFecharModal.addEventListener("click", closeModal);
    btnFazerLancamento.addEventListener("click", handleStockOperation);

    loadEstoqueData();

    searchInput.addEventListener("input", function () {
        const searchTerm = searchInput.value;
        const filteredItems = performSearch(searchTerm, estoqueData);
        renderTable(filteredItems);
    });

    produtoInput.addEventListener("input", function () {
        const searchTerm = produtoInput.value;
        const filteredItems = performSearch(searchTerm, estoqueData);
        if (produtoInput.value && operacaoSelect.value !== "novo") {
            displaySuggestions(filteredItems);
        } else {
            suggestionsDiv.style.display = 'none'; // Esconde se o campo estiver vazio
        }
    });

    suggestionsDiv.addEventListener("click", function (e) {
        if (e.target && e.target.classList.contains("suggestion-item")) {
            produtoInput.value = e.target.textContent;
            suggestionsDiv.style.display = 'none';
        }
    });

    document.addEventListener("click", function (event) {
        if (!suggestionsDiv.contains(event.target) && event.target !== produtoInput) {
            suggestionsDiv.style.display = 'none';  // Fecha a div de sugestões
        }
    });

    // Lógica para navegação com as setas do teclado
    produtoInput.addEventListener("keydown", function (e) {
        if (suggestionsDiv.style.display === 'block' && suggestionItems.length > 0) {
            if (e.key === "ArrowDown") {
                // Navega para baixo na lista de sugestões
                if (currentIndex < suggestionItems.length - 1) {
                    currentIndex++;
                    highlightSuggestion();
                }
            } else if (e.key === "ArrowUp") {
                // Navega para cima na lista de sugestões
                if (currentIndex > 0) {
                    currentIndex--;
                    highlightSuggestion();
                }
            } else if (e.key === "Enter") {
                // Preenche o input com a sugestão selecionada
                if (currentIndex !== -1) {
                    produtoInput.value = suggestionItems[currentIndex].produto;
                    suggestionsDiv.style.display = 'none';
                }
            }
        }
    });

    function highlightSuggestion() {
        const suggestionElements = suggestionsDiv.querySelectorAll(".suggestion-item");
        suggestionElements.forEach((el, index) => {
            if (index === currentIndex) {
                el.classList.add("highlight");
            } else {
                el.classList.remove("highlight");
            }
        });
    }

    operacaoSelect.addEventListener('change', updateModalFields);
});
