require('ts-node/register');
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const db = require('../src/db').default;
const router = require('../src/routes/sourceTags').default;
const { NotesService } = require('../src/services/notesService');

test('source tag API validates and synchronizes matching notes', async t => {
  const originalQuery = db.query;
  const originalTransaction = db.transaction;
  const tag = { sourceShort: 'NEW', sourceFull: 'Full citation', bookId: 7, bookTitle: 'Book', bookSlug: 'book' };
  const calls = [];
  let duplicate = false;
  db.query = async () => [{ id: 1, ...tag, takenFromCopybook: 1, takenFromBook: 0 }];
  db.transaction = async work => work({
    query: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.startsWith('SELECT')) return [params[0] === 1 ? [{ sourceShort: 'OLD', takenFromCopybook: 1, takenFromBook: 0 }] : []];
      if (duplicate) throw Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
      if (sql.startsWith('INSERT')) return [{ insertId: 1 }];
      return [{ affectedRows: 2 }];
    }
  });
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => { db.query = originalQuery; db.transaction = originalTransaction; server.close(); });
  const url = `http://127.0.0.1:${server.address().port}/api/source-tags`;
  const request = (method, path, body) => fetch(url + path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  const listed = (await (await fetch(url)).json())[0];
  assert.equal(listed.sourceShort, 'NEW');
  assert.equal(listed.takenFromCopybook, true);
  assert.equal(listed.takenFromBook, false);
  let response = await request('POST', '', { sourceShort: 'NEW' });
  assert.equal(response.status, 400);
  response = await request('POST', '', tag);
  assert.equal(response.status, 201);
  const created = await response.json();
  assert.equal(created.updatedNotes, 2);
  assert.equal(created.takenFromCopybook, false);
  assert.equal(created.takenFromBook, false);
  assert.deepEqual(calls.find(c => c.sql.startsWith('INSERT')).params.slice(-2), [false, false]);
  assert.deepEqual(calls.at(-1).params.slice(-2), ['NEW', 'NEW']);
  response = await request('PUT', '/1', tag);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).takenFromCopybook, true);
  assert.deepEqual(calls.find(c => c.sql.startsWith('UPDATE source_tags')).params.slice(-3), [true, false, 1]);
  assert.deepEqual(calls.at(-1).params.slice(-2), ['OLD', 'NEW']);
  response = await request('PUT', '/1', { ...tag, takenFromCopybook: false, takenFromBook: true });
  assert.equal(response.status, 200);
  assert.deepEqual(calls.filter(c => c.sql.startsWith('UPDATE source_tags')).at(-1).params.slice(-3), [false, true, 1]);
  const callCount = calls.length;
  response = await request('POST', '', { ...tag, takenFromBook: 'true' });
  assert.equal(response.status, 400);
  assert.equal(calls.length, callCount);
  response = await request('PUT', '/2', tag);
  assert.equal(response.status, 404);
  response = await request('PUT', '/invalid', tag);
  assert.equal(response.status, 400);
  duplicate = true;
  response = await request('POST', '', tag);
  assert.equal(response.status, 409);
});

test('note reads derive tag origins with exact short-code matching', async t => {
  const originalQuery = db.query;
  const queries = [];
  db.query = async (sql) => {
    queries.push(sql);
    if (sql.startsWith('SELECT COUNT')) return [{ total: 1 }];
    return [{ id: 1, title: 'Title', content: 'Body', takenFromCopybook: 1, takenFromBook: 0 }];
  };
  t.after(() => { db.query = originalQuery; });
  const service = new NotesService();
  const list = await service.getAllNotes();
  const detail = await service.getNoteById(1);
  assert.equal(list.rows[0].takenFromCopybook, true);
  assert.equal(list.rows[0].takenFromBook, false);
  assert.equal(detail.takenFromCopybook, true);
  for (const sql of queries.filter(sql => !sql.startsWith('SELECT COUNT'))) {
    assert.match(sql, /LEFT JOIN source_tags t ON BINARY n.source_short = BINARY t.source_short/);
  }
});

test('notes using a managed short code use its full source and book', async t => {
  const originalQuery = db.query;
  const originalTransaction = db.transaction;
  const calls = [];
  const tag = { sourceShort: 'CODE', sourceFull: 'Canonical source', bookId: 7, bookTitle: 'Book', bookSlug: 'book' };
  const query = async (sql, params) => {
    calls.push({ sql, params });
    if (sql.includes('FROM source_tags')) return [tag];
    if (sql.startsWith('INSERT')) return { insertId: 1 };
    if (sql.startsWith('UPDATE')) return { affectedRows: 1 };
    if (sql.startsWith('SELECT')) return [{ id: 1, title: 'Title', content: 'Body', ...tag }];
    throw new Error(`Unexpected query: ${sql}`);
  };
  db.query = query;
  db.transaction = async work => work({ query: async (sql, params) => [await query(sql, params)] });
  t.after(() => { db.query = originalQuery; db.transaction = originalTransaction; });
  const service = new NotesService();
  await service.createNote({ title: 'Title', content: 'Body', sourceShort: 'CODE', sourceFull: 'Other' });
  assert.deepEqual(calls.find(c => c.sql.startsWith('INSERT')).params.slice(2), ['CODE', 'Canonical source', 7, 'Book', 'book']);
  calls.length = 0;
  await service.updateNote(1, { sourceShort: 'CODE', sourceFull: 'Other' });
  const update = calls.find(c => c.sql.startsWith('UPDATE'));
  assert.deepEqual(update.params, ['CODE', 'Canonical source', 7, 'Book', 'book', 1]);
});
