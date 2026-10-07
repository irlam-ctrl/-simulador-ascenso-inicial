const $=s=>document.querySelector(s),K='maraAscenso360v2';
let pool=[],i=0,chosen=null,mode='practice',seconds=0,tick=null;
let S=JSON.parse(localStorage.getItem(K)||'{"fav":[],"status":{}}');

function save(){localStorage.setItem(K,JSON.stringify(S))}
function statusOf(id){
  const v=S.status[id];
  if(typeof v==='string') return v; // legacy V3/V4/V4.1
  return v&&v.result?v.result:null;  // future richer record
}
function filtered(){
  let q=QUESTIONS.slice(),t=$('#tema').value,c=$('#ciclo').value,y=$('#year').value,s=$('#state').value;
  if(t!=='Todos')q=q.filter(x=>x.topic===t);
  if(c!=='Todos')q=q.filter(x=>x.cycle===c);
  if(y!=='Todas')q=q.filter(x=>x.year===y);
  if(s==='Pendientes')q=q.filter(x=>!statusOf(x.id));
  if(s==='Falladas')q=q.filter(x=>statusOf(x.id)==='wrong');
  if(s==='Acertadas')q=q.filter(x=>statusOf(x.id)==='correct');
  if(s==='Favoritas')q=q.filter(x=>S.fav.includes(x.id));
  return q;
}
function counts(){
  const vals=Object.keys(S.status).map(id=>statusOf(id)).filter(Boolean);
  const a=vals.length,ok=vals.filter(x=>x==='correct').length;
  $('#answered').textContent=a;
  $('#accuracy').textContent=a?Math.round(ok/a*100)+'%':'0%';
  $('#favorites').textContent=S.fav.length;
  $('#count').textContent=filtered().length;
}
function timer(){
  seconds--;
  let h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;
  $('#timer').textContent=mode==='exam'?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:'';
  if(seconds<=0){clearInterval(tick);alert('Terminó el tiempo del examen.')}
}
function selectedYear(){const y=$('#year').value;return y==='Todas'?null:y}
function yearQuestions(y){return QUESTIONS.filter(x=>x.year===y).sort((a,b)=>a.number-b.number)}

