require('ts-node/register');
const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const db = require('../src/db').default;
const { setRoutes } = require('../src/routes/notes');

test('note ID routes return the note, validate IDs, and report missing records', async t => {
  const originalQuery = db.query;
  const note = { id: 1, title: 'Title', content: 'Body', sourceShort: 'Short', sourceFull: 'Full' };
  let present = true;
  db.query = async (sql, params) => {
    if (sql.startsWith('SELECT')) {
      assert.match(sql, /source_short AS sourceShort/);
      assert.match(sql, /source_full AS sourceFull/);
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
  const app = express();
  app.use(express.json());
  setRoutes(app);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => {
    db.query = originalQuery;
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
