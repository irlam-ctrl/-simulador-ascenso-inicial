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
 if(window.reloadStudyState)window.reloadStudyState();
}
async function pullCloud(){const u=window.cloudSync.user;if(!u)return;const {data,error}=await cloudClient.from('user_progress').select('*').eq('user_id',u.id);if(error)throw error;mergeCloud(data);return data||[]}
async function pushCloud(){const u=window.cloudSync.user;if(!u)return;const rows=localRows(u.id);if(!rows.length)return;const {error}=await cloudClient.from('user_progress').upsert(rows,{onConflict:'user_id,question_id'});if(error)throw error}
async function syncAll(label='Sincronizado'){if(window.cloudSync.busy||!window.cloudSync.user)return;window.cloudSync.busy=true;const e=cloudEls();e.badge.textContent='Sincronizando…';try{await pushCloud();await pullCloud();e.badge.textContent='Nube activa';e.badge.className='syncBadge synced';e.text.textContent=label+' · '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}catch(err){e.badge.textContent='Pendiente';e.badge.className='syncBadge pending';e.text.textContent='Guardado local. La nube reintentará cuando haya conexión.';console.error(err)}finally{window.cloudSync.busy=false}}
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
