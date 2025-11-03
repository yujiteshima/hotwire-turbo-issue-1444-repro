// @ts-nocheck
// @playwright-no-transform
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // for POST + _method=delete

// ===== Stats =====
let stats = {
  deleteCount: 0,         // DELETE /logout
  postOverrideCount: 0,   // POST /logout with _method=delete
  getCount: 0,            // GET /logout
  totalLogoutHits: 0,     // sum of the above
};

function inc(field) {
  stats[field] += 1;
  stats.totalLogoutHits += 1;
}

// ===== Test helpers (defined before static files) =====
app.post('/_reset', (req, res) => {
  stats = { deleteCount: 0, postOverrideCount: 0, getCount: 0, totalLogoutHits: 0 };
  res.json({ ok: true });
});
app.get('/_count', (req, res) => res.json({ deleteCount: stats.deleteCount }));
app.get('/_stats', (req, res) => res.json(stats));

// ===== Pages =====
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/v8_0_13', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index-8-0-13.html')));
app.get('/v8_0_14', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index-8-0-14.html')));

// ===== /logout endpoints =====
app.delete('/logout', (req, res) => {
  console.log('[server] DELETE /logout');
  inc('deleteCount');
  res.status(204).end();
});

app.post('/logout', (req, res) => {
  const m = (req.body?._method || req.query?._method || '').toLowerCase();
  console.log('[server] POST /logout _method=%s', m || '(none)');
  if (m === 'delete') {
    inc('postOverrideCount');
  } else {
    // Don't count regular POST in metrics (out of scope for this test)
  }
  res.status(204).end();
});

app.get('/logout', (req, res) => {
  console.log('[server] GET /logout');
  inc('getCount');
  // Redirect to top for easier observation (side effect: no additional GET occurs)
  res.redirect('/');
});

// ===== Static files (defined last) =====
app.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
