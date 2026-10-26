import test from 'node:test';
import assert from 'node:assert/strict';
import {splitScanText,resizeChoices} from '../dist/import-text.js';
import {createSession,enterQuestion,answer,advance} from '../dist/engine.js';
test('five-choice scan separates question, options, answer and explanation',()=>{
 const r=splitScanText('問題\n常時使用する労働者数が300人で…\n（１）通信業\n（２）各種商品小売業\n（３）旅館業\n（４）ゴルフ場業\n（５）医療業\n解答：5\n解説\n説明です。');
 assert.equal(r.choices.length,5);assert.equal(r.choices[4],'医療業');assert.equal(r.correctNumber,5);assert.equal(r.explanation,'説明です。');
 assert.equal(splitScanText('問題\n例\n(1)一\n(2)二\n(3)三\n(4)四\n(5)五').correctNumber,null);
});
test('changing count preserves stable IDs and clears deleted correct answer',()=>{
 const q={choices:Array.from({length:5},(_,i)=>({id:String(i),position:i,text:String(i)})),correct_choice_id:'4'};
 const reduced=resizeChoices(q,4,()=>crypto.randomUUID());assert.equal(reduced.correct_choice_id,null);assert.equal(reduced.choices[0].id,'0');assert.equal(resizeChoices(reduced,5,()=>crypto.randomUUID()).choices.length,5);
});
test('five-choice stamina repeats only incorrect questions, accepts fifth answer',()=>{
 const q={id:crypto.randomUUID(),shuffle:false,choices:Array.from({length:5},(_,i)=>({id:String(i),position:i})),correct_choice_id:'4'};
 const s=createSession([q],'stamina');enterQuestion(s);answer(s,'0');advance(s);assert.equal(s.round,2);assert.equal(answer(s,'4').display_number,5);advance(s);assert.equal(s.finished,true);
});
