/** Responsive inline SVG charts: no CDN, no charting dependency. */
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function makePath(items,xScale,yScale,key) {
  return items.map((d,i)=>`${i===0?'M':'L'}${xScale(i).toFixed(2)},${yScale(d[key]||0).toFixed(2)}`).join(' ');
}
export function lineChart(series,{label='',secondary=null,color='#5be0c6',secondaryColor='#aa94fa',height=250,unit='',axisLabels=null}={}) {
  const w=900,h=height,L=43,R=16,T=13,B=35;
  if(!series.length)return `<div class="empty-visual">Waiting for simulation observations…</div>`;
  const values=series.flatMap(d=>[Number(d.value)||0,...(secondary?[Number(d.secondary)||0]:[])]);
  const maxVal=Math.max(1,Math.ceil(Math.max(...values)*1.19));
  const span=w-L-R;
  const xx=i=>L+span*(series.length===1?.5:i/(series.length-1));
  const yy=v=>T+(h-T-B)*(1-v/maxVal);
  const p=makePath(series,xx,yy,'value');
  const second=secondary?makePath(series,xx,yy,'secondary'):'';
  const grid=Array.from({length:5},(_,i)=>{
    const val=maxVal*(4-i)/4,y=yy(val);
    return `<line x1="${L}" x2="${w-R}" y1="${y}" y2="${y}" stroke="#30415a" stroke-opacity=".62" stroke-dasharray="3 6"/><text x="${L-12}" y="${y+4}" text-anchor="end" font-size="10" fill="#7890a9">${Number(val.toFixed(0))}${i===0&&unit==='%'?'%':''}</text>`;
  }).join('');
  const ticks=Array.from({length:6},(_,i)=>{
    const idx=Math.floor(i*(series.length-1)/5), item=series[idx];
    let tick=axisLabels?axisLabels(item,idx):`${Math.round((idx+1)*10/60)}h`;
    return `<text x="${xx(idx)}" y="${h-9}" text-anchor="middle" font-size="10" fill="#8196b0">${esc(tick)}</text>`;
  }).join('');
  const area=`${p} L${xx(series.length-1)},${h-B} L${xx(0)},${h-B} Z`;
  const last=series.length-1;
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}"><defs><linearGradient id="chartArea${secondary?'double':''}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${color}" stop-opacity=".23"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>${grid}<path d="${area}" fill="url(#chartArea${secondary?'double':''})"/><path d="${p}" stroke="${color}" stroke-width="2.7" fill="none" stroke-linejoin="round" stroke-linecap="round"/>${secondary?`<path d="${second}" stroke="${secondaryColor}" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`:''}<circle cx="${xx(last)}" cy="${yy(series[last].value||0)}" r="4" stroke="#0e1929" stroke-width="2" fill="${color}"/>${secondary?`<circle cx="${xx(last)}" cy="${yy(series[last].secondary||0)}" r="4" stroke="#0e1929" stroke-width="2" fill="${secondaryColor}"/>`:''}${ticks}</svg>`;
}
const zone=(x,y,label,num,caption,accent,count)=>{
 const dotCount=Math.min(9,Math.max(0,count||0));
 const dots=Array.from({length:dotCount},(_,i)=>{
  const cx=x+20+(i%5)*20,cy=y+113+Math.floor(i/5)*15;
  return `<circle class="map-zone-dot" cx="${cx}" cy="${cy}" r="3.1" fill="${accent}" style="animation-delay:${i*120}ms"/>`;
 }).join('');
 return `<g><rect class="map-zone-card" x="${x}" y="${y}" rx="10" width="178" height="148"/><path d="M${x+15} ${y+18}h17" stroke="${accent}" stroke-width="3" stroke-linecap="round"/><text class="map-zone-label" x="${x+16}" y="${y+42}">${esc(label)}</text><text class="map-zone-value" x="${x+16}" y="${y+76}">${num}</text><text class="map-zone-caption" x="${x+16}" y="${y+94}">${esc(caption)}</text>${dots}</g>`;
};
export function floorMap(snapshot,config){
 const c=snapshot.counts;
 const stages=[
  zone(14,46,'ARRIVALS',snapshot.arrivalsLastHour,'past 60 minutes','#75bcfa',snapshot.arrivalsLastHour),
  zone(245,46,'TRIAGE',c.triageQueue+c.triage,`${c.triageQueue} waiting · ${c.triage} being seen`,'#5be0c6',c.triageQueue+c.triage),
  zone(476,46,'TREATMENT',c.careQueue+c.care,`${c.careQueue} waiting · ${c.care} in care`,'#aa94fa',c.careQueue+c.care),
  zone(707,46,'OBSERVATION',c.observation,`simulated holding area`,'#ffb773',c.observation),
  zone(938,46,'DISCHARGED',c.discharged,`cumulative exits`,'#5be0c6',Math.min(9,c.discharged))
 ];
 const pathways=[[192,245],[423,476],[654,707],[885,938]];
 const lines=pathways.map(([a,b])=>`<path class="map-zone-line" d="M${a} 119H${b}"/><path class="map-zone-track" d="M${a} 119H${b}"/><path d="m${b-8} 114 8 5-8 5" stroke="#55738e" stroke-width="2" fill="none"/>`).join('');
 return `<svg viewBox="0 0 1130 338" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Department flow with ${snapshot.active} active patients and ${snapshot.queue} in queues"><defs><radialGradient id="icuFade"><stop stop-color="#20454d"/><stop offset="100%" stop-color="#162438"/></radialGradient></defs><text x="14" y="21" font-size="10" font-weight="700" fill="#7392a9" letter-spacing="1.5">VIRTUAL FACILITY • ED ZONE MAP</text>${lines}${stages.join('')}<path class="map-zone-line" d="M565 195V229H685"/><path class="map-zone-track" d="M565 195V229H685"/><path d="m678 224 8 5-8 5" fill="none" stroke="#597c89" stroke-width="2"/><rect x="692" y="217" rx="10" width="235" height="100" fill="url(#icuFade)" stroke="#32616b"/><rect x="711" y="236" width="6" height="6" rx="3" fill="#fb8e9d"/><text x="724" y="243" font-size="10" fill="#e5effa" font-weight="760" letter-spacing="1">CRITICAL / ICU</text><text x="711" y="282" font-size="28" fill="#fff" font-weight="800">${c.icu} <tspan font-size="12" fill="#94b5c2">/ ${config.icuBeds} beds</tspan></text><text x="711" y="301" font-size="9" fill="#91adbb">${c.icuQueue} awaiting ICU placement</text><g transform="translate(12,246)"><circle cx="8" cy="8" r="5" fill="#fd778a"/><text x="24" y="12" font-size="10" fill="#93a9c1">P1–P2 high acuity in system</text><text x="255" y="12" font-size="12" fill="#fb9cab" font-weight="800">${snapshot.critical}</text><circle cx="8" cy="32" r="5" fill="#5be0c6"/><text x="24" y="36" font-size="10" fill="#93a9c1">ICU bed use</text><text x="255" y="36" font-size="12" fill="#a8fff0" font-weight="800">${snapshot.icuOccupancy}%</text></g></svg>`;
}
