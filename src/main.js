import {HospitalTwin, DEFAULT_CONFIG, clamp} from './simulator.js';
import {optimizeStaff,percentChange} from './optimizer.js';
import {forecastSeries} from './forecast.js';
import {lineChart,floorMap} from './charts.js';
import {initTwinView,updateTwinView,setCriticalFilter,focusPatient} from './twinView.js';
import {initTwin3D,updateTwin3D,setTwin3DActive,setTwin3DPatient,setTwin3DCriticalFilter} from './twin3d.js';
const byId=id=>document.getElementById(id);
const icon=name=>`<svg class="icon mini"><use href="#i-${name}"/></svg>`;
const n=(value,places=0)=>Number.isFinite(value)?Number(value).toFixed(places):'—';
const state={config:{...DEFAULT_CONFIG},twin:new HospitalTwin(),model:null,playing:false,speed:1,metric:'queue',tab:'twin',viewMode:'3d',results:null};
// A 100-minute warmup makes the command-center view immediately informative.
state.twin.step(100);
let ticker=null,lastRender=0,toastTimer=null;
function toast(message){
 const el=byId('toast');el.textContent=message;el.classList.add('show');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2600);
}
function changeTab(name){
 state.tab=name;
 document.querySelectorAll('.tab').forEach(el=>el.classList.toggle('active',el.id===`tab-${name}`));
 document.querySelectorAll('[data-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===name));
 const labels={twin:'VIRTUAL HOSPITAL',overview:'COMMAND CENTER',scenario:'SCENARIO LAB',model:'FORECAST STUDIO',about:'METHODOLOGY'};
 byId('breadcrumb').textContent=labels[name];
 window.scrollTo({top:0,behavior:'instant'});
 if(name==='scenario'&&!state.results)runScenario();
 if(name==='model')renderForecast();
 if(name==='overview'||name==='twin')render();setTwin3DActive(name==='twin'&&state.viewMode==='3d');
}
function simTime(minute){
 const hr=Math.floor((480+minute)/60)%24,mi=(480+minute)%60;
 return `Day ${1+Math.floor((480+minute)/1440)} · ${String(hr).padStart(2,'0')}:${String(mi).padStart(2,'0')}`;
}
function shortTime(minute){const h=Math.floor((480+minute)/60)%24,m=(480+minute)%60;return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}
function render(){
 const t=state.twin,s=t.getSnapshot();
 byId('simClock').textContent=simTime(s.minute);
 byId('kpiActive').textContent=s.active;
 byId('kpiWait').textContent=n(s.meanWait,1);
 byId('kpiQueue').textContent=s.queue;
 byId('kpiBeds').textContent=s.bedOccupancy;
 byId('bedProgress').style.width=`${clamp(s.bedOccupancy,0,100)}%`;
 byId('hospitalMap').innerHTML=floorMap(s,state.config);
 byId('mapArrivals').textContent=`${s.arrivalsLastHour} ARRIVALS / LAST HR`;
 renderTrend();renderPatients();renderEvents();updateTwinView(state.twin);updateTwin3D(state.twin);
 for (const [id,key] of [['twinArrival','arrivalsPerHour'],['twinNurses','nurses'],['twinDoctors','physicians'],['twinBeds','treatmentBeds']]) {const e=byId(id);if(e){e.value=state.config[key];byId(id+'Output').textContent=state.config[key];}}
}
function renderTrend(){
 const key=state.metric;
 let points=state.twin.history.slice(-19);
 const arr=points.map(h=>({value:h[key],minute:h.minute}));
 byId('trendChart').innerHTML=lineChart(arr,{label:`Historical ${key} chart`,color:key==='queue'?'#5be0c6':key==='active'?'#75bcfa':'#aa94fa',axisLabels:d=>shortTime(d.minute),unit:key==='bed'?'%':''});
 byId('chartLegend').textContent=key==='queue'?'Patients in queues':key==='active'?'Patients in system':'Mean time to clinician (min)';
}
const stageLabels={triageQueue:'Waiting for triage',triage:'Triage',careQueue:'Waiting for clinician',care:'Under treatment',icuQueue:'Awaiting ICU',icu:'ICU',observation:'Observation',discharged:'Discharged'};
function renderPatients(){
 const patients=state.twin.recentPatients(8);
 byId('patientRows').innerHTML=patients.length?patients.map(p=>`<tr><td><span class="patient-id">#${p.id}</span></td><td><span class="acuity ${p.severity<=2?'urgent':p.severity===3?'medium':'low'}">P${p.severity}</span></td><td><span class="stage-badge">${stageLabels[p.status]}</span></td><td>${state.twin.time-p.arrived} min</td></tr>`).join(''):'<tr><td colspan="4">No patients in the active system yet.</td></tr>';
}
function renderEvents(){
 const t=state.twin, s=t.getSnapshot();
 const defaultEvents=[{minute:0,message:'Virtual facility initialized (fixed seed)',type:'system'},{minute:0,message:'Synthetic event stream connected',type:'info'}];
 const events=[...t.log.slice(0,3),...defaultEvents].slice(0,4);
 if(s.icuOccupancy>=90)events.unshift({minute:t.time,message:'ICU capacity approaching limit',type:'critical'});
 else if(s.edQueue>25)events.unshift({minute:t.time,message:'Elevated queue detected in ED',type:'critical'});
 byId('eventFeed').innerHTML=events.slice(0,4).map(e=>`<div class="event-item"><span class="event-icon ${e.type==='critical'?'critical':''}">${e.type==='critical'?'!':'✓'}</span><div><p>${e.message}</p><small>${shortTime(e.minute)} · ${e.type==='critical'?'High-priority event':'Simulation log'}</small></div></div>`).join('');
}
function syncConfig(){
 for(const [id,key] of [['arrival','arrivalsPerHour'],['nurses','nurses'],['physicians','physicians'],['beds','treatmentBeds']]){
  const value=Number(byId(`${id}Input`).value);
  state.config[key]=value;byId(`${id}Output`).textContent=value;
 }
 state.twin.config={...state.twin.config,...state.config};
 state.results=null;
 render();
}
function setMode(surge){
 state.config.surge=surge;
 state.twin.config.surge=surge;
 byId('normalMode').classList.toggle('active',surge===1);
 byId('surgeMode').classList.toggle('active',surge!==1);
 byId('scenarioBadge').textContent=surge===1?'NORMAL':'SURGE';
 state.results=null;
 byId('twinNormal').classList.toggle('active',surge===1);
 byId('twinSurge').classList.toggle('active',surge!==1);
 render();
 toast(surge>1?'Surge scenario activated: demand ×1.8':'Standard demand restored');
}
function setPlaying(playing){
 state.playing=playing;
 byId('playText').textContent=playing?'Pause':'Play';
 byId('twinPlay').textContent=playing?'Ⅱ Pause simulation':'▶ Run simulation';
 byId('playButton').innerHTML=`${icon(playing?'pause':'play')}<span id="playText">${playing?'Pause':'Play'}</span>`;
 clearInterval(ticker);ticker=null;
 if(playing){
   ticker=setInterval(()=>{
     state.twin.step(state.speed);
     render();
   },850);
 }
}
function reset(){
 setPlaying(false);
 state.twin=new HospitalTwin(state.config).step(100);
 state.results=null;render();toast('Digital twin reset to reproducible initial state');
}
function runScenario(){
 byId('runScenario').disabled=true;
 byId('runScenario').textContent='Evaluating scenarios…';
 // Give the busy state one browser frame to paint.
 window.setTimeout(()=>{
   try {state.results=optimizeStaff(state.config,{minutes:360,warmup:90,flexStaff:state.config.flexStaff});renderScenario();toast('4 matched-demand candidate scenarios evaluated');}
   catch(err){console.error(err);toast('Scenario analysis error — check browser console');}
   finally{byId('runScenario').disabled=false;byId('runScenario').innerHTML=`${icon('beaker')} Run scenario analysis`;}
 },30);
}
function renderScenario(){
 const r=state.results;if(!r)return;
 const b=r.baseline,o=r.best;
 byId('baselineWait').innerHTML=`${n(b.meanWait,1)} <small>min avg wait</small>`;
 byId('baselineQueue').textContent=n(b.meanQueue,1)+' patients';
 byId('baselineDone').textContent=String(b.discharges);
 byId('baselineStaff').textContent=`${state.config.nurses} triage / ${state.config.physicians} ED`;
 byId('optimizedWait').innerHTML=`${n(o.meanWait,1)} <small>min avg wait</small>`;
 byId('optimizedQueue').textContent=n(o.meanQueue,1)+' patients';
 byId('optimizedDone').textContent=String(o.discharges);
 byId('optimizedStaff').textContent=`+${o.toTriage} triage / +${o.toDoctors} ED`;
 const percent=percentChange(b.meanWait,o.meanWait);
 byId('scenarioGain').textContent=(percent>0?'+':'')+n(percent,1)+'%';
 byId('scenarioGain').style.color=percent<0?'#5be0c6':percent>0?'#fd8b9e':'#9db1c4';
 byId('gainLabel').textContent='Change in mean time to clinician';
 byId('recommendation').textContent=`Lowest tested score uses ${o.toTriage} of 3 float staff in triage and ${o.toDoctors} in treatment. ${percent<-.1?'The synthetic mean wait decreases.':percent>.1?'Mean wait increases, but the combined objective chooses this trade-off.':'Simulated mean wait is nearly unchanged.'} Review the full set of candidates below.`;
 const base=new Map(b.history.map(item=>[item.minute,item.queue]));
 const points=o.history.filter((_,i)=>i%2===0).map(h=>({minute:h.minute,value:h.queue,secondary:base.get(h.minute)??0}));
 byId('comparisonChart').innerHTML=lineChart(points,{label:'Mean queue path under optimized versus baseline staffing',color:'#5be0c6',secondary:true,secondaryColor:'#aa94fa',height:275,axisLabels:d=>`${Math.round((d.minute-90)/60)}h`});
 byId('candidateRows').innerHTML=r.candidates.map((c,i)=>`<tr class="${i===0?'candidate-best':''}"><td><span class="patient-id">${i===0?'★ BEST':'Option '+(i+1)}</span></td><td>+${c.toTriage}</td><td>+${c.toDoctors}</td><td>${n(c.meanWait,1)} min</td><td>${n(c.meanQueue,1)} pts</td><td><strong>${n(c.score,2)}</strong></td></tr>`).join('');
}
function renderForecast(){
 if(!state.model)return;
 const m=state.model;
 byId('forecastMae').textContent=n(m.holdout_mae,2);
 byId('baselineMae').textContent=n(m.constant_baseline_mae,2);
 const now=(8+Math.floor(state.twin.time/60))%24;
 const series=forecastSeries(m,state.config,now,1,24);
 byId('forecastChart').innerHTML=lineChart(series.map(d=>({...d,value:d.predicted})),{label:'Synthetic demand forecast for the next 24 hours',color:'#75bcfa',height:285,axisLabels:d=>d.label});
}
function exportSnapshot(){
 const payload={project:'HospitalFlow AI',version:'3.0.0',generatedAt:new Date().toISOString(),synthetic:true,
   notice:'Educational simulated observations, not clinical measurements or recommendations',
   scenario:state.config,simTime:state.twin.time,snapshot:state.twin.getSnapshot(),
   recentHistory:state.twin.history,analysis:state.results?{baseline:{meanWait:state.results.baseline.meanWait,meanQueue:state.results.baseline.meanQueue},optimized:{toTriage:state.results.best.toTriage,toDoctors:state.results.best.toDoctors,meanWait:state.results.best.meanWait,meanQueue:state.results.best.meanQueue}}:null};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='hospitalflow-synthetic-snapshot.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),500);
 toast('Synthetic simulation snapshot exported');
}
function init(){
 initTwinView({onSelect:(id)=>{setTwin3DPatient(id);updateTwinView(state.twin);}});
 initTwin3D({onPatientSelect:(id)=>{focusPatient(id);updateTwinView(state.twin);}});
 setTwin3DActive(true);
 for(const [mode,btnId] of [['3d','mode3d'],['2d','mode2d']])byId(btnId).addEventListener('click',()=>{
    state.viewMode=mode;byId('visualSceneWrap').classList.toggle('mode-3d',mode==='3d');
    byId('twinViewStatus').textContent=mode==='3d'?'◈ ISOMETRIC 3D / LIVE STATE':'▦ 2D FLOOR PLAN / LIVE STATE';
    for(const [m,b] of [['3d','mode3d'],['2d','mode2d']]){byId(b).classList.toggle('active',m===mode);byId(b).setAttribute('aria-pressed',String(m===mode));}
    setTwin3DActive(mode==='3d');render();
 });
 byId('twinPlay').addEventListener('click',()=>setPlaying(!state.playing));
 byId('twinStep').addEventListener('click',()=>{setPlaying(false);state.twin.step(5);render();});
 byId('twinFastStep').addEventListener('click',()=>{setPlaying(false);state.twin.step(30);render();});
 byId('twinReset').addEventListener('click',reset);
 byId('twinNormal').addEventListener('click',()=>setMode(1));
 byId('twinSurge').addEventListener('click',()=>setMode(1.8));
 byId('twinGoScenario').addEventListener('click',()=>changeTab('scenario'));
 byId('criticalOnly').addEventListener('click',e=>{const enabled=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(enabled));e.currentTarget.classList.toggle('active',enabled);setCriticalFilter(enabled);setTwin3DCriticalFilter(enabled);render();});
 byId('floorFullscreen').addEventListener('click',()=>{const panel=byId('visualSceneWrap');if(document.fullscreenElement){document.exitFullscreen?.();}else{panel.requestFullscreen?.();}});
 for(const [id,other] of [['twinArrival','arrival'],['twinNurses','nurses'],['twinDoctors','physicians'],['twinBeds','beds']]){byId(id).addEventListener('input',e=>{byId(other+'Input').value=e.target.value;byId(other+'Input').dispatchEvent(new Event('input'));});}
 document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>changeTab(btn.dataset.tab)));
 document.querySelectorAll('[data-go]').forEach(btn=>btn.addEventListener('click',()=>changeTab(btn.dataset.go)));
 document.querySelectorAll('[data-metric]').forEach(btn=>btn.addEventListener('click',()=>{
  state.metric=btn.dataset.metric;
  document.querySelectorAll('[data-metric]').forEach(b=>b.classList.toggle('selected',b===btn));
  renderTrend();
 }));
 for(const id of ['arrival','nurses','physicians','beds'])byId(`${id}Input`).addEventListener('input',syncConfig);
 byId('normalMode').addEventListener('click',()=>setMode(1));
 byId('surgeMode').addEventListener('click',()=>setMode(1.8));
 byId('playButton').addEventListener('click',()=>setPlaying(!state.playing));
 byId('resetButton').addEventListener('click',reset);
 byId('runScenario').addEventListener('click',runScenario);
 byId('exportSnapshot').addEventListener('click',exportSnapshot);
 document.querySelectorAll('[data-speed]').forEach(btn=>btn.addEventListener('click',()=>{
  state.speed=Number(btn.dataset.speed);
  document.querySelectorAll('[data-speed]').forEach(el=>el.classList.toggle('selected',el===btn));
 }));
 window.addEventListener('visibilitychange',()=>{if(document.hidden && state.playing)setPlaying(false)});
 (window.__forecastModel ? Promise.resolve(window.__forecastModel) : fetch('data/forecast_model.json').then(r=>{if(!r.ok)throw new Error('forecast model not found');return r.json()})).then(model=>{state.model=model;renderForecast()}).catch(e=>{console.warn('Model unavailable:',e);byId('forecastChart').textContent='The local forecast JSON could not be loaded. Please launch using an HTTP server.'});
 render();
}
init();
