/**
 * Visual facility twin. Pure SVG + browser DOM: no Python runtime, canvas library,
 * cloud dependency or external patient data. Every dot is a real simulator patient.
 */
const $ = id => document.getElementById(id);
const SVG = 'http://www.w3.org/2000/svg';
const stageNames = {
  triageQueue: 'Triage waiting', triage:'Under triage', careQueue:'Treatment waiting',
  care:'ED treatment', observation:'Observation', icuQueue:'ICU waiting', icu:'Critical care', discharged:'Discharged'
};
const colors = {1:'#ff607b',2:'#ff9678',3:'#ffce70',4:'#5ddcce',5:'#74aefc'};
const stages = ['triageQueue','triage','careQueue','care','observation','icuQueue','icu'];
let selectedId = null, selectedStage = 'all', onlyCritical = false;
let notifySelection = ()=>{};

const bed=(x,y,{critical=false}={})=>`<g transform="translate(${x} ${y})" class="visual-bed"><rect width="63" height="37" rx="7" fill="#14283e" stroke="${critical?'#77596c':'#49627c'}" stroke-width="1.3"/><rect x="7" y="4" width="49" height="29" rx="5" fill="${critical?'#214059':'#25445b'}"/><rect x="11" y="8" width="18" height="19" rx="4" fill="#b6d0da" opacity=".8"/><rect x="32" y="8" width="21" height="19" rx="4" fill="${critical?'#dc8e9e':'#549aab'}" opacity=".43"/><circle cx="58" cy="3" r="3" fill="${critical?'#ff778c':'#5ee1cd'}"/></g>`;
const chair=(x,y)=>`<g transform="translate(${x} ${y})"><rect width="18" height="18" rx="5" fill="#304e66" stroke="#7796a7" stroke-width="1"/><path d="M4 17H14M4 3h10" stroke="#a5c8d0" stroke-width="2"/></g>`;
const device=(x,y)=>`<g transform="translate(${x} ${y})"><rect width="32" height="24" rx="4" fill="#172c41" stroke="#56748d"/><path d="M5 12h5l3-6 4 13 4-8h6" stroke="#6cf1d3" stroke-width="1.5" fill="none"/><circle cx="26" cy="5" r="2" fill="#f29a76"/></g>`;
const room=(x,y,w,h,label,detail,accent,key)=>`<g class="visual-room visual-room-${key}" data-room="${key}"><rect x="${x+8}" y="${y+11}" width="${w}" height="${h}" rx="10" fill="#020916" opacity=".7"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#152740" stroke="#48617b" stroke-width="3"/><rect x="${x+3}" y="${y+3}" width="${w-6}" height="7" rx="3" fill="#87b3c8" opacity=".25"/><rect x="${x+16}" y="${y+18}" width="5" height="35" rx="2" fill="${accent}"/><text x="${x+33}" y="${y+34}" class="visual-room-title">${label}</text><text x="${x+33}" y="${y+52}" class="visual-room-sub">${detail}</text><rect x="${x+w-69}" y="${y+17}" rx="11" width="51" height="24" fill="#23384e" stroke="#4b627b"/><text id="visual-count-${key}" x="${x+w-43.5}" y="${y+34}" text-anchor="middle" class="visual-room-count">0</text></g>`;
const iconPerson=(x,y)=>`<g transform="translate(${x} ${y})"><circle r="11" fill="#29485e" stroke="#81a4b8"/><circle cx="0" cy="-3" r="3.6" fill="#add6db"/><path d="M-6 6Q0 -3 6 6" fill="#add6db"/></g>`;

