const $=s=>document.querySelector(s),K='maraAscenso360v2',EK='maraAscensoExamHistoryV1';
let pool=[],i=0,chosen=null,mode='practice',seconds=0,tick=null,examAnswers={},examStartedAt=null;
let S=JSON.parse(localStorage.getItem(K)||'{"fav":[],"status":{},"attempts":{}}');
if(!S.attempts)S.attempts={};

function examHistory(){try{return JSON.parse(localStorage.getItem(EK)||'[]')}catch{return []}}
function saveExamHistory(h){localStorage.setItem(EK,JSON.stringify(h));if(window.syncExamHistory)setTimeout(()=>window.syncExamHistory(),0)}
function save(){localStorage.setItem(K,JSON.stringify(S));if(window.syncProgress)setTimeout(()=>window.syncProgress(),0)}
window.reloadStudyState=(renderQuiz=true)=>{S=JSON.parse(localStorage.getItem(K)||'{"fav":[],"status":{},"attempts":{}}');if(!S.attempts)S.attempts={};counts();if(renderQuiz&&mode==='practice'&&!$('#quiz').classList.contains('hidden'))render()}
window.reloadExamHistory=()=>renderExamHistory();

function rec(id){const v=S.status[id];if(typeof v==='string')return {result:v,legacy:true};return v||null}
function statusOf(id){const r=rec(id);return r?r.result:null}
function attemptsOf(id){return S.attempts[id]||[]}
function hadWrong(id){return statusOf(id)==='wrong'||attemptsOf(id).some(a=>a.correct===false)}

function filtered(){
  let q=QUESTIONS.slice(),t=$('#tema').value,c=$('#ciclo').value,y=$('#year').value,s=$('#state').value;
  if(t!=='Todos')q=q.filter(x=>x.topic===t);
  if(c!=='Todos')q=q.filter(x=>x.cycle===c);
  if(y!=='Todas')q=q.filter(x=>x.year===y);
  if(s==='Pendientes')q=q.filter(x=>!statusOf(x.id));
  if(s==='Falladas')q=q.filter(x=>hadWrong(x.id));
  if(s==='Acertadas')q=q.filter(x=>statusOf(x.id)==='correct'&&!hadWrong(x.id));
  if(s==='Favoritas')q=q.filter(x=>S.fav.includes(x.id));
  return q;
}
function counts(){
  const resolved=Object.keys(S.status).filter(id=>statusOf(id)==='correct').length;
  const firstTry=Object.keys(S.status).filter(id=>statusOf(id)==='correct'&&!hadWrong(id)).length;
  const retried=Object.keys(S.status).filter(id=>statusOf(id)==='correct'&&hadWrong(id)).length;
  $('#answered').textContent=resolved;
  $('#accuracy').textContent=resolved?Math.round(firstTry/resolved*100)+'%':'0%';
  $('#retried').textContent=retried;
  $('#favorites').textContent=S.fav.length;
  $('#count').textContent=filtered().length;
  renderExamHistory();
}
function renderExamHistory(){
  const h=examHistory().slice().sort((a,b)=>new Date(b.finishedAt)-new Date(a.finishedAt));
  const box=$('#examHistory'),sum=$('#examSummary'); if(!box||!sum)return;
  if(!h.length){sum.textContent='Aún no hay exámenes terminados.';box.innerHTML='';return}
  const best=Math.max(...h.map(x=>x.percent||0)),last=h[0];
  sum.innerHTML=`${h.length} ${h.length===1?'examen':'exámenes'} · Último: <strong>${last.correct}/${last.total} (${last.percent}%)</strong> · Mejor: <strong>${best}%</strong>`;
  box.innerHTML=h.slice(0,5).map(x=>`<div class="examRow"><div><strong>${x.label}</strong><span>${new Date(x.finishedAt).toLocaleDateString('es-PE')}</span></div><div><strong>${x.correct}/${x.total}</strong><span>${x.percent}% · ${formatDuration(x.elapsed)}</span></div></div>`).join('');
}
function formatDuration(s){s=Math.max(0,Math.round(s||0));const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h?`${h} h ${m} min`:`${m} min`}
function timer(){
  seconds--;let h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;
  $('#timer').textContent=mode==='exam'?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:'';
  if(seconds<=0){clearInterval(tick);finishExam(true)}
}
function selectedYear(){const y=$('#year').value;return y==='Todas'?null:y}
function yearQuestions(y){return QUESTIONS.filter(x=>x.year===y).sort((a,b)=>a.number-b.number)}
function displayState(id){const s=statusOf(id);if(s==='correct'&&hadWrong(id))return 'reinforced';return s}

