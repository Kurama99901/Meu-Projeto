fetch('estoque.json')
    .then(response => response.json())
    .then(data => {
        const estoqueDiv = document.getElementById('estoque');
        const table = document.createElement('table');
        table.classList.add('tabela-estoque');

        // Adiciona o cabeçalho da tabela
        const headerRow = document.createElement('tr');
        headerRow.innerHTML = `
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Código do Sistema (antigo)</th>
            <th>Código do Sistema (novo)</th>
            <th>Localização</th>
        `;
        table.appendChild(headerRow);
        
        // Função para renderizar a tabela
        function renderTable(items) {
            // Limpa a tabela antes de renderizar
            const existingRows = table.querySelectorAll('tr:not(:first-child)');
            existingRows.forEach(row => row.remove()); // Remove as linhas existentes

            // Ordena os itens em ordem alfabética
            items.sort((a, b) => a.produto.localeCompare(b.produto));

            items.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.produto}</td>
                    <td>${item.estoqueFinal}</td>
                    <td>${item.codSistema}</td>
                    <td>${item.codigoNovo}</td>
                    <td>Dado inexistente na planilha...<td>
                `;
                //todo: adicionar a linha abaixo na renderização da tabela quando a coluna 'Localização' estiver presente na planilha
                //<td>${item.local}</td>
                table.appendChild(row);
            });

            // Adiciona a tabela ao div do estoque (apenas uma vez)
            if (!estoqueDiv.contains(table)) {
                estoqueDiv.appendChild(table);
            }
        }

        // Renderiza a tabela inicial
        renderTable(data.estoque);

        // Função de pesquisa
        const searchInput = document.getElementById('search');
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredItems = data.estoque.filter(item => 
                item.produto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(searchTerm) ||
                //descomentar a linha abaixo quando a coluna 'Localização' estiver presente na planilha
                //item.local.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(searchTerm) ||
                item.codSistema.includes(searchTerm) ||
                item.codigoNovo.includes(searchTerm)
            );
            renderTable(filteredItems);
        });
    })
    .catch(error => console.error('Erro ao carregar o arquivo JSON:', error));

