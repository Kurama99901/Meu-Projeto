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
    const quantidadeLabel = document.querySelector('label[for="quantidade"]'); // Rótulo de Quantidade:
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
        
        // Verifica se a variável estoqueCarregado não é nula, e, em caso afirmativo, retorna true
        if (estoqueCarregado)
            return JSON.parse(localStorage.getItem("estoque"));

        return null;
    }

    function saveEstoqueData() {
        // Transforma em String
        let estoque = JSON.stringify(estoqueData);
        
        // Verifica se o estoque não é nulo
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

    // Função para atualizar a tabela baseada no termo de pesquisa (apenas para a pesquisa principal)
    function updateTableBasedOnSearch(searchTerm) {
        const filteredItems = performSearch(searchTerm, estoqueData);
        renderTable(filteredItems); // Renderiza a tabela com os itens filtrados
    }

    // Função para lidar com as alterações no estoque
    function handleStockOperation() {
        const operacao = operacaoSelect.value;  // A operação selecionada (retirada, devolução, chegada, novo, excluir)
        const produto = produtoInput.value;     // Nome do produto a ser manipulado
        const quantidade = parseInt(quantidadeInput.value, 10);  // A quantidade informada no campo
        const codSistema = document.getElementById("codSistema").value; // Código do sistema
        const local = document.getElementById("local").value;  // Localização do produto
        const responsavel = responsavelInput.value;  // Nome do responsável (apenas para retirada ou devolução)

        // ** Correção 1: Não solicitar a quantidade na operação de exclusão **
        if (operacao === "exclusao") {
            quantidadeInput.style.display = 'none'; // Esconde o campo de quantidade
            quantidadeLabel.style.display = 'none'; // Esconde o rótulo de "Quantidade:"
        } else {
            quantidadeInput.style.display = 'block'; // Mostra o campo de quantidade para outras operações
            quantidadeLabel.style.display = 'block'; // Garante que o rótulo "Quantidade:" apareça novamente
        }

        // ** Correção 2: Exibição do campo de responsável na operação de retirada e devolução **
        if (operacao === "retirada" || operacao === "devolucao") {
            //responsavelDiv.style.display = 'block'; // Exibe o campo de responsável

            // ** Novo comportamento: A caixa do nome do responsável aparece imediatamente e a validação acontece na confirmação da operação **
            if (!responsavel || responsavel.trim() === "") {
                alert("Por favor, informe o nome do responsável pela operação.");
                return;  // Interrompe se o nome do responsável não for fornecido
            }

            // Validação para permitir apenas letras e espaços no nome do responsável
            const regex = /^[A-Za-záàãâéèêíïóòõôúç\s]+$/;
            if (!regex.test(responsavel)) {
                alert("O nome do responsável deve conter apenas letras e espaços.");
                return;
            }
        }

        // ** Correção 3: Verificação de validade da quantidade **
        if (operacao !== "exclusao" && (isNaN(quantidade) || quantidade <= 0)) {
            alert("Por favor, insira uma quantidade válida.");
            return; // Se a quantidade for inválida, interrompe a execução
        }

        let item = estoqueData.find(item => item.produto.toLowerCase() === produto.toLowerCase()); // Encontrar o item no estoque

        if (operacao === "retirada" || operacao === "devolucao") {
            if (item) {
                // Atualiza a quantidade do item com base na operação
                if (operacao === "retirada") {
                    item.estoqueFinal -= quantidade;
                    
                    console.log(estoqueData);
                    saveEstoqueData();
                } else if (operacao === "devolucao") {
                    item.estoqueFinal += quantidade;

                    saveEstoqueData();
                }
            } else {
                alert("Produto não encontrado no estoque.");
                return; // Produto não encontrado no estoque
            }
        } else if (operacao === "novo") {
            if (!produto || !quantidade || !codSistema || !local) {
                alert("Por favor, preencha todos os campos para um novo produto.");
                return; // Não permite adicionar um novo produto sem todos os dados
            }
            estoqueData.push({ produto, estoqueFinal: quantidade, codSistema, local });
            //Salva item no navegador
            saveEstoqueData();
        } else if (operacao === "exclusao") {
            // Lógica para excluir um produto
            if (item) {
                const confirmDelete = confirm(`Tem certeza que deseja excluir o produto "${produto}"?`);
                if (confirmDelete) {
                    const index = estoqueData.indexOf(item);
                    estoqueData.splice(index, 1); // Remove o item do estoque
                    alert(`Produto "${produto}" excluído com sucesso!`);

                    //Salva item no navegador
                    saveEstoqueData();
                }
            } else {
                alert("Produto não encontrado para exclusão.");
                return;  // Produto não encontrado
            }
        }

        // Atualiza a tabela do estoque com os dados mais recentes
        renderTable(estoqueData); 

        modal.style.display = 'none';  // Fecha o modal após a operação
        document.body.classList.remove('modal-aberta');  // Libera a rolagem da página
        clearModalOnOpen();  // Limpa os campos do modal
    }

    // Função para limpar o modal ao abrir
    function clearModalOnOpen() {
        produtoInput.value = ''; // Limpa o campo de produto
        quantidadeInput.value = ''; // Limpa o campo de quantidade
        document.getElementById("codSistema").value = ''; // Limpa o campo de código do sistema
        document.getElementById("local").value = ''; // Limpa o campo de localização
        responsavelInput.value = ''; // Limpa o campo de responsável
        suggestionsDiv.innerHTML = ''; // Limpa as sugestões
        suggestionsDiv.style.display = 'none'; // Esconde as sugestões

        operacaoSelect.value = "retirada"; // Reseta o seletor de operação
        novoProdutoDiv.style.display = 'none'; // Esconde os campos do novo produto
       // responsavelDiv.style.display = 'none'; // Esconde o campo de responsável

        // Garante que o campo de quantidade e seu rótulo apareçam
        quantidadeInput.style.display = 'block';
        quantidadeLabel.style.display = 'block';
    }

    // Pesquisar apenas no campo de pesquisa principal
    searchInput.addEventListener('input', function () {
        updateTableBasedOnSearch(this.value); // Atualiza a tabela da tela principal
    });

    // Evento para digitação no campo de pesquisa do modal (produtoInput)
    produtoInput.addEventListener('input', function () {
        const searchTerm = this.value;
        const filteredItems = performSearch(searchTerm, estoqueData);
        displaySuggestions(filteredItems); // Exibe apenas as sugestões, sem afetar a tabela principal
    });

    // Fechar sugestões ao clicar fora da caixa de pesquisa
    document.addEventListener('click', function (event) {
        if (!suggestionsDiv.contains(event.target) && event.target !== produtoInput) {
            suggestionsDiv.style.display = 'none'; // Fecha as sugestões ao clicar fora
        }
    });

    // Função para lidar com a seleção de uma sugestão
    function handleSuggestionSelection(index) {
        if (suggestionItems[index]) {
            produtoInput.value = suggestionItems[index].produto; // Preenche o campo de pesquisa no modal com o item selecionado
            suggestionsDiv.style.display = 'none'; // Esconde as sugestões após a seleção
        }
    }

    // Evento para pressionar a tecla "Enter" no campo de pesquisa do modal
    produtoInput.addEventListener('keydown', function (event) {
        if (event.key === "Enter" && suggestionsDiv.style.display === 'block') {
            const selectedItem = document.querySelector('.suggestion-item.selected');
            if (selectedItem) {
                handleSuggestionSelection(Array.from(suggestionsDiv.children).indexOf(selectedItem));
            } else if (suggestionItems.length > 0) {
                // Se nenhuma sugestão estiver selecionada, preenche com o primeiro item
                handleSuggestionSelection(0);
            }
        }
    });

    // Evento para selecionar uma sugestão ao clicar
    suggestionsDiv.addEventListener('click', function (event) {
        const itemIndex = Array.from(suggestionsDiv.children).indexOf(event.target);
        if (itemIndex >= 0) {
            handleSuggestionSelection(itemIndex);
        }
    });

    // Abrir e fechar modal
    btnFazerLancamento.addEventListener('click', () => {
        clearModalOnOpen(); // Limpa o modal ao abrir
        modal.style.display = 'block'; // Exibe o modal
        document.body.classList.add('modal-aberta'); // Bloqueia a rolagem da página
    });

    btnFecharModal.addEventListener('click', () => {
        modal.style.display = 'none'; // Fecha o modal
        document.body.classList.remove('modal-aberta'); // Libera a rolagem da página
    });

    // Mostrar campos para novo produto e ocultar o campo de quantidade para exclusão
    operacaoSelect.addEventListener('change', function () {
        novoProdutoDiv.style.display = (this.value === "novo") ? 'block' : 'none';
        responsavelDiv.style.display = (this.value === "retirada" || this.value === "devolucao") ? 'block' : 'none';

        if (this.value === "exclusao") {
            quantidadeInput.style.display = 'none'; // Oculta o campo de quantidade para exclusão
            quantidadeLabel.style.display = 'none'; // Oculta o rótulo de "Quantidade:" para exclusão
        } else {
            quantidadeInput.style.display = 'block'; // Mostra o campo de quantidade para outras operações
            quantidadeLabel.style.display = 'block'; // Garante que o rótulo "Quantidade:" apareça novamente
        }
    });

    // Validar quantidade para aceitar apenas números positivos
    quantidadeInput.addEventListener('input', function () {
        const value = parseInt(quantidadeInput.value, 10);
        if (value < 0 || isNaN(value)) {
            quantidadeInput.value = ''; // Limpa o campo caso o valor seja inválido
        }
    });

    // Confirmar alteração no estoque
    btnAlterarEstoque.addEventListener('click', handleStockOperation);

    // Carregar os dados do estoque
    loadEstoqueData();
});

