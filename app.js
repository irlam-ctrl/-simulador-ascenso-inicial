const $=s=>document.querySelector(s),K='maraAscenso360v2';
let pool=[],i=0,chosen=null,mode='practice',seconds=0,tick=null;
let S=JSON.parse(localStorage.getItem(K)||'{"fav":[],"status":{}}');
if(!S.attempts)S.attempts={};

function save(){localStorage.setItem(K,JSON.stringify(S))}
function rec(id){
  const v=S.status[id];
  if(typeof v==='string') return {result:v,legacy:true};
  return v||null;
}
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
  const answered=Object.keys(S.status).filter(id=>statusOf(id)).length;
  const firstTryCorrect=Object.keys(S.status).filter(id=>statusOf(id)==='correct'&&!hadWrong(id)).length;
  $('#answered').textContent=answered;
  $('#accuracy').textContent=answered?Math.round(firstTryCorrect/answered*100)+'%':'0%';
  $('#favorites').textContent=S.fav.length;$('#count').textContent=filtered().length;
}
function timer(){seconds--;let h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;$('#timer').textContent=mode==='exam'?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:'';if(seconds<=0){clearInterval(tick);alert('Terminó el tiempo del examen.')}}
function selectedYear(){const y=$('#year').value;return y==='Todas'?null:y}
function yearQuestions(y){return QUESTIONS.filter(x=>x.year===y).sort((a,b)=>a.number-b.number)}

function displayState(id){
  const s=statusOf(id);
  if(s==='correct'&&hadWrong(id))return 'reinforced';
  return s;
}
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
    return `<button type="button" class="${cls}" data-id="${q.id}" aria-label="Pregunta ${q.number}, ${s==='correct'?'acertada':s==='reinforced'?'fallada y luego resuelta':s==='wrong'?'fallada':'pendiente'}"><span class="gridMark">${mark}</span><span class="gridNum">${q.number}</span></button>`;
  }).join('');
  $('#questionGrid').querySelectorAll('button').forEach(b=>b.onclick=()=>jumpToId(b.dataset.id));
}
function jumpToId(id){let idx=pool.findIndex(q=>q.id===id);if(idx<0){const q=QUESTIONS.find(q=>q.id===id);if(!q)return;pool=yearQuestions(q.year);idx=pool.findIndex(z=>z.id===id)}i=idx;$('#navigator').classList.add('hidden');render()}
function jumpOfficial(d){const x=pool[i],y=selectedYear();if(!x||!y)return;const q=QUESTIONS.find(z=>z.year===y&&z.number===x.number+d);if(q)jumpToId(q.id)}