function updateNavigator(){
  const nav=$('#practiceNav'),panel=$('#navigator');
  if(mode!=='practice'){nav.classList.add('hidden');panel.classList.add('hidden');return}
  const x=pool[i],y=selectedYear();
  if(!x||!y){nav.classList.add('hidden');panel.classList.add('hidden');return}
  nav.classList.remove('hidden');
  const all=yearQuestions(y);
  $('#currentOfficial').textContent=x.number; $('#totalOfficial').textContent=all.length;
  $('#prevQ').disabled=x.number<=1; $('#nextQ').disabled=x.number>=all.length;
  $('#questionGrid').innerHTML=all.map(q=>{
    const s=statusOf(q.id),fav=S.fav.includes(q.id),cur=q.id===x.id;
    const cls=[s==='correct'?'q-correct':s==='wrong'?'q-wrong':'',cur?'q-current':'',fav?'q-fav':''].filter(Boolean).join(' ');
    const mark=s==='correct'?'✓':s==='wrong'?'✕':'';
    return `<button type="button" class="${cls}" data-id="${q.id}" aria-label="Pregunta ${q.number}, ${s==='correct'?'acertada':s==='wrong'?'fallada':'pendiente'}"><span class="gridMark">${mark}</span><span class="gridNum">${q.number}</span></button>`;
  }).join('');
  $('#questionGrid').querySelectorAll('button').forEach(b=>b.onclick=()=>jumpToId(b.dataset.id));
}
function jumpToId(id){
  let idx=pool.findIndex(q=>q.id===id);
  if(idx<0){
    const q=QUESTIONS.find(q=>q.id===id); if(!q)return;
    pool=yearQuestions(q.year); idx=pool.findIndex(z=>z.id===id);
  }
  i=idx; $('#navigator').classList.add('hidden'); render();
}
function jumpOfficial(d){
  const x=pool[i],y=selectedYear(); if(!x||!y)return;
  const q=QUESTIONS.find(z=>z.year===y&&z.number===x.number+d); if(q)jumpToId(q.id);
}
function render(){
  const x=pool[i]; if(!x)return;
  chosen=null;
  $('#progress').textContent=`${i+1} de ${pool.length}`;
  $('#meta').textContent=`Prueba ${x.year} · Pregunta ${x.number} · ${x.topic} · ${x.cycle}`;
  $('#question').textContent=x.q;
  $('#options').innerHTML=x.o.map((v,n)=>`<button class="option" data-n="${n}"><b>${'ABC'[n]}.</b> ${v}</button>`).join('');
  $('#check').disabled=true; $('#check').classList.remove('hidden');
  $('#feedback').classList.add('hidden'); $('#next').classList.add('hidden');
  $('#fav').textContent=S.fav.includes(x.id)?'★':'☆';

  const prior=statusOf(x.id),banner=$('#answerStatus');
  if(prior==='correct'){
    banner.innerHTML='<span class="statusSymbol">✓</span><strong>YA RESPONDIDA · CORRECTA</strong>';
    banner.className='answerStatus status-correct';
  }else if(prior==='wrong'){
    banner.innerHTML=`<span class="statusSymbol">✕</span><strong>YA RESPONDIDA · INCORRECTA</strong> · Clave correcta: ${'ABC'[x.a]}`;
    banner.className='answerStatus status-wrong';
  }else{
    banner.textContent=''; banner.className='answerStatus hidden';
  }
  document.querySelectorAll('.option').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('.option').forEach(z=>z.classList.remove('selected'));
    b.classList.add('selected');chosen=+b.dataset.n;$('#check').disabled=false;
  });
  updateNavigator();
}
function start(exam){
  pool=filtered();
  if(!pool.length){
    const s=$('#state').value;
    alert(s==='Pendientes'?'No quedan preguntas pendientes con estos filtros.':`No hay preguntas en el estado “${s}” con estos filtros.`);
    return;
  }
  if(exam){
    mode='exam';pool=pool.sort(()=>Math.random()-.5).slice(0,60);i=0;
    seconds=10800;clearInterval(tick);timer();tick=setInterval(timer,1000);
  }else{
    mode='practice';
    // En "Todas", continúa por la primera pendiente. En Acertadas/Falladas/Favoritas respeta ese conjunto.
    if($('#state').value==='Todas'){
      const pending=pool.findIndex(x=>!statusOf(x.id));i=pending>=0?pending:0;
    }else i=0;
  }
  $('#config').classList.add('hidden');$('#quiz').classList.remove('hidden');render();
}
document.querySelectorAll('select').forEach(x=>x.onchange=counts);
$('#practice').onclick=()=>start(false);
$('#exam').onclick=()=>start(true);
$('#back').onclick=()=>{clearInterval(tick);$('#navigator').classList.add('hidden');$('#quiz').classList.add('hidden');$('#config').classList.remove('hidden');counts()};
$('#check').onclick=()=>{
  const x=pool[i],good=chosen===x.a;
  // Richer record from V4.2 onward, while statusOf keeps old data compatible.
  S.status[x.id]={result:good?'correct':'wrong',selected:chosen};
  save();
  document.querySelectorAll('.option').forEach((b,n)=>{b.disabled=true;if(n===x.a)b.classList.add('correct');if(n===chosen&&!good)b.classList.add('wrong')});
  $('#feedback').innerHTML=`<b>${good?'Correcto ✓':'Respuesta incorrecta ✕'}</b><br>${x.why}`;
  $('#feedback').classList.remove('hidden');$('#next').classList.remove('hidden');$('#check').classList.add('hidden');
  counts();updateNavigator();
  const banner=$('#answerStatus');
  banner.innerHTML=good?'<span class="statusSymbol">✓</span><strong>YA RESPONDIDA · CORRECTA</strong>':`<span class="statusSymbol">✕</span><strong>YA RESPONDIDA · INCORRECTA</strong> · Clave correcta: ${'ABC'[x.a]}`;
  banner.className=`answerStatus ${good?'status-correct':'status-wrong'}`;
};
$('#next').onclick=()=>{if(i+1>=pool.length){alert('Terminaste esta práctica.');$('#back').click();return}i++;render()};
$('#fav').onclick=()=>{let id=pool[i].id,n=S.fav.indexOf(id);n>=0?S.fav.splice(n,1):S.fav.push(id);save();$('#fav').textContent=S.fav.includes(id)?'★':'☆';counts();updateNavigator()};
$('#openNavigator').onclick=()=>$('#navigator').classList.toggle('hidden');
$('#prevQ').onclick=()=>jumpOfficial(-1);$('#nextQ').onclick=()=>jumpOfficial(1);
$('#reset').onclick=()=>{if(confirm('¿Restablecer todo el progreso? Se borrarán respondidas, acertadas, falladas y favoritas.')){S={fav:[],status:{}};save();counts();alert('Progreso restablecido.')}};
counts();
