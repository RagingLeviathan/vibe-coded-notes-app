require('ts-node/register');
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const db = require('../src/db').default;
const { setRoutes } = require('../src/routes/notes');

test('note ID routes return the note, validate IDs, and report missing records', async t => {
  const originalQuery = db.query;
  const originalTransaction = db.transaction;
  const note = { id: 1, title: 'Title', content: 'Body', sourceShort: 'Short', sourceFull: 'Full', bookId: 7, bookTitle: 'Book', bookSlug: 'book' };
  let present = true;
  db.query = async (sql, params) => {
    if (sql.includes('FROM source_tags')) return [];
    if (sql.startsWith('SELECT')) {
      assert.match(sql, /source_short AS sourceShort/);
      assert.match(sql, /source_full AS sourceFull/);
      assert.match(sql, /book_id AS bookId/);
      if (sql.includes('ORDER BY')) return [note];
      return present && params[0] === 1 ? [note] : [];
    }
    if (sql.startsWith('DELETE')) {
      const affectedRows = present && params[0] === 1 ? 1 : 0;
      if (affectedRows) present = false;
      return { affectedRows };
    }
    if (sql.startsWith('INSERT')) return { insertId: 1 };
    if (sql.startsWith('UPDATE')) return { affectedRows: 0 };
    throw new Error(`Unexpected query: ${sql}`);
  };
  db.transaction = async work => work({ query: async (sql, params) => [await db.query(sql, params)] });
  const app = express();
  app.use(express.json());
  setRoutes(app);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => {
    db.query = originalQuery;
    db.transaction = originalTransaction;
    server.close();
  });

  const base = `http://127.0.0.1:${server.address().port}/api/notes`;

  let response = await fetch(`${base}/1`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), note);
  response = await fetch(base, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Title', content: 'Body', sourceShort: 'Short', sourceFull: 'Full' })
  });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), note);
  response = await fetch(`${base}/export?format=json`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).notes[0].bookId, 7);
  response = await fetch(`${base}/1`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: '' })
  });
  assert.equal(response.status, 400);
  response = await fetch(`${base}/1`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'New', bookId: 7, bookTitle: 'Book', bookSlug: 'book' })
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).bookId, 7);
  assert.equal((await fetch(`${base}/1abc`)).status, 400);
  assert.equal((await fetch(`${base}/0`, { method: 'DELETE' })).status, 400);
  assert.equal((await fetch(`${base}/1`, { method: 'DELETE' })).status, 204);
  assert.equal((await fetch(`${base}/1`)).status, 404);
  assert.equal((await fetch(`${base}/1`, { method: 'DELETE' })).status, 404);
  response = await fetch(`${base}/1`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: 'New' })
  });
  assert.equal(response.status, 404);
});

test('source filtering is exact, parameterized, and paginated', async t => {
  const originalQuery = db.query;
  const calls = [];
  db.query = async (sql, params) => {
    calls.push({ sql, params });
    if (sql.startsWith('SELECT COUNT')) return [{ total: 6 }];
    return [{ id: 6, title: 'Sixth', content: 'Body', sourceFull: 'A & B_%' }];
  };
  const app = express();
  app.use(express.json());
  setRoutes(app);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { db.query = originalQuery; server.close(); });
  const base = `http://127.0.0.1:${server.address().port}/api/notes`;
  const params = new URLSearchParams({ page: '2', limit: '5', q: 'six', fields: 'title,content' });
  const request = body => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const response = await fetch(`${base}/by-source?${params}`, request({ sourceFull: 'A & B_%' }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.total, 6);
  assert.equal(body.page, 2);
  assert.equal(body.data[0].sourceFull, 'A & B_%');
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.match(call.sql, /WHERE BINARY source_full = BINARY \? AND \(title LIKE \? OR content LIKE \?\)/);
    assert.ok(!call.sql.includes('A & B_%'));
  }
  assert.deepEqual(calls[0].params, ['A & B_%', '%six%', '%six%']);
  assert.deepEqual(calls[1].params, ['A & B_%', '%six%', '%six%', 5, 5]);
  assert.match(calls[1].sql, /ORDER BY created_at DESC, id DESC LIMIT \? OFFSET \?/);

  assert.equal((await fetch(`${base}/by-source`, request({ sourceFull: '' }))).status, 400);
  assert.equal((await fetch(`${base}/by-source`, request({ sourceFull: ['one', 'two'] }))).status, 400);
  assert.equal((await fetch(`${base}/by-source`, request({ sourceFull: 'x'.repeat(10001) }))).status, 400);
  assert.equal(calls.length, 2);
});

test('database failures log useful diagnostics without note contents or SQL', async t => {
  const originalQuery = db.query;
  const originalError = console.error;
  const logs = [];
  console.error = (...args) => logs.push(args);
  db.query = async () => {
    const error = new Error('private note text and password');
    error.code = 'ECONNREFUSED';
    error.errno = -4078;
    error.syscall = 'connect';
    error.sql = 'private note text';
    throw error;
  };
  const app = express();
  app.use(express.json());
  setRoutes(app);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { db.query = originalQuery; console.error = originalError; server.close(); });
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/notes`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'private note text', content: 'private note text' })
  });
  assert.equal(response.status, 500);
  const body = await response.json();
  assert.match(body.errorId, /^[0-9a-f-]{36}$/);
  assert.equal(body.error, undefined);
  assert.equal(logs.length, 1);
  assert.equal(logs[0][2].operation, 'create note');
  assert.equal(logs[0][2].errorId, body.errorId);
  assert.equal(logs[0][2].code, 'ECONNREFUSED');
  assert.equal(logs[0][2].syscall, 'connect');
  assert.doesNotMatch(JSON.stringify({ body, logs }), /private note text|password/);
});
