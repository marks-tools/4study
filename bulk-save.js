import {resolveBook,validateRow,toQuestion} from './bulk-model.js';
// One atomic existing RPC per question. IDs are persisted before any remote write.
// Reconciliation handles a committed write whose HTTP response was lost.
export async function saveImport(job,{repo,checkOwner,persist,makeId,onProgress=()=>{}}){
  await checkOwner();
  const data=await repo.load();await checkOwner();
  const books=data.books,known=new Set(data.questions.map(q=>q.id));
  job.newBooks=job.newBooks||{};
  for(const row of job.rows){
    if(row.status==='saved'||!row.selected)continue;
    await checkOwner();
    if(known.has(row.id)){row.status='saved';row.failure='';await persist(job);onProgress();continue;}
    const validation=validateRow(row,books);
    if(validation.errors.length){row.status='failed';row.failure=validation.errors.join(' ');await persist(job);onProgress();continue;}
    row.status='saving';row.failure='';row.attempted=true;await persist(job);onProgress();
    try{
      let {book,newName}=resolveBook(row,books);
      if(!book){
        const key='book:'+newName;
        book=job.newBooks[key]||{id:makeId(),name:newName,choice_count:validation.count};
        job.newBooks[key]=book;await persist(job);await checkOwner();
        try{book=await repo.book(book,job.owner);}catch(error){
          await checkOwner();const fresh=await repo.load();const recovered=fresh.books.find(b=>b.id===book.id)||fresh.books.find(b=>b.name===newName&&b.year==null&&!b.exam_round);
          if(!recovered)throw error;book=recovered;
        }
        books.push(book);
      }
      await checkOwner();await repo.save(toQuestion(row,book.id));row.status='saved';known.add(row.id);
    }catch(error){
      await checkOwner();
      row.status='failed';row.failure=error.message||'保存できませんでした。';
      try{if(await repo.hasQuestion(row.id)){row.status='saved';known.add(row.id);}else row.attempted=false;}
      catch{row.failure+=' 保存結果が未確認です。同じ取り込みから再試行してください。';}
    }
    await persist(job);onProgress();
  }
  job.phase='done';await persist(job);return job;
}
