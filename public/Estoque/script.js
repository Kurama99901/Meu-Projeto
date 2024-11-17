document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search"); // Caixa de pesquisa principal
    const produtoInput = document.getElementById("produto"); // Caixa de pesquisa no modal
    const suggestionsDiv = document.getElementById("suggestions"); // Div das sugestões
    const estoqueDiv = document.getElementById("estoque"); // Div do estoque
    const modal = document.getElementById("modalLancamento");
    const btnFazerLancamento = document.getElementById("btnFazerLancamento");
    const btnFecharModal = document.querySelector(".fechar");
    const operacaoSelect = document.getElementById("operacao");
    const novoProdutoDiv = document.getElementById("novoProduto");
    const btnAlterarEstoque = document.getElementById("alterarEstoque");
    const quantidadeInput = document.getElementById("quantidade"); // Campo de quantidade
    const quantidadeLabel = document.querySelector('label[for="quantidade"]'); // Rótulo de Quantidade
    const responsavelDiv = document.getElementById("responsavelDiv"); // Campo de responsável
    const responsavelInput = document.getElementById("responsavel"); // Campo de nome do responsável

    let estoqueData = []; // Variável para armazenar o estoque carregado
    let suggestionItems = []; // Variável para armazenar as sugestões geradas

    // Função para carregar o estoque de um arquivo JSON
    async function loadEstoqueData() {
        try {
            const response = await fetch('estoque.json');
            const data = await response.json();
            estoqueData = data.estoque;

            let estoqueDataCarregado = loadEstoqueSalvo();

            if (estoqueDataCarregado !== null && estoqueDataCarregado !== estoqueData)
                estoqueData = estoqueDataCarregado; 

            renderTable(estoqueData); // Renderiza a tabela com os dados carregados
        } catch (error) {
            console.error("Erro ao carregar o arquivo JSON:", error);
        }
    }

    function loadEstoqueSalvo() {
        // Carrega os itens salvos no navegador
        let estoqueCarregado = localStorage.getItem("estoque");
        if (estoqueCarregado)
            return JSON.parse(estoqueCarregado);
        return null;
    }

    function saveEstoqueData() {
        // Salva os dados do estoque no localStorage
        let estoque = JSON.stringify(estoqueData);
        if (estoque)
            localStorage.setItem("estoque", estoque);
    }

    // Função para renderizar a tabela do estoque
    function renderTable(items) {
        estoqueDiv.innerHTML = ''; // Limpar a tabela anterior
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

        // Ordena os itens do estoque
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

    // Função para normalizar a pesquisa (remover acentos e case-sensitive)
    function normalizeText(text) {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    // Função para realizar a pesquisa no estoque (apenas para a pesquisa principal)
    function performSearch(searchTerm, sourceData) {
        const normalizedSearchTerm = normalizeText(searchTerm);
        return sourceData.filter(item => {
            const normalizedProduto = normalizeText(item.produto);
            return normalizedProduto.includes(normalizedSearchTerm);
        });
    }

    // Função para exibir sugestões de pesquisa (apenas no modal)
    function displaySuggestions(filteredItems) {
        suggestionItems = filteredItems; // Armazena as sugestões geradas
        if (filteredItems.length === 0) {
            suggestionsDiv.innerHTML = '<div>Nenhum produto encontrado</div>';
            suggestionsDiv.style.display = 'block';
            return;
        }

        // Gera as sugestões a partir dos itens filtrados
        suggestionsDiv.innerHTML = filteredItems.map(item =>
            `<div class="suggestion-item">${item.produto}</div>`
        ).join('');

        suggestionsDiv.style.display = 'block'; // Exibe a lista de sugestões
        adjustSuggestionsPosition(); // Ajusta a posição das sugestões
    }

    // Função para ajustar a posição das sugestões (acima ou abaixo do campo)
    function adjustSuggestionsPosition() {
        const inputRect = produtoInput.getBoundingClientRect();
        const suggestionsRect = suggestionsDiv.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const inputBottom = inputRect.bottom;
        const suggestionsHeight = suggestionsRect.height;

        if (inputBottom + suggestionsHeight > viewportHeight) {
            suggestionsDiv.style.top = `${inputRect.top - suggestionsHeight}px`; // Coloca as sugestões acima
        } else {
            suggestionsDiv.style.top = `${inputBottom}px`; // Coloca as sugestões abaixo
        }
    }

    // Função para lidar com as alterações no estoque
    function handleStockOperation() {
        const operacao = operacaoSelect.value;  // A operação selecionada (retirada, devolução, chegada, novo, excluir)
        const produto = produtoInput.value;     // Nome do produto a ser manipulado
        const quantidade = parseInt(quantidadeInput.value, 10);  // A quantidade informada no campo
        const codSistema = document.getElementById("codSistema").value; // Código do sistema
        const local = document.getElementById("local").value;  // Localização do produto
        const responsavel = responsavelInput.value;  // Nome do responsável (apenas para retirada ou devolução)

        // Mostrar ou ocultar o campo de responsável com base na operação
        if (operacao === "retirada" || operacao === "devolucao") {
            responsavelDiv.style.display = 'block'; // Exibe o campo de responsável
        } else {
            responsavelDiv.style.display = 'none'; // Oculta o campo de responsável para outras operações
        }

        if (operacao === "exclusao") {
            quantidadeInput.style.display = 'none'; // Esconde o campo de quantidade
            quantidadeLabel.style.display = 'none'; // Esconde o rótulo de "Quantidade:"
        } else {
            quantidadeInput.style.display = 'block'; // Mostra o campo de quantidade para outras operações
            quantidadeLabel.style.display = 'block'; // Garante que o rótulo "Quantidade:" apareça novamente
        }

        if (operacao === "retirada" || operacao === "devolucao") {
            if (!responsavel || responsavel.trim() === "") {
                alert("Por favor, informe o nome do responsável pela operação.");
                return;
            }
        }

        if (operacao !== "exclusao" && (isNaN(quantidade) || quantidade <= 0)) {
            alert("Por favor, insira uma quantidade válida.");
            return;
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
            if (!produto || !quantidade || !codSistema || !local) {
                alert("Por favor, preencha todos os campos para um novo produto.");
                return;
            }
            estoqueData.push({ produto, estoqueFinal: quantidade, codSistema, local });
            saveEstoqueData();
        } else if (operacao === "exclusao") {
            if (item) {
                const confirmDelete = confirm(`Tem certeza que deseja excluir o produto "${produto}"?`);
                if (confirmDelete) {
                    const index = estoqueData.indexOf(item);
                    estoqueData.splice(index, 1); // Remove o item do estoque
                    alert(`Produto "${produto}" excluído com sucesso!`);
                    saveEstoqueData();
                }
            } else {
                alert("Produto não encontrado para exclusão.");
                return;
            }
        }

        renderTable(estoqueData); 
        modal.style.display = 'none';  // Fecha o modal após a operação
        document.body.classList.remove('modal-aberta');  // Libera a rolagem da página
        clearModalOnOpen();  // Limpa os campos do modal
    }

    // Função para limpar o modal ao abrir
    function clearModalOnOpen() {
        produtoInput.value = ''; 
        quantidadeInput.value = ''; 
        document.getElementById("codSistema").value = ''; 
        document.getElementById("local").value = ''; 
        responsavelInput.value = ''; 
        suggestionsDiv.innerHTML = ''; 
        suggestionsDiv.style.display = 'none'; 
        operacaoSelect.value = "retirada"; 
        novoProdutoDiv.style.display = 'none'; 
    }

    // Pesquisar no campo de pesquisa principal
    searchInput.addEventListener('input', function () {
        const filteredItems = performSearch(this.value, estoqueData);
        renderTable(filteredItems);
    });

    // Pesquisar no campo de pesquisa do modal
    produtoInput.addEventListener('input', function () {
        const filteredItems = performSearch(this.value, estoqueData);
        displaySuggestions(filteredItems); // Exibe as sugestões
    });

    // Fechar sugestões ao clicar fora da caixa de pesquisa
    document.addEventListener('click', function (event) {
        if (!suggestionsDiv.contains(event.target) && event.target !== produtoInput) {
            suggestionsDiv.style.display = 'none'; 
        }
    });

    // Seleção de sugestão ao clicar
    suggestionsDiv.addEventListener('click', function (event) {
        const itemIndex = Array.from(suggestionsDiv.children).indexOf(event.target);
        if (itemIndex >= 0) {
            produtoInput.value = suggestionItems[itemIndex].produto; 
            suggestionsDiv.style.display = 'none';
        }
    });

    // Abrir e fechar modal através da navbar
    const modalActions = {
        'navNovoProduto': 'novo',
        'navExcluirProduto': 'exclusao',
        'navRetirada': 'retirada',
        'navDevolucao': 'devolucao'
    };

    Object.keys(modalActions).forEach(id => {
        document.getElementById(id).addEventListener("click", function () {
            openModal();
            operacaoSelect.value = modalActions[id];
        });
    });

    // Funções para abrir e fechar o modal
    function openModal() {
        modal.style.display = "block";
    }

    function closeModal() {
        modal.style.display = "none";
    }

    btnFecharModal.addEventListener('click', closeModal);
    btnAlterarEstoque.addEventListener('click', handleStockOperation);

    // Carregar os dados do estoque
    loadEstoqueData();
});
