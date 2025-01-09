document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search");
    const checklistDiv = document.getElementById("checklistDiv");
    const modal = document.getElementById("modalChecklist");
    const btnSalvarEdicao = document.getElementById("salvarEdicao");
    const btnFecharModal = document.querySelector(".fechar");

    const checklistInput = {
        produto: document.getElementById("itemNome"),
        codSistema: document.getElementById("itemCodigo"),
        estoqueFinal: document.getElementById("itemQuantidade"),
        local: document.getElementById("itemLocalizacao"),
    };

    let checklistData = [];
    let itemEditado = null;

    const apiUrl = 'http://localhost:3000';

    // Carregar os dados do checklist
    async function loadChecklistData() {
        try {
            const response = await fetch(`${apiUrl}/checklist`);
            if (!response.ok) {
                throw new Error(`Erro ao carregar checklist: ${response.status}`);
            }
            const data = await response.json();
            checklistData = data.checklist || [];
            renderChecklist(checklistData);
        } catch (error) {
            console.error(error);
        }
    }

    // Renderizar checklist na tabela
    function renderChecklist(items) {
        if (!checklistDiv) {
            console.error("Elemento com ID 'checklistDiv' não foi encontrado no DOM.");
            return;
        }

        checklistDiv.innerHTML = "";
        const table = document.createElement("table");
        table.classList.add("tabela-checklist");

        // Cabeçalho da tabela
        const headerRow = document.createElement("tr");
        headerRow.innerHTML = `
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Código do Sistema</th>
            <th>Localização</th>
            <th>Ações</th>
        `;
        table.appendChild(headerRow);

        // Itens do checklist
        items.forEach((item, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${item.produto}</td>
                <td>${item.estoqueFinal}</td>
                <td>${item.codSistema}</td>
                <td>${item.local}</td>
                <td><button class="editar-item" data-index="${index}">✏️</button></td>
            `;
            table.appendChild(row);
        });

        checklistDiv.appendChild(table);

        // Adicionar eventos aos botões de editar
        document.querySelectorAll(".editar-item").forEach((button) => {
            button.addEventListener("click", openEditModal);
        });
    }

    // Abrir o modal para edição
    function openEditModal(event) {
        const index = event.target.dataset.index;
        itemEditado = checklistData[index];

        checklistInput.produto.value = itemEditado.produto;
        checklistInput.codSistema.value = itemEditado.codSistema;
        checklistInput.estoqueFinal.value = itemEditado.estoqueFinal;
        checklistInput.local.value = itemEditado.local;

        modal.style.display = "block";
        document.body.style.overflow = "hidden";
    }

    // Fechar o modal
    function closeModal() {
        modal.style.display = "none";
        document.body.style.overflow = "auto";
    }

    // Salvar alterações no item
    function saveEdit() {
        if (itemEditado) {
            itemEditado.produto = checklistInput.produto.value;
            itemEditado.codSistema = checklistInput.codSistema.value;
            itemEditado.estoqueFinal = parseInt(checklistInput.estoqueFinal.value, 10);
            itemEditado.local = checklistInput.local.value;

            saveChecklistData(itemEditado); // Salva no servidor
            renderChecklist(checklistData); // Atualiza a tabela
            closeModal(); // Fecha o modal
        }
    }

    // Salvar os dados no servidor
    async function saveChecklistData(item) {
        try {
            const response = await fetch(`${apiUrl}/salvar-estoque`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify([item]),
            });

            if (!response.ok) {
                throw new Error("Erro ao salvar os dados no servidor.");
            }
            console.log("Dados salvos no servidor:", await response.json());
        } catch (error) {
            console.error(error);
        }
    }

    // Função para imprimir a tabela
    function imprimirTabela() {
        const tabela = document.querySelector(".tabela-checklist");
        if (!tabela) {
            alert("Nenhum checklist disponível para impressão!");
            return;
        }

        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
            <html>
            <head>
                <title>Checklist - Imprimir</title>
                <link rel="stylesheet" href="/Estoque/styles.css">
            </head>
            <body>
                ${tabela.outerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }

    // Adicionar evento ao ícone de impressão
    document.getElementById("btnImprimir").addEventListener("click", function () {
        window.print(); // Chama o diálogo de impressão com o estilo @media print
    });
    
    // Eventos
    btnFecharModal.addEventListener("click", closeModal);
    btnSalvarEdicao.addEventListener("click", saveEdit);

    searchInput.addEventListener("input", function () {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredItems = checklistData.filter((item) =>
            item.produto.toLowerCase().includes(searchTerm) ||
            item.codSistema.toLowerCase().includes(searchTerm)
        );
        renderChecklist(filteredItems);
    });

    loadChecklistData(); // Inicializa carregando os dados
});
