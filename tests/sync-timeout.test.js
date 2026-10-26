import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const context=vm.createContext({setTimeout,clearTimeout,Promise,Error});
const start=source.indexOf('function withTimeout(');
const end=source.indexOf('\nasync function sync(',start);
vm.runInContext(source.slice(start,end),context);

test('withTimeout resolves completed work and rejects hung work',async()=>{
 assert.equal(await context.withTimeout(Promise.resolve('ok'),50),'ok');
 await assert.rejects(context.withTimeout(new Promise(()=>{}),10),/タイムアウト/);
});

test('sync applies a 15000ms timeout to outbox flush and repository load',()=>{
 const syncSource=source.slice(source.indexOf('async function sync('),source.indexOf('\nasync function initAuth('));
 assert.match(syncSource,/withTimeout\(flushOutbox\(\),15000\)/);
 assert.match(syncSource,/withTimeout\(r\.load\(\),15000\)/);
 assert.match(syncSource,/finally\{syncing=false;\}/);
});
