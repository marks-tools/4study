import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const start=source.indexOf('function uploadPlan(');
const end=source.indexOf('\nasync function normalizeImage(',start);
const context=vm.createContext({});
vm.runInContext(source.slice(start,end),context);

test('uploadPlan keeps only supported images at or below 2 MB as-is',()=>{
  assert.equal(context.uploadPlan('image/jpeg',1000),'asis');
  assert.equal(context.uploadPlan('image/png',2000001),'convert');
  assert.equal(context.uploadPlan('image/heic',1000),'convert');
  assert.equal(context.uploadPlan('image/webp',2000000),'asis');
  assert.equal(context.uploadPlan('application/octet-stream',1000),'convert');
});
