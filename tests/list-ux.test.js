import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const helperStart=source.indexOf('function rateLabel(');
const helperEnd=source.indexOf('\nfunction options(',helperStart);
const context=vm.createContext({});
vm.runInContext(source.slice(helperStart,helperEnd),context);

test('rateLabel formats unattempted and attempted accuracy',()=>{
  assert.equal(context.rateLabel({rate:null,correct:0,total:0}),'未挑戦');
  assert.equal(context.rateLabel({rate:.75,correct:3,total:4}),'正答率 75%（3/4）');
  assert.equal(context.rateLabel({rate:1,correct:5,total:5}),'正答率 100%（5/5）');
});

test('question list renders compact solve, edit, and delete actions',()=>{
  const start=source.indexOf('function list()');
  const end=source.indexOf('\nfunction setup(',start);
  const listSource=source.slice(start,end);
  assert.match(listSource,/<button class="primary small-button" data-solve="\$\{q\.id\}">解く<\/button>/);
  assert.match(listSource,/<button class="small-button" data-edit=/);
  assert.match(listSource,/<button class="small-button" data-delete=/);
  assert.doesNotMatch(listSource,/<button class="primary(?: small-button)?" data-(?:edit|delete)=/);
});

test('question list rows omit question text and genre and conditionally show accuracy',()=>{
  const start=source.indexOf('function list()');
  const end=source.indexOf('\nfunction setup(',start);
  const listSource=source.slice(start,end);
  assert.doesNotMatch(listSource,/q\.text|q\.genre|bookName\(/);
  assert.match(listSource,/s\.rate!==null\?`<span>\$\{rateLabel\(s\)\}<\/span>`:''/);
  assert.doesNotMatch(listSource,/未挑戦/);
});

test('list refresh button is inserted beside the rank filter',()=>{
  const start=source.indexOf('function list()');
  const end=source.indexOf('\nfunction setup(',start);
  const listSource=source.slice(start,end);
  assert.match(listSource,/#list-filters select\[name="rank"\]/);
  assert.match(listSource,/insertAdjacentElement\('afterend',syncButton\)/);
  assert.match(listSource,/syncButton\.dataset\.action='sync'/);
});

test('list delete confirms and edit keeps draft restore confirmation',()=>{
  assert.match(source,/dataset\.delete[\s\S]*?confirm\('この問題を削除しますか？'\)/);
  const start=source.indexOf('async function edit(');
  const end=source.indexOf('\nfunction renderEditor(',start);
  assert.match(source.slice(start,end),/confirm\('この端末に入力途中の下書きがあります。先に下書きを復元しますか？'\)/);
});
