require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // required for Supabase
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- validation helper ----
function validate(body) {
  const name = String(body.name ?? '').trim();
  const category = String(body.category ?? 'General').trim() || 'General';
  const price = Number(body.price);
  const quantity = Number(body.quantity);
  if (!name) return { error: 'Name is required' };
  if (!Number.isFinite(price) || price < 0) return { error: 'Price must be 0 or more' };
  if (!Number.isInteger(quantity) || quantity < 0) return { error: 'Quantity must be a whole number, 0 or more' };
  return { value: { name, category, price, quantity } };
}

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  });

// ---- READ: list (with optional search) ----
app.get('/api/items', wrap(async (req, res) => {
  const q = (req.query.q || '').trim();
  const { rows } = q
    ? await pool.query(
        `SELECT * FROM items WHERE name ILIKE $1 OR category ILIKE $1 ORDER BY id DESC`,
        [`%${q}%`])
    : await pool.query('SELECT * FROM items ORDER BY id DESC');
  res.json(rows);
}));

// ---- READ: dashboard stats ----
app.get('/api/stats', wrap(async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT COUNT(*)::int AS total_items,
           COALESCE(SUM(quantity),0)::int AS total_units,
           COALESCE(SUM(price*quantity),0)::float AS total_value,
           COUNT(*) FILTER (WHERE quantity <= 5)::int AS low_stock
    FROM items`);
  const cats = await pool.query(
    `SELECT category, COUNT(*)::int AS count FROM items GROUP BY category ORDER BY count DESC`);
  res.json({ ...rows[0], categories: cats.rows });
}));

// ---- READ: one ----
app.get('/api/items/:id', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM items WHERE id=$1', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}));

// ---- CREATE ----
app.post('/api/items', wrap(async (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).json({ error });
  const { rows } = await pool.query(
    `INSERT INTO items (name, category, price, quantity) VALUES ($1,$2,$3,$4) RETURNING *`,
    [value.name, value.category, value.price, value.quantity]);
  res.status(201).json(rows[0]);
}));

// ---- UPDATE ----
app.put('/api/items/:id', wrap(async (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).json({ error });
  const { rows } = await pool.query(
    `UPDATE items SET name=$1, category=$2, price=$3, quantity=$4, updated_at=NOW()
     WHERE id=$5 RETURNING *`,
    [value.name, value.category, value.price, value.quantity, req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}));

// ---- DELETE ----
app.delete('/api/items/:id', wrap(async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM items WHERE id=$1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
}));

// ---- startup ----
async function init() {
  await pool.query(require('fs').readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Dashboard running at http://localhost:${port}`));
}
init().catch((e) => { console.error('Startup failed:', e.message); process.exit(1); });
