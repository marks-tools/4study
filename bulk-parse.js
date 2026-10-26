// Public interchange names are shared by CSV, text import and future export.
export const COLUMNS=['question_book','category','genre','question','choice_a','choice_b','choice_c','choice_d','choice_e','correct_choice','explanation','memory_tip','personal_note','frequency','difficulty','tags','shuffle'];
export const MARKERS={QUESTION:'question',A:'choice_a',B:'choice_b',C:'choice_c',D:'choice_d',E:'choice_e',ANSWER:'correct_choice',EXPLANATION:'explanation',MEMORY:'memory_tip',NOTE:'personal_note',BOOK:'question_book',CATEGORY:'category',GENRE:'genre',FREQUENCY:'frequency',DIFFICULTY:'difficulty',TAGS:'tags',SHUFFLE:'shuffle'};
export function parseCSV(input){
  const text=String(input).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
  const records=[];let row=[],cell='',quoted=false,closed=false;
  const pushRow=()=>{row.push(cell);if(row.some(x=>x.trim()))records.push(row);row=[];cell='';closed=false;};
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
    if(c===','){row.push(cell);cell='';closed=false;}
    else if(c==='\n')pushRow();
    else if(c==='"'){if(cell||closed)throw Error('CSVの引用符が不正です。文章内の引用符は二重にしてください。');quoted=true;}
    else {if(closed)throw Error('CSVの閉じ引用符の後にはカンマまたは改行が必要です。');cell+=c;}
  }
  if(quoted)throw Error('CSVの引用符が閉じられていません。');
  if(cell||row.length||closed)pushRow();
  if(records.length<2)throw Error('列名の行と、1問以上のデータが必要です。');
  const headers=records.shift().map(x=>x.trim().toLowerCase());
  if(headers.some(x=>!x)||new Set(headers).size!==headers.length)throw Error('CSVの列名が空、または重複しています。');
  const required=['question','choice_a','choice_b','choice_c','choice_d','correct_choice'];
  const missing=required.filter(x=>!headers.includes(x));if(missing.length)throw Error('CSVに必要な列がありません：'+missing.join(', '));
  const unknown=headers.filter(x=>!COLUMNS.includes(x));
  return records.map((values,i)=>({fields:Object.fromEntries(headers.filter(h=>COLUMNS.includes(h)).map(h=>[h,values[headers.indexOf(h)]||''])),parseErrors:values.length===headers.length?[]:[`データ${i+1}行目の列数が見出しと異なります。引用符や各欄を確認してください。`],parseWarnings:unknown.length?['未対応の列は取り込みません：'+unknown.join(', ')]:[]}));
}
export function parseStructured(input){
  const rows=[];let fields={},key=null,errors=[];
  const push=()=>{if(Object.keys(fields).length||errors.length)rows.push({fields,parseErrors:errors,parseWarnings:[]});fields={};key=null;errors=[];};
  for(const line of String(input).replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n')){
    if(/^\s*---\s*$/.test(line)){push();continue;}
    const m=line.match(/^\s*\[([A-Z_]+)\]\s*$/i);
    if(m){const tag=m[1].toUpperCase();if(tag==='QUESTION'&&Object.hasOwn(fields,'question'))push();key=MARKERS[tag];if(!key){errors.push('未対応の見出し：['+tag+']');key=null;}else if(Object.hasOwn(fields,key)){errors.push('見出しが重複しています：['+tag+']');}else fields[key]='';continue;}
    if(key)fields[key]+=(fields[key]?'\n':'')+line;else if(line.trim())errors.push('見出しのない文章があります：'+line.slice(0,40));
  }
  push();if(!rows.length)throw Error('[QUESTION]から始まる問題を貼り付けてください。');return rows;
}
export function materialize(parsed,common={}){
  return parsed.map((r,i)=>{const fields=Object.fromEntries(COLUMNS.map(k=>[k,String(r.fields[k]??'').trim()]));
    for(const key of ['question_book','category','genre','frequency','difficulty','shuffle'])if(!fields[key])fields[key]=String(common[key]??'').trim();
    fields.frequency=fields.frequency||'B';fields.difficulty=fields.difficulty||'1';fields.shuffle=fields.shuffle||'true';
    return {ordinal:i+1,fields,bookId:(!r.fields.question_book?.trim()||r.fields.question_book.trim()===common.question_book)?common.bookId||'':'',parseErrors:r.parseErrors||[],parseWarnings:r.parseWarnings||[],selected:true,status:'pending'};
  });
}
