export const LETTERS=['A','B','C','D','E'];
export const normalizeQuestion=s=>String(s||'').normalize('NFKC').toLowerCase().replace(/[\s\p{P}\p{S}]/gu,'');
export function resolveBook(row,books){
  const name=row.fields.question_book.trim();
  if(row.bookId){const book=books.find(b=>b.id===row.bookId);return book?{book}:{error:'選択した問題集が見つかりません。選び直してください。'};}
  if(!name)return {error:'問題集を選択するか、問題集名を指定してください。'};
  if(name.length>120)return {error:'問題集名は120文字以内にしてください。'};
  const found=books.filter(b=>b.name===name);
  if(found.length>1)return {error:'同名の問題集が複数あります。修正画面で年・回を選んでください。'};
  return found.length?{book:found[0]}:{newName:name};
}
export function validateRow(row,books){
  const f=row.fields,errors=[...row.parseErrors],warnings=[...row.parseWarnings];
  const count=f.choice_e?.trim()?5:4;
  if(!f.question.trim())errors.push('問題文が必要です（このインポートでは画像を取り込まないため）。');
  LETTERS.slice(0,count).forEach(l=>{if(!f['choice_'+l.toLowerCase()]?.trim())errors.push('選択肢'+l+'を入力してください。');});
  if(!LETTERS.slice(0,count).includes(f.correct_choice.trim().toUpperCase()))errors.push('正解は'+LETTERS.slice(0,count).join('/')+'で指定してください。');
  if(!/^[1-5]$/.test(f.difficulty.trim()))errors.push('難易度は1〜5の整数です。');
  if(!['A','B','C'].includes(f.frequency.trim().toUpperCase()))errors.push('頻出ランクはA/B/Cです。');
  if(!/^(true|false|1|0)$/i.test(f.shuffle.trim()))errors.push('シャッフルはTRUE/FALSEまたは1/0です。');
  const book=resolveBook(row,books);if(book.error)errors.push(book.error);if(book.newName)warnings.push('新しい問題集を登録時に作成：'+book.newName);
  if(!f.explanation.trim())warnings.push('解説なし');if(!f.memory_tip.trim())warnings.push('覚え方なし');if(!f.tags.trim())warnings.push('タグなし');
  return {errors,warnings,book,count};
}
export function duplicateCandidates(rows,existing){
  const buckets=new Map(),result=new Map();
  for(const q of existing){const text=normalizeQuestion(q.text);if(text)buckets.set(text,[...(buckets.get(text)||[]),{id:q.id,label:'登録済みの問題'}]);}
  for(const row of rows){const text=normalizeQuestion(row.fields.question);if(!text)continue;const matches=(buckets.get(text)||[]).filter(x=>x.id!==row.id);if(matches.length)result.set(row.id,matches.map(x=>x.label));buckets.set(text,[...(buckets.get(text)||[]),{id:row.id,label:'今回の問題 '+row.ordinal}]);}
  return result;
}
export function toQuestion(row,bookId){
  const f=row.fields,count=f.choice_e?.trim()?5:4;
  const choices=LETTERS.slice(0,count).map((l,position)=>({id:row.choiceIds[position],position,text:f['choice_'+l.toLowerCase()].trim()}));
  return {id:row.id,revision:0,question_book_id:bookId,question_number:null,text:f.question.trim(),choices,correct_choice_id:choices[LETTERS.indexOf(f.correct_choice.trim().toUpperCase())]?.id,category:f.category.trim(),genre:f.genre.trim(),explanation:f.explanation.trim(),mnemonic:f.memory_tip.trim(),memo:f.personal_note.trim(),rank:f.frequency.trim().toUpperCase(),difficulty:Number(f.difficulty),shuffle:/^(true|1)$/i.test(f.shuffle.trim()),tags:f.tags.split(/[,、]/).map(x=>x.trim()).filter(Boolean),format:'text',assets:[],answer_text:'',ocr_text:''};
}
