import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {COLUMNS,parseCSV,parseStructured,materialize} from '../dist/bulk-parse.js';
import {validateRow,toQuestion,duplicateCandidates,resolveBook} from '../dist/bulk-model.js';
import {saveImport} from '../dist/bulk-save.js';
const book={id:randomUUID(),name:'試験',year:2026,exam_round:'第1回'};
const fields=(n=1)=>({question:`日本語の問題${n} / English`,choice_a:'A, comma',choice_b:'B "quote"',choice_c:'C\n改行',choice_d:'D',correct_choice:'A'});
const csv=rows=>COLUMNS.join(',')+'\r\n'+rows.map(r=>COLUMNS.map(k=>'"'+String(r[k]??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
function rows(parsed,common={}){return materialize(parsed,{question_book:book.name,bookId:book.id,...common}).map(r=>({...r,id:randomUUID(),choiceIds:Array.from({length:5},randomUUID)}));}
const structured=(answer='C')=>`[QUESTION]\n長い問題\n2行目です\n[A]\n甲\n[B]\n乙\n[C]\n丙\n[D]\n丁\n[ANSWER]\n${answer}\n[EXPLANATION]\n解説, comma\n続き\n[MEMORY]\n覚え方\n[NOTE]\nメモ\n[TAGS]\n計算,暗記`;
test('CSV 1 and 100: UTF-8 BOM, CRLF, Japanese, English, commas, quotes, multiline, long text',()=>{
  const one=parseCSV('\uFEFF'+csv([fields()]));assert.equal(one.length,1);assert.equal(one[0].fields.choice_b,'B "quote"');assert.equal(one[0].fields.choice_c,'C\n改行');
  const input=Array.from({length:100},(_,i)=>({...fields(i),explanation:'長い解説\n'.repeat(800),question:'長い問題\n'.repeat(400)+i,tags:'計算,暗記'}));const parsed=parseCSV(csv(input));assert.equal(parsed.length,100);assert.equal(parsed[90].fields.explanation,input[90].explanation);assert.equal(parsed[0].fields.tags,'計算,暗記');
  assert.throws(()=>parseCSV('question,choice_a\n"unterminated'),/引用符/);assert.throws(()=>parseCSV('question,question\na,b'),/重複/);assert.throws(()=>parseCSV('question\nQ'),/必要な列/);
  const malformed=parseCSV('question,choice_a,choice_b,choice_c,choice_d,correct_choice\nQ,A,B,C,D,A,extra');assert.equal(malformed[0].parseErrors.length,1);
});
test('structured 1 and multiple: optional separator, trailing separator, missing optional fields, unknown and repeated marker errors',()=>{
  assert.equal(parseStructured(structured()).length,1);assert.equal(parseStructured(structured()+'\n---\n'+structured('D')+'\n---').length,2);assert.equal(parseStructured(structured()+'\n'+structured()).length,2);
  const r=rows(parseStructured(structured()))[0];assert.equal(r.fields.explanation,'解説, comma\n続き');assert.equal(validateRow(r,[book]).errors.length,0);
  assert.ok(parseStructured('[QUESTION]\nQ\n[X]\nunknown')[0].parseErrors.length);assert.ok(parseStructured('[QUESTION]\nQ\n[A]\na\n[A]\nb')[0].parseErrors.length);
});
test('A/B/C/D/E become stable UUIDs; defaults and explicit false override common true; invalid fields',()=>{
  for(const letter of ['A','B','C','D','E']){const r=rows(parseCSV(csv([{...fields(),choice_e:letter==='E'?'E':'',correct_choice:letter}])))[0];assert.deepEqual(validateRow(r,[book]).errors,[]);const q=toQuestion(r,book.id);assert.equal(q.correct_choice_id,q.choices['ABCDE'.indexOf(letter)].id);assert.equal(q.rank,'B');assert.equal(q.difficulty,1);assert.equal(q.shuffle,true);assert.equal(q.revision,0);assert.equal(q.question_number,null);}
  const r=rows(parseCSV(csv([{...fields(),shuffle:'0',frequency:'C',difficulty:'4',category:'個別'}])),{shuffle:'true',frequency:'A',difficulty:'2',category:'共通',genre:'共通ジャンル'})[0];assert.equal(toQuestion(r,book.id).shuffle,false);assert.equal(r.fields.frequency,'C');assert.equal(r.fields.category,'個別');assert.equal(r.fields.genre,'共通ジャンル');
  for(const [key,value] of [['correct_choice','1'],['correct_choice','E'],['choice_b',''],['difficulty','0'],['difficulty','6'],['difficulty','1.5'],['shuffle','yes'],['frequency','Z'],['question','']]){const bad=structuredClone(r);bad.fields[key]=value;assert.ok(validateRow(bad,[book]).errors.length,`${key}=${value}`);}
  for(const val of ['TRUE','true','1','FALSE','false','0']){const good=structuredClone(r);good.fields.shuffle=val;assert.equal(validateRow(good,[book]).errors.length,0);}
});
test('book resolution, exact-normalized duplicate warnings without removal, internal duplicate',()=>{
  const rr=rows(parseCSV(csv([fields(),fields()])));assert.equal(duplicateCandidates(rr,[]).get(rr[1].id)[0],'今回の問題 1');assert.equal(rr.length,2);
  assert.ok(duplicateCandidates(rr,[{id:'existing',text:'日本語の問題１／English'}]).has(rr[0].id));
  rr[0].bookId='';assert.ok(resolveBook(rr[0],[book,{...book,id:randomUUID(),year:2025}]).error);
  rr[0].bookId=book.id;assert.equal(resolveBook(rr[0],[book]).book.id,book.id);
  rr[0].bookId='';rr[0].fields.question_book='新規';assert.equal(resolveBook(rr[0],[book]).newName,'新規');
});
function harness(job){const db={books:[book],questions:[]},writes=[];let failId='',loseId='',owner=job.owner;return {db,writes,setFail(id){failId=id;},setLost(id){loseId=id;},changeOwner(){owner='other';},deps:{repo:{async load(){return structuredClone(db);},async book(b,u){assert.equal(u,job.owner);db.books.push(b);return b;},async save(q){writes.push(q.id);if(q.id===failId)throw Error('temporary failure');assert.ok(!db.questions.some(x=>x.id===q.id),'must not overwrite');db.questions.push(q);if(q.id===loseId)throw Error('response lost');},async hasQuestion(id){return db.questions.some(q=>q.id===id);}},checkOwner:async()=>{if(owner!==job.owner)throw Error('owner changed');},persist:async()=>{},makeId:randomUUID}};}
test('partial success, exclusion, invalid row, retry only failed, stable IDs, saved rows never overwrite',async()=>{
  const rr=rows(parseCSV(csv([fields(1),fields(2),fields(3),{...fields(4),choice_b:''}])));rr[2].selected=false;rr[3].selected=false;const job={owner:'user',rows:rr};const h=harness(job);h.setFail(rr[1].id);
  await saveImport(job,h.deps);assert.deepEqual(rr.map(r=>r.status),['saved','failed','pending','pending']);assert.equal(h.db.questions.length,1);
  h.setFail('');await saveImport(job,h.deps);assert.equal(h.db.questions.length,2);assert.equal(h.writes.filter(id=>id===rr[0].id).length,1);await saveImport(job,h.deps);assert.equal(h.db.questions.length,2);
});
test('lost response and reload are reconciled, new books only on commit and once, auth change stops writes',async()=>{
  const rr=rows(parseCSV(csv([fields(1),fields(2)])));rr.forEach(r=>{r.bookId='';r.fields.question_book='新しい問題集';});const job={owner:'user',rows:rr};const h=harness(job);assert.equal(h.db.books.length,1);assert.equal(h.db.questions.length,0);h.setLost(rr[0].id);await saveImport(job,h.deps);assert.equal(rr[0].status,'saved');assert.equal(h.db.books.length,2);
  const restarted=structuredClone(job);restarted.rows.forEach(r=>r.status='failed');await saveImport(restarted,h.deps);assert.equal(h.writes.length,2);
  const newJob={owner:'user',rows:rows(parseCSV(csv([fields(9)])))};const hh=harness(newJob);hh.changeOwner();await assert.rejects(saveImport(newJob,hh.deps),/owner/);assert.equal(hh.writes.length,0);
});
test('local persistence failure prevents remote writes',async()=>{const job={owner:'user',rows:rows(parseCSV(csv([fields()])))};const h=harness(job);h.deps.persist=async()=>{throw Error('quota');};await assert.rejects(saveImport(job,h.deps),/quota/);assert.equal(h.writes.length,0);});
