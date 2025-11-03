import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// In-memory counter to verify DELETE requests from Turbo
let deleteCount = 0;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Two routes that serve specific HTML referencing different Turbo versions via CDN
app.get('/v8_0_13', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index-8-0-13.html'));
});

app.get('/v8_0_14', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index-8-0-14.html'));
});

// Endpoint that Turbo should call with data-turbo-method="DELETE"
app.delete('/logout', (req, res) => {
  deleteCount += 1;
  // No content is fine; Turbo shouldn't navigate away.
  res.status(204).end();
});

// Testing helpers
app.post('/_reset', (req, res) => {
  deleteCount = 0;
  res.json({ ok: true });
});

app.get('/_count', (req, res) => {
  res.json({ deleteCount });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`  • 8.0.13 page: http://localhost:${port}/v8_0_13`);
  console.log(`  • 8.0.14 page: http://localhost:${port}/v8_0_14`);
});