export function initTwinView({onSelect}={}) {
  notifySelection = onSelect || notifySelection;
  const host = $('facilityScene');
  if(!host)return;
  const roomMarkup = [
    room(68,72,255,257,'RECEPTION','Arrival & registration','#71baf9','arrival'),
    room(337,72,332,257,'TRIAGE','Rapid assessment','#65ead1','triage'),
    room(684,72,658,257,'ED TREATMENT','Clinical care bays','#a999ff','care'),
    room(68,462,303,246,'WAITING AREA','Awaiting triage','#f6b66e','triageQueue'),
    room(385,462,444,246,'OBSERVATION','Post-treatment monitoring','#6ac9f0','observation'),
    room(844,462,498,246,'CRITICAL CARE / ICU','High-acuity unit','#ff8294','icu')
  ].join('');
  const furniture = [
    `<g opacity=".95"><rect x="123" y="205" width="135" height="30" rx="9" fill="#386580" stroke="#7ca8c1"/><rect x="128" y="212" width="48" height="16" rx="4" fill="#1b3044"/><rect x="197" y="212" width="25" height="16" rx="3" fill="#a6ccdf"/><circle cx="272" cy="218" r="9" fill="#54ebc7" opacity=".28"/><path d="M268 218h8M272 214v8" stroke="#66ecc9" stroke-width="2"/></g>`,
    ...[0,1,2].map(i=>`<g>${chair(103+i*64,555)}${chair(103+i*64,653)}</g>`),
    ...[0,1,2,3].map(i=>chair(103+i*60,607)),
    ...[0,1,2,3].map(i=>bed(367+(i%2)*151,198+Math.floor(i/2)*62)),
    ...[0,1,2,3,4,5,6,7,8,9].map(i=>bed(730+(i%5)*114,163+Math.floor(i/5)*75)),
    ...[0,1,2,3,4,5].map(i=>bed(432+(i%3)*124,571+Math.floor(i/3)*70)),
    ...[0,1,2,3,4,5,6,7].map(i=>bed(894+(i%4)*106,555+Math.floor(i/4)*73,{critical:true})),
    device(1282,135),device(1282,550),device(779,545),
    `<g stroke="#3e6580" stroke-width="3"><path d="M331 359v77M669 359v77M1008 359v77" stroke-dasharray="8 11" opacity=".8"/></g>`,
    `<g transform="translate(450 375)"><rect width="385" height="54" rx="14" fill="#1c354b" stroke="#496780"/><text x="193" y="21" text-anchor="middle" fill="#aac8dc" font-size="13" letter-spacing="2" font-weight="750">PATIENT TRANSFER CORRIDOR</text><path d="M65 37h245m-12-8 12 8-12 8" stroke="#4dd8ca" stroke-width="3" stroke-linecap="round" stroke-dasharray="9 10" opacity=".75" fill="none"/></g>`,
    `<g transform="translate(1034 382)"><rect width="254" height="43" rx="9" fill="#28364d" stroke="#72526a"/><text x="127" y="18" text-anchor="middle" fill="#ffaabb" font-size="12" font-weight="800">ICU TRANSFER</text><text x="127" y="32" text-anchor="middle" fill="#ad859c" font-size="10">high-acuity priority route</text></g>`,
    `<g transform="translate(90 385)"><rect width="230" height="46" rx="9" fill="#1a4851" stroke="#428575"/><text x="115" y="19" text-anchor="middle" fill="#9cf9df" font-size="12" font-weight="800">ED ENTRANCE</text><text x="115" y="33" text-anchor="middle" fill="#b5d1d7" font-size="9.5">synthetic patient intake</text></g>`
  ].join('');
  const svg=`<svg viewBox="0 0 1410 770" xmlns="http://www.w3.org/2000/svg" id="twinFloorSVG" role="group" aria-label="Interactive live simulated hospital floor; click patient markers to inspect" preserveAspectRatio="xMidYMid meet">
  <defs>
    <pattern id="floorGrid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#294154" stroke-width=".8" opacity=".28"/></pattern>
    <linearGradient id="floorGrad" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#102438"/><stop offset="1" stop-color="#0b1c31"/></linearGradient>
    <filter id="roomShadow"><feDropShadow dx="0" dy="7" stdDeviation="8" flood-color="#040b17" flood-opacity=".85"/></filter>
  </defs>
  <rect width="1410" height="770" rx="18" fill="#091626"/>
  <rect x="35" y="45" width="1340" height="701" rx="18" fill="url(#floorGrad)" stroke="#375672" stroke-width="4"/>
  <rect x="43" y="53" width="1324" height="685" rx="11" fill="url(#floorGrid)"/>
  <g filter="url(#roomShadow)">${roomMarkup}</g>
  ${furniture}
  <g id="patientAgents"></g>
  <g transform="translate(58,25)"><circle r="4" cx="0" cy="0" fill="#5ee1ce" class="visual-ping"/><text x="13" y="4" font-size="11" fill="#92d6c9" font-weight="800" letter-spacing="1.5">FACILITY LINK ACTIVE</text></g>
  <text x="1345" y="756" text-anchor="end" fill="#526e88" font-size="10" font-weight="600" letter-spacing="1">MODEL SPACE • NOT TO SCALE</text>
</svg>`;
  host.innerHTML = svg;
  host.addEventListener('click',event=>{
    const agent=event.target.closest('[data-patient]');
    if(agent){selectedId=Number(agent.dataset.patient); notifySelection(selectedId);return;}
    const region=event.target.closest('[data-room]');
    if(region){setRoomFocus(region.dataset.room==='arrival'?'all':region.dataset.room);notifySelection(selectedId);}
  });
}

