import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');

test('header account button and its JavaScript references are removed',()=>{
  const header=html.match(/<header>[\s\S]*?<\/header>/)?.[0]||'';
  assert.doesNotMatch(header,/id=["']account["']/);
  assert.doesNotMatch(app,/\$\(["']#account["']\)/);
});

test('akane is the primary theme color',()=>{
  assert.match(css,/--green:#B7282E/i);
  assert.match(css,/#B7282E/i);
  assert.doesNotMatch(css,/#17664c/i);
});

test('application version is updated for the theme release',()=>{
  assert.match(app,/const APP_VERSION = '2026\.10\.26-2';/);
});