function setBanner(x){
  const b=$('#answerStatus'),s=statusOf(x.id);
  if(s==='correct'&&hadWrong(x.id)){
    b.innerHTML='<span class="statusSymbol">✕✓</span><strong>FALLADA · RESUELTA POSTERIORMENTE</strong>';
    b.className='answerStatus status-wrong';
  }else if(s==='correct'){
    b.innerHTML='<span class="statusSymbol">✓</span><strong>YA RESPONDIDA · CORRECTA</strong>';
    b.className='answerStatus status-correct';
  }else if(s==='wrong'){
    b.innerHTML='<span class="statusSymbol">✕</span><strong>INCORRECTA · INTÉNTALO NUEVAMENTE</strong>';
    b.className='answerStatus status-wrong';
  }else{
    b.textContent='';b.className='answerStatus hidden';
  }
}
function render(){
  const x=pool[i];if(!x)return;chosen=null;
  $('#progress').textContent=`${i+1} de ${pool.length}`;$('#meta').textContent=`Prueba ${x.year} · Pregunta ${x.number} · ${x.topic} · ${x.cycle}`;
  $('#question').textContent=x.q;
  const triedWrong=new Set(attemptsOf(x.id).filter(a=>!a.correct).map(a=>a.selected));
  $('#options').innerHTML=x.o.map((v,n)=>`<button class="option ${triedWrong.has(n)?'wrong tried':''}" data-n="${n}" ${triedWrong.has(n)?'disabled':''}><b>${'ABC'[n]}.</b> ${v}</button>`).join('');
  $('#check').disabled=true;$('#check').classList.remove('hidden');$('#feedback').classList.add('hidden');$('#next').classList.add('hidden');
  $('#fav').textContent=S.fav.includes(x.id)?'★':'☆';setBanner(x);
  document.querySelectorAll('.option:not(:disabled)').forEach(b=>b.onclick=()=>{document.querySelectorAll('.option').forEach(z=>z.classList.remove('selected'));b.classList.add('selected');chosen=+b.dataset.n;$('#check').disabled=false});
  updateNavigator();
}
function start(exam){
  pool=filtered();if(!pool.length){alert($('#state').value==='Pendientes'?'No quedan preguntas pendientes con estos filtros.':`No hay preguntas en el estado “${$('#state').value}” con estos filtros.`);return}
  if(exam){mode='exam';pool=pool.sort(()=>Math.random()-.5).slice(0,60);i=0;seconds=10800;clearInterval(tick);timer();tick=setInterval(timer,1000)}
  else{mode='practice';if($('#state').value==='Todas'){const p=pool.findIndex(x=>!statusOf(x.id));i=p>=0?p:0}else i=0}
  $('#config').classList.add('hidden');$('#quiz').classList.remove('hidden');render();
}
document.querySelectorAll('select').forEach(x=>x.onchange=counts);
$('#practice').onclick=()=>start(false);$('#exam').onclick=()=>start(true);
$('#back').onclick=()=>{clearInterval(tick);$('#navigator').classList.add('hidden');$('#quiz').classList.add('hidden');$('#config').classList.remove('hidden');counts()};
$('#check').onclick=()=>{
  const x=pool[i],good=chosen===x.a;
  if(!S.attempts[x.id])S.attempts[x.id]=[];
  S.attempts[x.id].push({selected:chosen,correct:good});
  if(good){
    S.status[x.id]={result:'correct',selected:chosen,hadWrong:S.attempts[x.id].some(a=>!a.correct)};
    save();
    document.querySelectorAll('.option').forEach((b,n)=>{b.disabled=true;if(n===x.a)b.classList.add('correct')});
    $('#feedback').innerHTML=`<b>Correcto ✓</b><br>${x.why}`;
    $('#feedback').classList.remove('hidden');$('#next').classList.remove('hidden');$('#check').classList.add('hidden');
  }else{
    S.status[x.id]={result:'wrong',selected:chosen};
    save();
    const b=document.querySelector(`.option[data-n="${chosen}"]`);if(b){b.classList.add('wrong','tried');b.disabled=true}
    document.querySelectorAll('.option').forEach(z=>z.classList.remove('selected'));
    chosen=null;$('#check').disabled=true;
    $('#feedback').innerHTML='<b>Incorrecta ✕</b><br>Vuelve a leer la pregunta y prueba otra alternativa. La clave y la explicación se mostrarán cuando encuentres la respuesta correcta.';
    $('#feedback').classList.remove('hidden');
  }
  counts();setBanner(x);updateNavigator();
};
$('#next').onclick=()=>{if(i+1>=pool.length){alert('Terminaste esta práctica.');$('#back').click();return}i++;render()};
$('#fav').onclick=()=>{let id=pool[i].id,n=S.fav.indexOf(id);n>=0?S.fav.splice(n,1):S.fav.push(id);save();$('#fav').textContent=S.fav.includes(id)?'★':'☆';counts();updateNavigator()};
$('#openNavigator').onclick=()=>$('#navigator').classList.toggle('hidden');$('#prevQ').onclick=()=>jumpOfficial(-1);$('#nextQ').onclick=()=>jumpOfficial(1);
$('#reset').onclick=()=>{if(confirm('¿Restablecer todo el progreso? Se borrarán respondidas, intentos, acertadas, falladas y favoritas.')){S={fav:[],status:{},attempts:{}};save();counts();alert('Progreso restablecido.')}};
counts();