function setRoomFocus(stage){selectedStage=selectedStage===stage?'all':stage;const label=$('focusRegionLabel');if(label)label.textContent=selectedStage==='all'?'ALL DEPARTMENTS':(stageNames[selectedStage]||selectedStage).toUpperCase();}
export function setCriticalFilter(value){onlyCritical=Boolean(value);return onlyCritical;}
export function focusPatient(id){selectedId=id;notifySelection(id);}
export function getPatientFocus(){return selectedId;}
export function clearRoomFocus(){setRoomFocus('all');}

// Stable per-patient positions, designed to reflect stage without suggesting real location precision.
const zones={
  triageQueue:{x:99,y:552,columns:8,dx:32,dy:32,capacity:38},
  triage:{x:372,y:144,columns:9,dx:32,dy:32,capacity:48},
  careQueue:{x:817,y:402,columns:9,dx:32,dy:27,capacity:18},
  care:{x:729,y:151,columns:14,dx:39,dy:39,capacity:84},
  observation:{x:424,y:557,columns:11,dx:32,dy:31,capacity:52},
  icuQueue:{x:905,y:402,columns:7,dx:32,dy:28,capacity:10},
  icu:{x:888,y:548,columns:13,dx:31,dy:33,capacity:55}
};
function createAgent(p){
  const agent=document.createElementNS(SVG,'g');agent.setAttribute('class','patient-agent');agent.dataset.patient=String(p.id);
  agent.innerHTML=`<circle class="agent-aura" r="15" fill="none" stroke-width="2"/><circle class="agent-base" r="10.8" stroke="#071726" stroke-width="2.5"/><circle cy="-3.6" r="3.2" fill="#081b2b"/><path d="M-5 6Q0 -1 5 6" fill="#081b2b"/><circle class="agent-selected" r="19" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="3 4"/><title>Patient #${p.id}, acuity P${p.severity}</title>`;
  $('patientAgents').append(agent);return agent;
}
function updatePanelPatient(twin){
  const patient=twin.patients.find(p=>p.id===selectedId && p.status!=='discharged');
  const host=$('patientInspector');if(!host)return;
  if(!patient){
    host.innerHTML='<div class="inspector-empty"><div class="inspector-empty-icon">✳</div><h3>Select a patient on the floor</h3><p>Click any glowing patient marker to inspect their current simulated state and care journey.</p></div>';
    return;
  }
  const stage=stageNames[patient.status]||patient.status;
  const history=patient.journey||[{stage:'triageQueue',minute:patient.arrived}];
  const entries=history.slice().reverse().map((h,i)=>`<div class="journey-event ${i===0?'now':''}"><span class="journey-rail"></span><div><strong>${stageNames[h.stage]||h.stage}</strong><small>Simulation minute ${h.minute} · ${Math.max(0,twin.time-h.minute)} min ago</small></div></div>`).join('');
  const elapsed=twin.time-patient.arrived;
  host.innerHTML=`
   <div class="inspector-title"><span class="inspector-icon" style="border-color:${colors[patient.severity]};color:${colors[patient.severity]}">✚</span><div><span class="panel-kicker">SELECTED SYNTHETIC PATIENT</span><h3>Patient #${patient.id}</h3></div><span class="inspector-priority" style="color:${colors[patient.severity]}">P${patient.severity}</span></div>
   <div class="inspector-current"><small>CURRENT LOCATION</small><strong>${stage}</strong><span class="inspector-online"><span class="status-dot"></span>SIMULATION STATE LINKED</span></div>
   <div class="inspector-metrics"><div><small>In system</small><strong>${elapsed} min</strong></div><div><small>Service remaining</small><strong>${patient.remaining>0?patient.remaining+' min':'Queued'}</strong></div><div><small>Triage started</small><strong>${patient.triageAt??'—'}</strong></div><div><small>Care started</small><strong>${patient.careAt??'—'}</strong></div></div>
   <div class="inspector-journey"><div class="inspector-journey-head">PATIENT JOURNEY <span>${history.length} TRANSITIONS</span></div>${entries}</div>
   <div class="inspector-disclaimer">Illustrative identity and acuity. No real patient information, vitals, or clinical assessment.</div>`;
}
export function updateTwinView(twin) {
  const svg=$('twinFloorSVG');if(!svg)return;
  const snap=twin.getSnapshot();
  const set=(id,txt)=>{const e=$(id);if(e)e.textContent=txt;};
  set('visual-count-arrival',snap.arrivalsLastHour);set('visual-count-triage',snap.counts.triage);set('visual-count-care',snap.counts.care);
  set('visual-count-triageQueue',snap.counts.triageQueue);set('visual-count-observation',snap.counts.observation);set('visual-count-icu',snap.counts.icu);
  set('twinCensus',snap.active);set('twinWaiting',snap.queue);set('twinIcu',snap.icuOccupancy+'%');set('twinExited',snap.discharged);
  set('twinClock',`DAY ${1+Math.floor((480+twin.time)/1440)} · ${String(Math.floor((480+twin.time)/60)%24).padStart(2,'0')}:${String((480+twin.time)%60).padStart(2,'0')}`);
  const counts={};for(const k of stages)counts[k]=0;
  const visible=new Set();
  const patients=twin.patients.filter(p=>p.status!=='discharged');
  if(selectedId!==null&&!patients.some(p=>p.id===selectedId))selectedId=null;
  for(const p of patients){
    if(!zones[p.status])continue;
    const idx=counts[p.status]++;
    const zone=zones[p.status];
    if(idx>=zone.capacity)continue; // counts above zone show total; spatial dots are capped for legibility.
    visible.add(String(p.id));
    let agent=svg.querySelector(`[data-patient="${p.id}"]`);
    if(!agent){agent=createAgent(p);agent.style.transform=`translate(192px,396px)`;agent.style.opacity='0';}
    const x=zone.x+(idx%zone.columns)*zone.dx, y=zone.y+Math.floor(idx/zone.columns)*zone.dy;
    // Apply on the next paint so newly arrived patients animate from intake.
    const transform=`translate(${x}px,${y}px)`;
    requestAnimationFrame(()=>{if(agent.isConnected){agent.style.transform=transform;agent.style.opacity=(onlyCritical&&p.severity>2)||selectedStage!=='all'&&p.status!==selectedStage?'.12':'1';}});
    agent.setAttribute('aria-label',`Patient ${p.id}, priority ${p.severity}, ${stageNames[p.status]}`);
    agent.querySelector('.agent-base').setAttribute('fill',colors[p.severity]);
    agent.querySelector('.agent-aura').setAttribute('stroke',colors[p.severity]);
    agent.classList.toggle('selected',selectedId===p.id);
  }
  for(const agent of svg.querySelectorAll('[data-patient]'))if(!visible.has(agent.dataset.patient))agent.remove();
  set('visualCountNote', `${visible.size} of ${snap.active} patients visible as avatars${visible.size<snap.active?' · dense areas capped for clarity':''}`);
  updatePanelPatient(twin);
  const roomRows=[['TRIAGE',snap.counts.triage,twin.config.nurses,'#5be0c6'],['TREATMENT',snap.counts.care,Math.min(twin.config.physicians,twin.config.treatmentBeds),'#aa94fa'],['ICU',snap.counts.icu,twin.config.icuBeds,'#ff8294']];
  const capacities=$('capacityRows');if(capacities)capacities.innerHTML=roomRows.map(([name,num,max,color])=>`<div class="capacity-row"><div><span>${name}</span><strong>${num} / ${max}</strong></div><div class="capacity-track"><span style="width:${Math.min(100,num/max*100)}%;background:${color}"></span></div></div>`).join('');
}