function updateNavigator(){
  const nav=$('#practiceNav'),panel=$('#navigator');
  if(mode!=='practice'){nav.classList.add('hidden');panel.classList.add('hidden');return}
  const x=pool[i],y=selectedYear();if(!x||!y){nav.classList.add('hidden');panel.classList.add('hidden');return}
  nav.classList.remove('hidden');const all=yearQuestions(y);
  $('#currentOfficial').textContent=x.number;$('#totalOfficial').textContent=all.length;
  $('#prevQ').disabled=x.number<=1;$('#nextQ').disabled=x.number>=all.length;
  $('#questionGrid').innerHTML=all.map(q=>{
    const s=displayState(q.id),fav=S.fav.includes(q.id),cur=q.id===x.id;
    const cls=[s==='correct'?'q-correct':(s==='wrong'||s==='reinforced')?'q-wrong':'',cur?'q-current':'',fav?'q-fav':''].filter(Boolean).join(' ');
    const mark=s==='correct'?'✓':(s==='wrong'||s==='reinforced')?'✕':'';
    return `<button type="button" class="${cls}" data-id="${q.id}"><span class="gridMark">${mark}</span><span class="gridNum">${q.number}</span></button>`;
  }).join('');
  $('#questionGrid').querySelectorAll('button').forEach(b=>b.onclick=()=>jumpToId(b.dataset.id));
}
function jumpToId(id){let idx=pool.findIndex(q=>q.id===id);if(idx<0){const q=QUESTIONS.find(q=>q.id===id);if(!q)return;pool=yearQuestions(q.year);idx=pool.findIndex(z=>z.id===id)}i=idx;$('#navigator').classList.add('hidden');render()}
function jumpOfficial(d){const x=pool[i],y=selectedYear();if(!x||!y)return;const q=QUESTIONS.find(z=>z.year===y&&z.number===x.number+d);if(q)jumpToId(q.id)}

function setBanner(x){
  const b=$('#answerStatus');
  if(mode==='exam'){b.textContent='';b.className='answerStatus hidden';return}
  const s=statusOf(x.id);
  if(s==='correct'&&hadWrong(x.id)){const n=attemptsOf(x.id).length;b.innerHTML=`<span class="statusSymbol">✓</span><strong>CORRECTA · RESUELTA TRAS ${n} ${n===1?'INTENTO':'INTENTOS'}</strong>`;b.className='answerStatus status-correct'}
  else if(s==='correct'){b.innerHTML='<span class="statusSymbol">✓</span><strong>YA RESPONDIDA · CORRECTA</strong>';b.className='answerStatus status-correct'}
  else if(s==='wrong'){b.innerHTML='<span class="statusSymbol">✕</span><strong>INCORRECTA · INTÉNTALO NUEVAMENTE</strong>';b.className='answerStatus status-wrong'}
  else{b.textContent='';b.className='answerStatus hidden'}
}
function render(){
  const x=pool[i];if(!x)return;
  chosen=mode==='exam' && Number.isInteger(examAnswers[x.id])?examAnswers[x.id]:null;
  $('#progress').textContent=`${i+1} de ${pool.length}`;
  $('#meta').textContent=`Prueba ${x.year} · Pregunta ${x.number} · ${x.topic} · ${x.cycle}`;
  $('#question').textContent=x.q;
  if(mode==='practice'){
    const triedWrong=new Set(attemptsOf(x.id).filter(a=>!a.correct).map(a=>a.selected));
    $('#options').innerHTML=x.o.map((v,n)=>`<button class="option ${triedWrong.has(n)?'wrong tried':''}" data-n="${n}"><b>${'ABC'[n]}.</b> ${v}</button>`).join('');
    $('#check').textContent='Comprobar respuesta';$('#check').classList.remove('hidden');$('#check').disabled=true;
    $('#finishExam').classList.add('hidden');$('#next').classList.add('hidden');$('#feedback').classList.add('hidden');
  }else{
    $('#options').innerHTML=x.o.map((v,n)=>`<button class="option ${chosen===n?'selected':''}" data-n="${n}"><b>${'ABC'[n]}.</b> ${v}</button>`).join('');
    $('#check').textContent=i+1===pool.length?'Guardar respuesta':'Guardar y siguiente';
    $('#check').classList.remove('hidden');$('#check').disabled=chosen===null;
    $('#finishExam').classList.remove('hidden');$('#next').classList.add('hidden');$('#feedback').classList.add('hidden');
  }
  $('#fav').classList.toggle('hidden',mode==='exam');
  if(mode==='practice')$('#fav').textContent=S.fav.includes(x.id)?'★':'☆';
  setBanner(x);
  document.querySelectorAll('.option').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('.option').forEach(z=>z.classList.remove('selected'));
    b.classList.add('selected');chosen=+b.dataset.n;$('#check').disabled=false;
  });
  updateNavigator();
}
function start(exam){
  if(exam){
    mode='exam';const y=selectedYear();
    pool=(y?yearQuestions(y):QUESTIONS.slice().sort(()=>Math.random()-.5).slice(0,60));
    if(pool.length>60)pool=pool.slice(0,60);
    if(!pool.length){alert('No hay preguntas disponibles para el examen.');return}
    i=0;examAnswers={};examStartedAt=Date.now();seconds=10800;clearInterval(tick);timer();tick=setInterval(timer,1000);
  }else{
    mode='practice';pool=filtered();
    if(!pool.length){alert($('#state').value==='Pendientes'?'No quedan preguntas pendientes con estos filtros.':`No hay preguntas en el estado “${$('#state').value}” con estos filtros.`);return}
    if($('#state').value==='Todas'){const p=pool.findIndex(x=>!statusOf(x.id));i=p>=0?p:0}else i=0;
  }
  $('#config').classList.add('hidden');$('#quiz').classList.remove('hidden');$('#examResult').classList.add('hidden');render();
}
function finishExam(auto=false){
  if(mode!=='exam')return;
  const answered=Object.keys(examAnswers).length;
  if(!auto && answered<pool.length && !confirm(`Has respondido ${answered} de ${pool.length}. ¿Entregar el examen ahora?`))return;
  clearInterval(tick);
  const correct=pool.filter(q=>examAnswers[q.id]===q.a).length,total=pool.length,incorrect=total-correct;
  const elapsed=Math.min(10800,Math.max(0,Math.round((Date.now()-examStartedAt)/1000)));
  const y=selectedYear(),label=y?`Prueba ${y}`:'Examen aleatorio';
  const record={id:`exam-${Date.now()}`,label,correct,incorrect,total,percent:Math.round(correct/total*100),elapsed,finishedAt:new Date().toISOString(),answers:examAnswers};
  const h=examHistory();h.push(record);saveExamHistory(h);
  // Los errores del examen se guardan aparte: no modifican estadísticas de práctica.
  $('#quiz').classList.add('hidden');$('#examResult').classList.remove('hidden');
  $('#examResultStats').innerHTML=`<div><strong>${correct}</strong><span>Correctas</span></div><div><strong>${incorrect}</strong><span>Incorrectas</span></div><div><strong>${record.percent}%</strong><span>Aciertos</span></div><div><strong>${formatDuration(elapsed)}</strong><span>Tiempo</span></div>`;
  $('#examResultText').textContent=auto?'El tiempo terminó. Este resultado quedó guardado en el historial de exámenes.':'Este resultado quedó guardado en el historial de exámenes y no modifica tus estadísticas de práctica.';
  renderExamHistory();
}

