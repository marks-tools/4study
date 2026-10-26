// OCRの結果は下書きとしてのみ使う。正答は明記された場合だけ抽出する。
export function splitScanText(input) {
  const raw=String(input||'').normalize('NFKC').replace(/\r/g,'');
  const result={text:'',choices:[],answer_text:'',explanation:'',correctNumber:null,raw};
  let section='text',choice=-1;
  for(const line of raw.split('\n')) {
    const heading=line.match(/^\s*(問題(?:文)?|解答|回答|正解|解説)\s*[:：]?\s*(.*)$/);
    if(heading){section=/問題/.test(heading[1])?'text':heading[1]==='解説'?'explanation':'answer_text';choice=-1;if(heading[2])result[section]+=heading[2]+'\n';continue;}
    const option=section==='text'&&line.match(/^\s*(?:\(([1-5])\)|([1-5])[.、．])\s*(.*)$/);
    if(option){choice=Number(option[1]||option[2])-1;result.choices[choice]=option[3];continue;}
    if(section==='text'&&choice>=0)result.choices[choice]+='\n'+line;else result[section]+=line+'\n';
  }
  for(const key of ['text','answer_text','explanation'])result[key]=result[key].trim();
  result.choices=Array.from(result.choices,v=>(v||'').trim());
  const correct=result.answer_text.match(/^\s*(?:[（(]?([1-5])[）)]?)(?:\s|$|[。:：])/);
  if(correct)result.correctNumber=Number(correct[1]);
  return result;
}
export function resizeChoices(q,count,makeId){
  if(![4,5].includes(count))throw Error('選択肢数は4または5です');
  const choices=Array.from({length:count},(_,i)=>q.choices[i]||{id:makeId(),text:'',position:i});
  return {...q,choices,correct_choice_id:choices.some(c=>c.id===q.correct_choice_id)?q.correct_choice_id:null};
}
