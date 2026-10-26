import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const appSource=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const engineSource=readFileSync(new URL('../dist/engine.js',import.meta.url),'utf8');
const studyStart=appSource.indexOf('function renderStudy(');
const studyEnd=appSource.indexOf('\nasync function queueEvent(',studyStart);
const studySource=appSource.slice(studyStart,studyEnd);
const clickStart=appSource.indexOf("case 'reveal':");
const clickEnd=appSource.indexOf("case 'next':",clickStart);
const revealHandler=appSource.slice(clickStart,clickEnd);

test('study answer visibility is scoped to an answer or the current revealed question',()=>{
  assert.match(engineSource,/currentAnswer:null,revealedFor:undefined/);
  assert.match(studySource,/show=!!s\.currentAnswer\|\|s\.revealedFor===q\.id/);
  assert.doesNotMatch(studySource,/show=s\.mode==='learning'/);
});

test('learning mode renders the reveal control only while the answer is hidden',()=>{
  assert.match(studySource,/s\.mode==='learning'[\s\S]*?show\?'':'<button data-action="reveal">答えを見る<\/button>'/);
});

test('reveal handler only marks the current question and rerenders',()=>{
  assert.match(revealHandler,/session\.revealedFor=q\.id;renderStudy\(\)/);
  assert.doesNotMatch(revealHandler,/\banswer\s*\(|queueEvent\s*\(/);
});

test('editor answer and hint panel has a visible heading',()=>{
  const editorStart=appSource.indexOf('function renderEditor(');
  const editorEnd=appSource.indexOf('\nasync function saveEditor(',editorStart);
  const editorSource=appSource.slice(editorStart,editorEnd);
  assert.match(editorSource,/<div class="panel form-grid"><h2 class="wide">答え・ヒント<\/h2>\$\{\[\['answer_text'/);
});
