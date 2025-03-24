
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import compression from 'compression';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

// Compressão gzip para melhor performance
app.use(compression());

// Servir arquivos estáticos da pasta dist
app.use(express.static(resolve(__dirname, 'dist')));

// Todas as requisições não atendidas pelos arquivos estáticos serão redirecionadas para o index.html
app.get('*', (req, res) => {
  res.sendFile(resolve(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
