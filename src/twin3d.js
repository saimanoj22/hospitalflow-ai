/**
 * HospitalFlow AI — dependency-free 3D isometric scene renderer.
 * Physical room coordinates are deliberately illustrative, not measured hospital telemetry.
 * Geometry is defined in 3D world coordinates and projected with an orbitable camera onto canvas.
 * This is NOT WebGL/photorealistic Three.js; it works in offline HTML without external assets.
 */
const roomDefs = [
 {id:'arrival',name:'RECEPTION',sub:'Check-in & registration',x:-14,z:-9,w:5.2,d:6.8,color:'#51c2ff',floor:'#193b56'},
 {id:'triage',name:'TRIAGE',sub:'Rapid assessment',x:-8.2,z:-9,w:7.2,d:6.8,color:'#55e4ca',floor:'#16454f'},
 {id:'care',name:'ED TREATMENT',sub:'Clinical care bays',x:-.3,z:-9,w:14.3,d:6.8,color:'#bca2ff',floor:'#333858'},
 {id:'triageQueue',name:'WAITING LOUNGE',sub:'Pre-triage arrivals',x:-14,z:2,w:6.2,d:7,color:'#ffc17a',floor:'#4b3c41'},
 {id:'observation',name:'OBSERVATION',sub:'Monitored recovery',x:-7.2,z:2,w:9.3,d:7,color:'#68bcf6',floor:'#254661'},
 {id:'icu',name:'CRITICAL CARE',sub:'ICU & high acuity',x:2.8,z:2,w:11.2,d:7,color:'#ff769d',floor:'#543449'}
];
const STAGE_ROOM={triageQueue:'triageQueue',triage:'triage',careQueue:'care',care:'care',observation:'observation',icuQueue:'icu',icu:'icu'};
const palette={1:'#ff637f',2:'#ff9a77',3:'#ffd16a',4:'#64e2d0',5:'#80bafc'};
const roomById=Object.fromEntries(roomDefs.map(r=>[r.id,r]));
const clamp3=(v,a,b)=>Math.max(a,Math.min(b,v));
function rgba(hex,alpha){const h=hex.replace('#','');return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${alpha})`;}
function shade(hex,n){const h=hex.replace('#','');return '#'+[0,2,4].map(i=>clamp3(parseInt(h.slice(i,i+2),16)+n,0,255).toString(16).padStart(2,'0')).join('');}
let canvas,ctx,host,onSelect=()=>{},active=false,sceneTwin=null,filterCritical=false;
let camera={yaw:.66,pitch:.82,zoom:1,panX:0,panY:14};
const animation=new Map(), hitTargets=[];
let mouse={down:false,x:0,y:0,moved:false,hover:null};
let frame=0,resizeObserver=null,staticItems=[],bedLocations=[];
function itemBox(x,y,z,w,h,d,color,edge=null,glow=false){return {x,y,z,w,h,d,color,edge,glow};}
function initGeometry(){
 staticItems=[];bedLocations=[];
 const add=(...args)=>staticItems.push(itemBox(...args));
 // A recognizable cutaway hospital, with low perimeter plinth and differentiated wards.
 add(-14.65,-.55,-9.65,29.3,.55,19.3,'#245171','#408eb6');
 add(-14.6,-.75,-9.6,29.2,.20,19.2,'#0d253a');
 for(const r of roomDefs){
  add(r.x,.02,r.z,r.w,.10,r.d,r.floor,r.color);
  add(r.x,.14,r.z,r.w,1.18,.19,shade(r.floor,30),rgba(r.color,.7));
  add(r.x,.14,r.z,.15,1.12,r.d,shade(r.floor,19));
  add(r.x+r.w-.14,.14,r.z,.14,.68,r.d,shade(r.floor,7));
  add(r.x,.12,r.z+r.d-.10,r.w,.17,.10,shade(r.color,-35));
  add(r.x+.10,1.18,r.z,.2,.12,r.d,shade(r.color,20));
  // Thin illuminated room boundary gives each ward a readable footprint.
  add(r.x,.13,r.z+r.d-.12,r.w,.09,.08,r.color);
 }
 // Raised corridor with a central transfer lane.
 add(-14,.025,-1.3,28, .10,2.5,'#263f58','#45758b');
 for(let i=-12;i<=12;i+=3){add(i,.14,-.08,1.7,.024,.06,'#55d9c8');}
 // Reception desk / computers.
 add(-13.45,.15,-5.95,3.9,.73,1.1,'#3b90b3','#83dff1');
 add(-12.8,.91,-5.67,.9,.68,.16,'#152d4b','#a0eff8');
 add(-10.95,.91,-5.67,.85,.60,.16,'#152d4b','#a0eff8');
 // Waiting sofas arranged in rows.
 for(let i=0;i<3;i++) for(let j=0;j<2;j++){
   add(-13.4+i*1.9,.16,4.5+j*2.2,1.5,.52,.75,'#63829b','#9bb6cc');
   add(-13.4+i*1.9,.68,4.55+j*2.2,1.5,.44,.15,'#4e779b');
 }
 // Triage assessment pods, treatment beds, observation beds, ICU beds.
 for(let i=0;i<3;i++) putBed(-7.65+i*2.15,-7.0, '#66d7c5',false,'triage');
 for(let i=0;i<10;i++)putBed(.28+(i%5)*2.7,-7.55+Math.floor(i/5)*3.7,'#9e91dd',false,'care');
 for(let i=0;i<6;i++)putBed(-6.5+(i%3)*2.95,3.1+Math.floor(i/3)*3.2,'#66bff0',false,'observation');
 for(let i=0;i<8;i++)putBed(3.5+(i%4)*2.65,3.0+Math.floor(i/4)*3.25,'#ef8fae',true,'icu');
 // Equipment towers, monitors, plant and emergency signage.
 for(const [x,z,c] of [[2,-4.1,'#68e7d1'],[11,-4.1,'#68e7d1'],[-4,7,'#68e7d1'],[12,7,'#ff809c']]){
  add(x,.15,z,.85,1.15,.6,'#35617e');add(x+.1,1.33,z+.1,.63,.47,.12,'#102b41',c);
 }
 for(const [x,z] of [[-13,-8],[-8,-8],[.2,-8],[3,3]]){
  add(x,.15,z,.42,.88,.42,'#2c9279');add(x-.15,1.03,z-.15,.72,.17,.72,'#3eb78c');
 }
 // Exterior arrival canopy and directional blocks.
 add(-13.9,.13,9.1,6.1,.14,1.4,'#1c5865','#59e0cc');
}
function putBed(x,z,tint,critical,roomId){
 bedLocations.push({x,z,tint,roomId});
 const add=(...args)=>staticItems.push(itemBox(...args));
 add(x,.20,z,1.68,.32,2.36,'#a6bfd2','#dbeef5');
 add(x+.10,.53,z+.1,1.48,.20,2.1,critical?'#8b5e82':'#4d829e');
 add(x+.15,.75,z+.19,1.35,.12,.47,'#e6f0f6');
 add(x-.10,.21,z,.12,.83,2.3,tint);
 add(x+1.67,.20,z,.12,.46,2.3,tint);
 add(x+1.58,.15,z+1.93,.2,.85,.18,'#244662',tint);
}
function project(x,y,z){
 const {yaw,pitch,zoom,panX,panY}=camera;
 const cs=Math.cos(yaw),sn=Math.sin(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
 const scale=Math.min(canvas.clientWidth/38,canvas.clientHeight/28)*zoom;
 return {x:canvas.clientWidth/2+panX+(x*cs-z*sn)*scale,
         y:canvas.clientHeight*.51+panY+((x*sn+z*cs)*sp-y*cp)*scale,
         depth:(x*sn+z*cs)*cp+y*sp, scale};
}
const point=(a)=>project(a[0],a[1],a[2]);
function quad(vs,color,stroke=null,alpha=1){
 const vs2=vs.map(point); ctx.save();ctx.globalAlpha=alpha;ctx.beginPath();vs2.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.65;ctx.stroke();}ctx.restore();
}
function boxFaces(b){
 const {x,y,z,w,h,d}=b,X=x+w,Y=y+h,Z=z+d;
 const faces=[
 {normal:[0,1,0],v:[[x,Y,z],[X,Y,z],[X,Y,Z],[x,Y,Z]],fill:shade(b.color,25)},
 {normal:[1,0,0],v:[[X,y,z],[X,y,Z],[X,Y,Z],[X,Y,z]],fill:shade(b.color,-22)},
 {normal:[-1,0,0],v:[[x,y,Z],[x,y,z],[x,Y,z],[x,Y,Z]],fill:shade(b.color,-28)},
 {normal:[0,0,1],v:[[X,y,Z],[x,y,Z],[x,Y,Z],[X,Y,Z]],fill:b.color},
 {normal:[0,0,-1],v:[[x,y,z],[X,y,z],[X,Y,z],[x,Y,z]],fill:shade(b.color,-13)}
 ];
 const view=[Math.sin(camera.yaw)*Math.cos(camera.pitch),Math.sin(camera.pitch),Math.cos(camera.yaw)*Math.cos(camera.pitch)];
 return faces.filter(f=>f.normal[0]*view[0]+f.normal[1]*view[1]+f.normal[2]*view[2]>.03)
 .map(f=>({v:f.v,fill:f.fill,edge:b.edge,depth:f.v.reduce((sum,v)=>sum+project(...v).depth,0)/4}));
}
function drawLine(p1,p2,color='#385b74',lineWidth=1){const a=point(p1),b=point(p2);ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
function drawSceneBase(){
 const w=canvas.clientWidth,h=canvas.clientHeight;
 const grad=ctx.createLinearGradient(0,0,w,h);grad.addColorStop(0,'#102d46');grad.addColorStop(.5,'#0d1e33');grad.addColorStop(1,'#12192e');ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
 const glow=ctx.createRadialGradient(w*.48,h*.45,0,w*.48,h*.45,w*.56);glow.addColorStop(0,'#225c6a46');glow.addColorStop(1,'#08122300');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 for(let i=-22;i<=22;i+=2){drawLine([i,-.85,-18],[i,-.85,18],'#5d92ae14',.8);drawLine([-20,-.85,i],[20,-.85,i],'#5d92ae14',.8);}
 // Ground shadow beneath the model.
 quad([[-15,-.85,-10],[15,-.85,-10],[15,-.85,10],[-15,-.85,10]],'#071526',null,.58);
}
function drawOccupiedBeds(snapshot){
 const seen={};
 for(const b of bedLocations){
  const idx=seen[b.roomId]||0;seen[b.roomId]=idx+1;
  const occupied=idx<(snapshot.counts[b.roomId]||0);if(!occupied)continue;
  // Occupancy is read from the twin's active resource state, not a decorative random flag.
  const c=b.roomId==='icu'?'#ffb1c4':b.roomId==='care'?'#bde6ff':'#83f3dc';
  quad([[b.x+.18,.87,b.z+.8],[b.x+1.49,.87,b.z+.8],[b.x+1.49,.87,b.z+1.9],[b.x+.18,.87,b.z+1.9]],rgba(c,.78),rgba(c,.90));
  const center=project(b.x+1.46,1.04,b.z+.35);
  ctx.save();ctx.shadowColor=c;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(center.x,center.y,3.7,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();ctx.restore();
 }
}
function drawLabels(snapshot){
 const groups={arrival:snapshot.arrivalsLastHour,triage:snapshot.counts.triage,care:snapshot.counts.care,triageQueue:snapshot.counts.triageQueue,observation:snapshot.counts.observation,icu:snapshot.counts.icu};
 for(const r of roomDefs){
  const p=project(r.x+r.w*.15,1.67,r.z+r.d*(r.id==='arrival'?.77:.30));
  const x=p.x,y=p.y;
  if(x<-180||x>canvas.clientWidth+100||y<-80||y>canvas.clientHeight+90)continue;
  ctx.save();ctx.textAlign='left';ctx.font='800 10px system-ui, sans-serif';const tw=ctx.measureText(r.name).width;
  const pillW=Math.max(125,tw+48);const ph=37;
  ctx.shadowColor=rgba(r.color,.23);ctx.shadowBlur=12;
  ctx.fillStyle='rgba(12,30,47,.94)';roundRect(x-3,y-22,pillW,ph,8,true);
  ctx.shadowBlur=0;ctx.strokeStyle=rgba(r.color,.63);roundRect(x-3,y-22,pillW,ph,8,false,true);
  ctx.fillStyle=r.color;ctx.fillRect(x+5,y-11,3,16);
  ctx.fillStyle='#eef8ff';ctx.fillText(r.name,x+16,y-7);
  ctx.fillStyle='#a2b6ca';ctx.font='9px system-ui,sans-serif';ctx.fillText(r.sub,x+16,y+8);
  ctx.textAlign='center';ctx.fillStyle=r.color;ctx.font='800 12px system-ui,sans-serif';ctx.fillText(String(groups[r.id]),x+pillW-17,y+1);
  ctx.restore();
 }
}
function roundRect(x,y,w,h,r,fill=false,stroke=false){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill)ctx.fill();if(stroke)ctx.stroke();}
function drawPatient(p,position,now){
 const {x,y,z}=position;
 const foot=project(x,.26,z),head=project(x,1.17,z),size=clamp3(foot.scale*.22,3.8,8.7);
 const color=palette[p.severity];
 ctx.save();
 ctx.fillStyle='#02091777';ctx.beginPath();ctx.ellipse(foot.x+3,foot.y+2,size*.95,size*.40,0,0,Math.PI*2);ctx.fill();
 // Walkable 3D patient agent: vertical body from floor to head with sphere-like shaded head.
 ctx.lineCap='round';ctx.lineWidth=size*.82;ctx.strokeStyle=shade(color,-52);ctx.beginPath();ctx.moveTo(foot.x,foot.y-size*.2);ctx.lineTo(head.x,head.y+size*.60);ctx.stroke();
 ctx.lineWidth=size*.42;ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(foot.x,foot.y-size*.2);ctx.lineTo(head.x,head.y+size*.65);ctx.stroke();
 const halo=ctx.createRadialGradient(head.x-size*.2,head.y-size*.2,0,head.x,head.y,size*2);
 halo.addColorStop(0,rgba(color,.45));halo.addColorStop(1,rgba(color,0));ctx.fillStyle=halo;ctx.beginPath();ctx.arc(head.x,head.y,size*2,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=color;ctx.strokeStyle='#12263b';ctx.lineWidth=1.7;ctx.beginPath();ctx.arc(head.x,head.y,size*.82,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.fillStyle='rgba(255,255,255,.62)';ctx.beginPath();ctx.arc(head.x-size*.26,head.y-size*.28,size*.22,0,Math.PI*2);ctx.fill();
 if(p.id===selected3dId){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(head.x,head.y,size*1.75+Math.sin(now/220)*2,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
 if(p.id===mouse.hover||p.id===selected3dId){
   const txt=`#${p.id} · P${p.severity}`;ctx.font='700 11px system-ui';let width=ctx.measureText(txt).width+18;
   ctx.fillStyle='#102337';ctx.strokeStyle=color;roundRect(head.x-width/2,head.y-37,width,24,6,true,true);
   ctx.fillStyle='#eafaff';ctx.fillText(txt,head.x-width/2+9,head.y-21);
 }
 hitTargets.push({id:p.id,x:head.x,y:head.y,r:Math.max(13,size*1.65)});
 ctx.restore();
}
let selected3dId=null, cachedPositions=[],initialPositionsReady=false;
function positionFor(stage,index){
 const slots={
  triageQueue:()=>({x:-13.2+(index%4)*1.36,z:3.1+Math.floor(index/4)*.92}),
  triage:()=>({x:-7.55+(index%5)*1.15,z:-7.65+Math.floor(index/5)*1.1}),
  careQueue:()=>({x:.65+(index%10)*1.2,z:-1.75+Math.floor(index/10)*.38}),
  care:()=>({x:.72+(index%9)*1.45,z:-7.05+Math.floor(index/9)*1.14}),
  observation:()=>({x:-6.35+(index%6)*1.36,z:3.1+Math.floor(index/6)*1.32}),
  icuQueue:()=>({x:4.0+(index%9)*1.05,z:1.05+Math.floor(index/9)*.43}),
  icu:()=>({x:3.85+(index%7)*1.31,z:3.45+Math.floor(index/7)*1.18})};
 const fn=slots[stage];return fn?fn():null;
}
function refreshPatientPositions(){
 if(!sceneTwin)return;
 const counts={},alive=new Set();cachedPositions=[];
 for(const p of sceneTwin.patients){
  if(p.status==='discharged')continue;
  const index=counts[p.status]||0;counts[p.status]=index+1;
  const pos=positionFor(p.status,index);
  if(!pos)continue;
  alive.add(p.id);
  let agent=animation.get(p.id);
  if(!agent){agent={x:initialPositionsReady? -11.0:pos.x,z:initialPositionsReady?10.0:pos.z,tx:pos.x,tz:pos.z};animation.set(p.id,agent);}
  agent.tx=pos.x;agent.tz=pos.z;
  cachedPositions.push({p,agent});
 }
 initialPositionsReady=true;
 for(const id of animation.keys())if(!alive.has(id))animation.delete(id);
 if(selected3dId!==null&&!alive.has(selected3dId))selected3dId=null;
}
function drawHeader(s){
 const w=canvas.clientWidth;
 ctx.save();ctx.fillStyle='rgba(9,25,41,.85)';roundRect(16,14,Math.min(310,w-32),52,10,true);
 ctx.fillStyle='#62ecd1';ctx.beginPath();ctx.arc(31,33,4,0,Math.PI*2);ctx.fill();
 ctx.font='800 11px system-ui';ctx.fillStyle='#edf9ff';ctx.fillText('HOSPITAL DIGITAL TWIN · 3D',45,37);
 ctx.font='10px system-ui';ctx.fillStyle='#86a9be';ctx.fillText(`SYNTHETIC · ${s.active} PATIENTS · ${s.queue} QUEUED`,28,54);
 if(sceneTwin?.config?.surge>1){ctx.fillStyle='rgba(116,44,56,.90)';roundRect(w-165,16,150,36,8,true);ctx.font='800 11px system-ui';ctx.fillStyle='#ffc3c9';ctx.fillText('⚡ EMERGENCY SURGE',w-153,38);}
 ctx.restore();
}
function renderFrame(now){
 frame=requestAnimationFrame(renderFrame);
 if(!active || !canvas?.isConnected || !sceneTwin)return;
 if(now - renderFrame.last<27)return;renderFrame.last=now;
 const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
 ctx.clearRect(0,0,w,h);drawSceneBase();
 const structure=[], bases=[], floors=[];
 for(const b of staticItems){
   const dest=b.y<0?bases:(b.y===.02||b.y===.025)?floors:structure;
   dest.push(...boxFaces(b));
 }
 for(const layer of [bases,floors,structure]){
   layer.sort((a,b)=>a.depth-b.depth);
   for(const face of layer)quad(face.v,face.fill,face.edge);
 }
 drawOccupiedBeds(sceneTwin.getSnapshot());
 hitTargets.length=0;
 // Draw patients in camera-depth order, with the same agent IDs as the simulator.
 const ordered=cachedPositions.map(({p,agent})=>{
  agent.x+=(agent.tx-agent.x)*.16;agent.z+=(agent.tz-agent.z)*.16;
  return {p,agent,depth:project(agent.x,.5,agent.z).depth};
 }).sort((a,b)=>a.depth-b.depth);
 for(const {p,agent} of ordered){
  if(filterCritical&&p.severity>2)continue;
  drawPatient(p,{x:agent.x,y:0,z:agent.z},now);
 }
 drawLabels(sceneTwin.getSnapshot());drawHeader(sceneTwin.getSnapshot());
}
renderFrame.last=0;
function resize(){if(!canvas)return;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
 const dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
}
function choosePatient(ev){const box=canvas.getBoundingClientRect(),x=ev.clientX-box.left,y=ev.clientY-box.top;
 const match=hitTargets.slice().reverse().find(p=>Math.hypot(x-p.x,y-p.y)<=p.r);
 return match?.id??null;
}
function setPreset(name){
 if(name==='top'){camera.yaw=.08;camera.pitch=1.55;camera.zoom=1.05;}
 else if(name==='side'){camera.yaw=-.65;camera.pitch=.68;camera.zoom=1;}
 else {camera.yaw=.66;camera.pitch=.82;camera.zoom=1;}
 camera.panX=0;camera.panY=14;
 for(const btn of document.querySelectorAll('[data-view3d]'))btn.classList.toggle('active',btn.dataset.view3d===name);
}
export function initTwin3D({onPatientSelect}={}){
 host=document.getElementById('twin3dHost');canvas=document.getElementById('twin3dCanvas');if(!canvas||!host)return;
 ctx=canvas.getContext('2d',{alpha:false});onSelect=onPatientSelect||onSelect;
 initGeometry();resize();resizeObserver=new ResizeObserver(resize);resizeObserver.observe(canvas);
 canvas.addEventListener('pointerdown',e=>{mouse.down=true;mouse.moved=false;mouse.x=e.clientX;mouse.y=e.clientY;canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{
  if(mouse.down){const dx=e.clientX-mouse.x,dy=e.clientY-mouse.y;if(Math.abs(dx)+Math.abs(dy)>1)mouse.moved=true;
   camera.yaw+=dx*.007;camera.pitch=clamp3(camera.pitch+dy*.005,.35,1.56);mouse.x=e.clientX;mouse.y=e.clientY;
  } else {mouse.hover=choosePatient(e);canvas.style.cursor=mouse.hover?'pointer':'grab';}
 });
 canvas.addEventListener('pointerup',e=>{if(!mouse.moved){const id=choosePatient(e);if(id!==null){selected3dId=id;onSelect(id);}}mouse.down=false;});
 canvas.addEventListener('pointercancel',()=>{mouse.down=false;});
 canvas.addEventListener('wheel',e=>{e.preventDefault();camera.zoom=clamp3(camera.zoom*Math.exp(-e.deltaY*.001),.65,2.15);},{passive:false});
 canvas.addEventListener('keydown',e=>{if(['+','='].includes(e.key)){camera.zoom=clamp3(camera.zoom*1.15,.65,2.15);}if(e.key==='-')camera.zoom=clamp3(camera.zoom/1.15,.65,2.15);});
 document.querySelectorAll('[data-view3d]').forEach(btn=>btn.addEventListener('click',()=>setPreset(btn.dataset.view3d)));
 document.getElementById('view3dPlus')?.addEventListener('click',()=>{camera.zoom=clamp3(camera.zoom*1.18,.65,2.15)});
 document.getElementById('view3dMinus')?.addEventListener('click',()=>{camera.zoom=clamp3(camera.zoom/1.18,.65,2.15)});
 document.getElementById('view3dReset')?.addEventListener('click',()=>setPreset('iso'));
 setPreset('iso');if(!frame)frame=requestAnimationFrame(renderFrame);
}
export function setTwin3DActive(value){active=Boolean(value);if(active)requestAnimationFrame(resize);}
export function updateTwin3D(twin){sceneTwin=twin;refreshPatientPositions();}
export function setTwin3DPatient(id){selected3dId=id;}
export function setTwin3DCriticalFilter(value){filterCritical=Boolean(value);}
export function getTwin3DState(){return {active,patients:cachedPositions.length,camera:{...camera},selected3dId};}
