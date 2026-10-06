const express = require('express');
const books = require('./data/books.json');
const authors = require('./data/authors.json');

const BOOK_SORT_FIELDS = ['title', 'year', 'rating', 'price'];
const ORDERS = ['asc', 'desc'];
const BOOK_PARAMS = ['genre', 'minRating', 'maxRating', 'q', 'sort', 'order', 'page', 'limit'];
const AUTHOR_PARAMS = ['country', 'q', 'page', 'limit'];

class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
const bad = (code, message, param) => new ApiError(400, code, message, param ? { param } : undefined);

// ---- validation helpers -------------------------------------------------
function assertKnownParams(query, allowed) {
  for (const key of Object.keys(query)) {
    if (!allowed.includes(key)) {
      throw bad('UNSUPPORTED_PARAMETER', `Unsupported query parameter '${key}'. Allowed: ${allowed.join(', ')}`, key);
    }
  }
}

function single(query, name) {
  const v = query[name];
  if (Array.isArray(v)) throw bad('INVALID_PARAMETER', `'${name}' must be provided only once`, name);
  if (v !== undefined && typeof v !== 'string') throw bad('INVALID_PARAMETER', `'${name}' must be a string`, name);
  return v;
}

function intParam(query, name, { min, max, def }) {
  const raw = single(query, name);
  if (raw === undefined) return def;
  if (!/^-?\d+$/.test(raw)) throw bad('INVALID_PARAMETER', `'${name}' must be an integer`, name);
  const n = Number(raw);
  if (n < min || n > max) throw bad('INVALID_PARAMETER', `'${name}' must be between ${min} and ${max}`, name);
  return n;
}

function numParam(query, name, { min, max }) {
  const raw = single(query, name);
  if (raw === undefined) return undefined;
  if (raw.trim() === '' || Number.isNaN(Number(raw))) throw bad('INVALID_PARAMETER', `'${name}' must be a number`, name);
  const n = Number(raw);
  if (n < min || n > max) throw bad('INVALID_PARAMETER', `'${name}' must be between ${min} and ${max}`, name);
  return n;
}

function enumParam(query, name, allowed, def) {
  const raw = single(query, name);
  if (raw === undefined) return def;
  if (!allowed.includes(raw)) throw bad('INVALID_PARAMETER', `'${name}' must be one of: ${allowed.join(', ')}`, name);
  return raw;
}

function idParam(raw) {
  if (!/^\d+$/.test(raw) || Number(raw) < 1) throw bad('INVALID_PARAMETER', "'id' must be a positive integer", 'id');
  return Number(raw);
}

function paginate(items, query) {
  const page = intParam(query, 'page', { min: 1, max: 100000, def: 1 });
  const limit = intParam(query, 'limit', { min: 1, max: 50, def: 10 });
  const total = items.length;
  const start = (page - 1) * limit;
  return {
    data: items.slice(start, start + limit),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

// ---- app ----------------------------------------------------------------
function createApp() {
  const app = express();

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.get('/api/books', (req, res) => {
    const q = req.query;
    assertKnownParams(q, BOOK_PARAMS);
    const genre = single(q, 'genre');
    const search = single(q, 'q');
    const minRating = numParam(q, 'minRating', { min: 0, max: 5 });
    const maxRating = numParam(q, 'maxRating', { min: 0, max: 5 });
    if (minRating !== undefined && maxRating !== undefined && minRating > maxRating) {
      throw bad('INVALID_PARAMETER', "'minRating' cannot be greater than 'maxRating'", 'minRating');
    }
    const sort = enumParam(q, 'sort', BOOK_SORT_FIELDS, undefined);
    const order = enumParam(q, 'order', ORDERS, 'asc');

    let result = books.filter((b) => {
      if (genre && b.genre.toLowerCase() !== genre.toLowerCase()) return false;
      if (minRating !== undefined && b.rating < minRating) return false;
      if (maxRating !== undefined && b.rating > maxRating) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!b.title.toLowerCase().includes(s) && !b.author.toLowerCase().includes(s)) return false;
      }
      return true;
    });

    if (sort) {
      const dir = order === 'desc' ? -1 : 1;
      result = [...result].sort((a, b) => {
        const av = a[sort];
        const bv = b[sort];
        const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
        return cmp !== 0 ? cmp * dir : a.id - b.id;
      });
    }
    res.json(paginate(result, q));
  });

  app.get('/api/books/:id', (req, res) => {
    assertKnownParams(req.query, []);
    const id = idParam(req.params.id);
    const book = books.find((b) => b.id === id);
    if (!book) throw new ApiError(404, 'NOT_FOUND', `Book ${id} not found`);
    res.json({ data: book });
  });

  app.get('/api/authors', (req, res) => {
    const q = req.query;
    assertKnownParams(q, AUTHOR_PARAMS);
    const country = single(q, 'country');
    const search = single(q, 'q');
    const result = authors.filter((a) => {
      if (country && a.country.toLowerCase() !== country.toLowerCase()) return false;
      if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    res.json(paginate(result, q));
  });

  app.get('/api/authors/:id/books', (req, res) => {
    assertKnownParams(req.query, ['page', 'limit']);
    const id = idParam(req.params.id);
    const author = authors.find((a) => a.id === id);
    if (!author) throw new ApiError(404, 'NOT_FOUND', `Author ${id} not found`);
    const result = paginate(books.filter((b) => b.authorId === id), req.query);
    res.json({ author, ...result });
  });

  app.use((req, _res, next) => next(new ApiError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`)));

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err instanceof ApiError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.details && { details: err.details }) } });
    }
    console.error(err);
    return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' } });
  });

  return app;
}

function start(port = 3001) {
  return new Promise((resolve) => {
    const server = createApp().listen(port, () => resolve(server));
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3001);
  start(port).then(() => console.log(`Mock API listening on http://localhost:${port}`));
}

module.exports = { createApp, start };
