import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
const saveStart=source.indexOf('async function saveEditor(');
const saveEnd=source.indexOf('\nasync function start(',saveStart);
const saveSource=source.slice(saveStart,saveEnd);

test('saveEditor shows a blocking saving dialog and always hides it',()=>{
  assert.match(source,/id='saving-dialog'/);
  assert.match(source,/登録しています…/);
  assert.match(source,/pointer-events:auto/);
  assert.match(source,/@keyframes saving-dialog-spin/);
  assert.match(saveSource,/saving=true;showSavingDialog\(\)/);
  assert.match(saveSource,/finally\{hideSavingDialog\(\);saving=false;/);
});
