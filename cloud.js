const SUPABASE_URL='https://pefhlhfcadkiykymklhk.supabase.co';
const SUPABASE_KEY='sb_publishable_i4N6qCpLrCLhhvUBG6kNCA_uhs-aO_2';
const cloudClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
window.cloudSync={client:cloudClient,user:null,busy:false};

function cloudEls(){return {out:document.querySelector('#signedOut'),inn:document.querySelector('#signedIn'),badge:document.querySelector('#syncBadge'),text:document.querySelector('#syncText'),user:document.querySelector('#cloudUser'),msg:document.querySelector('#loginMsg')}}
function setCloudUI(user,msg){
 const e=cloudEls(); window.cloudSync.user=user||null;
 if(user){e.out.classList.add('hidden');e.inn.classList.remove('hidden');e.user.textContent=user.email||'Sesión iniciada';e.badge.textContent='Nube activa';e.badge.className='syncBadge synced';if(msg)e.text.textContent=msg}
 else{e.out.classList.remove('hidden');e.inn.classList.add('hidden');e.badge.textContent='Solo local';e.badge.className='syncBadge';if(msg)e.msg.textContent=msg}
}
function localState(){try{return JSON.parse(localStorage.getItem('maraAscenso360v2')||'{"fav":[],"status":{},"attempts":{}}')}catch{return {fav:[],status:{},attempts:{}}}}
function resultOf(v){return typeof v==='string'?v:(v&&v.result)||null}
function localRows(userId){
 const s=localState(); if(!s.attempts)s.attempts={}; if(!s.fav)s.fav=[]; if(!s.status)s.status={};
 const ids=new Set([...Object.keys(s.status),...Object.keys(s.attempts),...s.fav]);
 return [...ids].map(id=>{const st=s.status[id],result=resultOf(st),attempts=s.attempts[id]||[],selected=typeof st==='object'?st.selected:null;return {user_id:userId,question_id:id,result:result,selected_answer:Number.isInteger(selected)?selected:null,had_wrong:result==='wrong'||attempts.some(a=>a&&a.correct===false)||(typeof st==='object'&&!!st.hadWrong),attempts:attempts,favorite:s.fav.includes(id),updated_at:new Date().toISOString()}})
}
function mergeCloud(rows){
 const s=localState(); if(!s.fav)s.fav=[];if(!s.status)s.status={};if(!s.attempts)s.attempts={};
 for(const r of rows||[]){
   if(r.result)s.status[r.question_id]={result:r.result,selected:r.selected_answer,hadWrong:!!r.had_wrong};
   if(Array.isArray(r.attempts)&&r.attempts.length)s.attempts[r.question_id]=r.attempts;
   if(r.favorite&&!s.fav.includes(r.question_id))s.fav.push(r.question_id);
 }
 localStorage.setItem('maraAscenso360v2',JSON.stringify(s));
 if(window.reloadStudyState)window.reloadStudyState(false);
}
async function pullCloud(){const u=window.cloudSync.user;if(!u)return;const {data,error}=await cloudClient.from('user_progress').select('*').eq('user_id',u.id);if(error)throw error;mergeCloud(data);return data||[]}
async function pushCloud(){const u=window.cloudSync.user;if(!u)return;const rows=localRows(u.id);if(!rows.length)return;const {error}=await cloudClient.from('user_progress').upsert(rows,{onConflict:'user_id,question_id'});if(error)throw error}
async function syncAll(label='Sincronizado'){if(window.cloudSync.busy||!window.cloudSync.user)return;window.cloudSync.busy=true;const e=cloudEls();e.badge.textContent='Sincronizando…';try{await pushCloud();await pullCloud();if(window.syncExamHistory)await window.syncExamHistory();if(window.syncStageHistory){try{await window.syncStageHistory()}catch(_){}}e.badge.textContent='Nube activa';e.badge.className='syncBadge synced';e.text.textContent=label+' · '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch(err){e.badge.textContent='Pendiente';e.badge.className='syncBadge pending';e.text.textContent='Guardado local. La nube reintentará cuando haya conexión.';console.error(err)}finally{window.cloudSync.busy=false}}
window.syncProgress=()=>syncAll();

async function initCloud(){
 const {data:{session}}=await cloudClient.auth.getSession();setCloudUI(session?.user||null);
 if(session?.user)await syncAll('Progreso recuperado');
 cloudClient.auth.onAuthStateChange((_event,session)=>{setCloudUI(session?.user||null);if(session?.user)setTimeout(()=>syncAll('Progreso sincronizado'),0)});
 document.querySelector('#loginBtn').onclick=async()=>{const e=cloudEls();e.msg.textContent='Ingresando…';const email=document.querySelector('#loginEmail').value.trim(),password=document.querySelector('#loginPassword').value;const {data,error}=await cloudClient.auth.signInWithPassword({email,password});if(error){e.msg.textContent='No se pudo iniciar sesión. Revisa correo y contraseña.';return}setCloudUI(data.user,'Sesión iniciada');await syncAll('Progreso recuperado')};
 document.querySelector('#syncNow').onclick=()=>syncAll('Sincronizado');
 document.querySelector('#logoutBtn').onclick=async()=>{await cloudClient.auth.signOut();setCloudUI(null,'Sesión cerrada. El progreso local permanece en este dispositivo.')};
 window.addEventListener('online',()=>syncAll('Sincronizado al volver la conexión'));
}
document.addEventListener('DOMContentLoaded',initCloud);


/* V5.3 — historial de exámenes separado del progreso de práctica.
   Si la tabla exam_sessions aún no existe, la app sigue funcionando y conserva el historial local. */
function localExamRows(userId){
  let h=[];try{h=JSON.parse(localStorage.getItem('maraAscensoExamHistoryV1')||'[]')}catch{}
  return h.map(x=>({id:x.id,user_id:userId,label:x.label,correct:x.correct,incorrect:x.incorrect,total:x.total,percent:x.percent,elapsed:x.elapsed,finished_at:x.finishedAt,answers:x.answers||{}}));
}
async function pullExamHistory(){
  const u=window.cloudSync.user;if(!u)return;
  const {data,error}=await cloudClient.from('exam_sessions').select('*').eq('user_id',u.id).order('finished_at',{ascending:false});
  if(error)return; // tabla opcional: no interrumpe la sincronización de práctica
  let local=[];try{local=JSON.parse(localStorage.getItem('maraAscensoExamHistoryV1')||'[]')}catch{}
  const map=new Map(local.map(x=>[x.id,x]));
  for(const r of data||[])map.set(r.id,{id:r.id,label:r.label,correct:r.correct,incorrect:r.incorrect,total:r.total,percent:r.percent,elapsed:r.elapsed,finishedAt:r.finished_at,answers:r.answers||{}});
  localStorage.setItem('maraAscensoExamHistoryV1',JSON.stringify([...map.values()]));
  if(window.reloadExamHistory)window.reloadExamHistory();
}
async function pushExamHistory(){
  const u=window.cloudSync.user;if(!u)return;
  const rows=localExamRows(u.id);if(!rows.length)return;
  const {error}=await cloudClient.from('exam_sessions').upsert(rows,{onConflict:'id'});
  if(error)return;
}
window.syncExamHistory=async()=>{await pushExamHistory();await pullExamHistory()};


/* V5.3.1 — restablecimiento total y seguro del usuario actual.
   Borra primero Supabase y solo después limpia la copia local, evitando
   que una sincronización posterior restaure el progreso anterior. */
window.resetAllProgress = async function(){
  const u = window.cloudSync && window.cloudSync.user;

  if(u){
    const progressDelete = await cloudClient
      .from('user_progress')
      .delete()
      .eq('user_id', u.id);
    if(progressDelete.error) throw progressDelete.error;

    const examsDelete = await cloudClient
      .from('exam_sessions')
      .delete()
      .eq('user_id', u.id);
    if(examsDelete.error) throw examsDelete.error;
  }

  localStorage.setItem('maraAscenso360v2', JSON.stringify({
    fav: [],
    status: {},
    attempts: {}
  }));
  localStorage.removeItem('maraAscensoExamHistoryV1');

  if(window.reloadStudyState) window.reloadStudyState(false);
  if(window.reloadExamHistory) window.reloadExamHistory();

  // No se llama pushCloud/syncProgress aquí: primero dejamos ambas
  // fuentes vacías para impedir que reaparezcan datos antiguos.
  const syncText = document.querySelector('#syncText');
  if(syncText && u){
    syncText.textContent = 'Progreso restablecido · ' +
      new Date().toLocaleTimeString('es-PE', {
        hour:'2-digit', minute:'2-digit', second:'2-digit'
      });
  }
};


/* V5.3.1 ETAPAS
   El restablecimiento ya no destruye el historial: archiva una instantánea
   y después limpia solamente la etapa activa. */
function localStageRows(userId){
  let h=[];try{h=JSON.parse(localStorage.getItem('maraAscensoStageHistoryV1')||'[]')}catch{}
  return h.map(x=>({
    id:x.id,user_id:userId,stage_number:x.number,saved_at:x.savedAt,
    attempted:x.attempted,resolved:x.resolved,first_try:x.firstTry,
    retried:x.retried,first_try_percent:x.firstTryPercent,
    favorites:x.favorites,exam_count:x.examCount,best_exam:x.bestExam,
    practice_state:x.practiceState||{},exams:x.exams||[]
  }));
}
async function pushStageHistory(){
  const u=window.cloudSync&&window.cloudSync.user;if(!u)return;
  const rows=localStageRows(u.id);if(!rows.length)return;
  const {error}=await cloudClient.from('study_stages').upsert(rows,{onConflict:'id'});
  if(error)throw error;
}
async function pullStageHistory(){
  const u=window.cloudSync&&window.cloudSync.user;if(!u)return;
  const {data,error}=await cloudClient.from('study_stages').select('*').eq('user_id',u.id).order('stage_number',{ascending:true});
  if(error)return;
  let local=[];try{local=JSON.parse(localStorage.getItem('maraAscensoStageHistoryV1')||'[]')}catch{}
  const map=new Map(local.map(x=>[x.id,x]));
  for(const r of data||[])map.set(r.id,{
    id:r.id,number:r.stage_number,savedAt:r.saved_at,attempted:r.attempted,
    resolved:r.resolved,firstTry:r.first_try,retried:r.retried,
    firstTryPercent:r.first_try_percent,favorites:r.favorites,
    examCount:r.exam_count,bestExam:r.best_exam,
    practiceState:r.practice_state||{},exams:r.exams||[]
  });
  localStorage.setItem('maraAscensoStageHistoryV1',JSON.stringify([...map.values()]));
  if(window.reloadStageHistory)window.reloadStageHistory();
}
window.syncStageHistory=async()=>{await pushStageHistory();await pullStageHistory()};

window.archiveAndResetCurrentStage=async function(snapshot){
  const u=window.cloudSync&&window.cloudSync.user;
  if(u){
    // Archive must succeed BEFORE deleting active progress.
    const row={
      id:snapshot.id,user_id:u.id,stage_number:snapshot.number,saved_at:snapshot.savedAt,
      attempted:snapshot.attempted,resolved:snapshot.resolved,first_try:snapshot.firstTry,
      retried:snapshot.retried,first_try_percent:snapshot.firstTryPercent,
      favorites:snapshot.favorites,exam_count:snapshot.examCount,best_exam:snapshot.bestExam,
      practice_state:snapshot.practiceState||{},exams:snapshot.exams||[]
    };
    const archived=await cloudClient.from('study_stages').upsert(row,{onConflict:'id'});
    if(archived.error)throw archived.error;

    const p=await cloudClient.from('user_progress').delete().eq('user_id',u.id);
    if(p.error)throw p.error;
    const e=await cloudClient.from('exam_sessions').delete().eq('user_id',u.id);
    if(e.error)throw e.error;
  }
  localStorage.setItem('maraAscenso360v2',JSON.stringify({fav:[],status:{},attempts:{}}));
  localStorage.removeItem('maraAscensoExamHistoryV1');
};
window.reloadStageHistory=()=>{if(typeof renderStageHistory==='function')renderStageHistory()};
