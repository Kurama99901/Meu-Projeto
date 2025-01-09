let currentIndex = 0;

// Função para atualizar o carrossel
const updateCarousel = () => {
  const carousel = document.getElementById('carousel');
  const sections = document.querySelectorAll('#carousel > section');
  const totalSections = sections.length;

  // Atualizar a posição do carrossel
  const offset = -currentIndex * 100; // 100% para cada seção
  carousel.style.transform = `translateX(${offset}%)`;

  // Desabilitar botões conforme necessário
  //document.getElementById('prev-btn').disabled = currentIndex === 0;
  //document.getElementById('next-btn').disabled = currentIndex === totalSections - 1;
};

// Configuração dos botões de navegação
document.getElementById('prev-btn').addEventListener('click', () => {
  if (currentIndex > 0) {
    currentIndex--;
  } else {
    // Se já estiver na primeira seção, vai para a última seção
    const sections = document.querySelectorAll('#carousel > section');
    currentIndex = sections.length - 1;
  }
  updateCarousel();
});

document.getElementById('next-btn').addEventListener('click', () => {
  const sections = document.querySelectorAll('#carousel > section');
  if (currentIndex < sections.length - 1) {
    currentIndex++;
  } else {
    // Se chegar ao final, volta para a primeira seção
    currentIndex = 0;
  }
  updateCarousel();
});

// Função para inicializar os gráficos
const initCharts = (data) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  // Gráfico de Produtos com Mais Saídas
  const produtosMaisSaidasData = {
    labels: data.produtosSaidas.map((item) => item.produto),
    datasets: [
      {
        label: 'Quantidade Retirada',
        data: data.produtosSaidas.map((item) => item.totalSaidas),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  new Chart(document.getElementById('produtosMaisSaidas').getContext('2d'), {
    type: 'bar',
    data: produtosMaisSaidasData,
    options: chartOptions,
  });

  // Gráfico de Técnicos com Mais Retiradas
  const tecnicosMaisRetiradasData = {
    labels: data.tecnicosRetiradas.map((item) => item.responsavel),
    datasets: [
      {
        label: 'Total de Retiradas',
        data: data.tecnicosRetiradas.map((item) => item.totalRetiradas),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
      },
    ],
  };

  new Chart(document.getElementById('tecnicosMaisRetiradas').getContext('2d'), {
    type: 'doughnut',
    data: tecnicosMaisRetiradasData,
    options: chartOptions,
  });

  // Gráfico de Produtos com Estoque Baixo
  const produtosEstoqueBaixoData = {
    labels: data.produtosEstoqueBaixo.map((item) => item.produto),
    datasets: [
      {
        label: 'Estoque Final',
        data: data.produtosEstoqueBaixo.map((item) => item.estoqueFinal),
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  new Chart(document.getElementById('produtosEstoqueBaixo').getContext('2d'), {
    type: 'line',
    data: produtosEstoqueBaixoData,
    options: chartOptions,
  });
};

// Função para obter os dados da dashboard
const fetchDashboardData = async () => {
  try {
    const response = await fetch('/dashboard/dados');
    const data = await response.json();
    initCharts(data); // Passa os dados para a função de inicialização dos gráficos
  } catch (error) {
    console.error('Erro ao carregar os dados da dashboard:', error);
  }
};

// Configuração inicial do carrossel
updateCarousel();

// Inicializar os gráficos ao carregar os dados da dashboard
fetchDashboardData();