document.querySelectorAll('select').forEach(x=>x.onchange=counts);
$('#practice').onclick=()=>start(false);$('#exam').onclick=()=>start(true);
$('#back').onclick=()=>{if(mode==='exam'&&Object.keys(examAnswers).length&& !confirm('¿Salir del examen? Este intento no se guardará.'))return;clearInterval(tick);$('#navigator').classList.add('hidden');$('#quiz').classList.add('hidden');$('#config').classList.remove('hidden');mode='practice';counts()};
$('#check').onclick=()=>{
  const x=pool[i];
  if(mode==='exam'){
    examAnswers[x.id]=chosen;
    if(i+1<pool.length){i++;render()}else{render();alert('Llegaste a la última pregunta. Puedes revisar tus respuestas o tocar “Entregar examen”.')}
    return;
  }
  const good=chosen===x.a;
  if(!S.attempts[x.id])S.attempts[x.id]=[];
  S.attempts[x.id].push({selected:chosen,correct:good});
  if(good){
    S.status[x.id]={result:'correct',selected:chosen,hadWrong:S.attempts[x.id].some(a=>!a.correct)};save();
    document.querySelectorAll('.option').forEach((b,n)=>{b.disabled=true;if(n===x.a)b.classList.add('correct')});
    $('#feedback').innerHTML=`<b>Correcto ✓</b><br>${x.why}`;$('#feedback').classList.remove('hidden');$('#next').classList.remove('hidden');$('#check').classList.add('hidden');
  }else{
    S.status[x.id]={result:'wrong',selected:chosen};save();
    const b=document.querySelector(`.option[data-n="${chosen}"]`);if(b)b.classList.add('wrong','tried');
    document.querySelectorAll('.option').forEach(z=>z.classList.remove('selected'));chosen=null;$('#check').disabled=true;
    $('#feedback').innerHTML='<b>Incorrecta ✕</b><br>Vuelve a leer la pregunta y prueba otra alternativa. La clave y la explicación se mostrarán cuando encuentres la respuesta correcta.';$('#feedback').classList.remove('hidden');
  }
  counts();setBanner(x);updateNavigator();
};
$('#next').onclick=()=>{if(i+1>=pool.length){alert('Terminaste esta práctica.');$('#back').click();return}i++;render()};
$('#finishExam').onclick=()=>finishExam(false);
$('#closeExamResult').onclick=()=>{$('#examResult').classList.add('hidden');$('#config').classList.remove('hidden');mode='practice';counts()};
$('#fav').onclick=()=>{let id=pool[i].id,n=S.fav.indexOf(id);n>=0?S.fav.splice(n,1):S.fav.push(id);save();$('#fav').textContent=S.fav.includes(id)?'★':'☆';counts();updateNavigator()};
$('#openNavigator').onclick=()=>$('#navigator').classList.toggle('hidden');$('#prevQ').onclick=()=>jumpOfficial(-1);$('#nextQ').onclick=()=>jumpOfficial(1);
$('#reset').onclick=()=>{if(confirm('¿Restablecer todo el progreso? Se borrarán práctica, intentos, favoritas y el historial local de exámenes.')){S={fav:[],status:{},attempts:{}};localStorage.removeItem(EK);save();counts();alert('Progreso restablecido.')}};
counts();
