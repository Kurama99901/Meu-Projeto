// app.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Configurar o Express para usar EJS como motor de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Permite que o Express entenda JSON no corpo das requisições
app.use(express.json()); 

// Rota para renderizar a página EJS
app.get('/', (req, res) => {
  const dados = {
    titulo: 'Minha Dashboard',
    mensagem: 'Este é um servidor Node.js com Express renderizando HTML com EJS!'
  };
  res.render('index', dados);  // Renderiza o template 'index.ejs' com os dados
});

// Rota para salvar o estoque
app.post('/salvar-estoque', (req, res) => {
  const estoqueData = req.body; // Recebe os dados do estoque enviados pelo frontend
  
  // Caminho para o arquivo estoque.json na pasta 'public'
  const estoqueFilePath = path.join(__dirname, 'public', 'estoque.json');

  // Salva os dados no arquivo estoque.json
  fs.writeFile(estoqueFilePath, JSON.stringify({ estoque: estoqueData }, null, 2), (err) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao salvar o estoque.' });
    }
    res.json({ message: 'Estoque salvo com sucesso!' });
  });
});

// Rota para carregar o estoque
app.get('/estoque', (req, res) => {
  const estoqueFilePath = path.join(__dirname, 'public', 'estoque.json');

  fs.readFile(estoqueFilePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Erro ao carregar o estoque.' });
    }
    res.json(JSON.parse(data)); // Retorna o estoque em formato JSON
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
