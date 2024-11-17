// app.js
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Configurar o Express para usar EJS como motor de templates
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rota para renderizar a página EJS
app.get('/', (req, res) => {
  const dados = {
    titulo: 'Minha Dashboard',
    mensagem: 'Este é um servidor Node.js com Express renderizando HTML com EJS!'
  };
  res.render('index', dados);  // Renderiza o template 'index.ejs' com os dados
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
