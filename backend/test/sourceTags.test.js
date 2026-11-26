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
  db.query = async () => [{ id: 1, ...tag }];
  db.transaction = async work => work({
    query: async (sql, params) => {
      calls.push({ sql, params });
      if (sql.startsWith('SELECT')) return [params[0] === 1 ? [{ sourceShort: 'OLD' }] : []];
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

  assert.equal((await (await fetch(url)).json())[0].sourceShort, 'NEW');
  let response = await request('POST', '', { sourceShort: 'NEW' });
  assert.equal(response.status, 400);
  response = await request('POST', '', tag);
  assert.equal(response.status, 201);
  assert.equal((await response.json()).updatedNotes, 2);
  assert.deepEqual(calls.at(-1).params.slice(-2), ['NEW', 'NEW']);
  response = await request('PUT', '/1', tag);
  assert.equal(response.status, 200);
  assert.deepEqual(calls.at(-1).params.slice(-2), ['OLD', 'NEW']);
  response = await request('PUT', '/2', tag);
  assert.equal(response.status, 404);
  response = await request('PUT', '/invalid', tag);
  assert.equal(response.status, 400);
  duplicate = true;
  response = await request('POST', '', tag);
  assert.equal(response.status, 409);
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
