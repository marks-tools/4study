import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const section=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));

test('settings shows the app version and delegated update action',()=>{
  assert.match(source,/const APP_VERSION = '2026\.10\.26-2'/);
  const settings=section('function settings()','\nfunction switchAuthMode(');
  assert.match(settings,/バージョン<\/strong> \$\{APP_VERSION\}/);
  assert.match(settings,/data-action="check-update">アップデートを確認/);
  assert.match(source,/fetch\(`app\.js\?t=\$\{Date\.now\(\)\}`,\{cache:'no-store'\}\)/);
  assert.match(source,/新しいバージョンがあります。再読み込みします/);
  assert.match(source,/最新のバージョンです/);
});

test('only the solve button has data-solve and list rows are inert',()=>{
  const list=section('function list()','\nfunction setup(');
  assert.match(list,/<div class="question-row">/);
  assert.doesNotMatch(list,/class="question-row" data-solve=/);
  assert.match(list,/<button[^>]+data-solve="\$\{q\.id\}">解く<\/button>/);
  assert.doesNotMatch(source,/question-row\[data-solve\]/);
});

test('single-question solve immediately replaces the current session',()=>{
  const solve=section('async function solveQuestion(','\nfunction images(');
  assert.match(solve,/session=createSession/);
  assert.doesNotMatch(solve,/confirm\s*\(/);
  assert.match(section('async function start(','\nasync function solveQuestion('),/confirm\s*\(/);
});

test('answer sounds and the persisted enabled-by-default setting exist',()=>{
  assert.match(source,/const SFX_KEY='yonstudy:sfx'/);
  assert.match(source,/localStorage\.getItem\(SFX_KEY\)!=='false'/);
  assert.match(source,/async function playAnswerSound\(correct\)/);
  assert.match(source,/1047/);
  assert.match(source,/1319/);
  assert.match(source,/150/);
  assert.match(source,/await playAnswerSound\(ev\.is_correct\)/);
  assert.match(source,/id="sfx-setting" type="checkbox"[^>]*>効果音/);
  assert.match(source,/localStorage\.setItem\(SFX_KEY,String\(sfxEnabled\)\)/);
});

test('demo list hides edit and delete while retaining solve',()=>{
  const list=section('function list()','\nfunction setup(');
  assert.match(list,/data-solve="\$\{q\.id\}">解く<\/button>\$\{!demo\?`<button class="small-button" data-edit=/);
  assert.match(list,/data-delete="\$\{q\.id\}">削除<\/button>`:''\}/);
});
