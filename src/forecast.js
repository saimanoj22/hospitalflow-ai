/** Linear harmonic regression fitted on SYNTHETIC hourly arrivals. */
export function features(hour,weekday) {
  return [1,Math.sin(2*Math.PI*hour/24),Math.cos(2*Math.PI*hour/24),
    Math.sin(4*Math.PI*hour/24),Math.cos(4*Math.PI*hour/24),weekday>=5?1:0];
}
export function predictHour(model,hour,weekday=1,scale=1) {
  const f=features(((hour%24)+24)%24,weekday);
  return Math.max(1,f.reduce((sum,x,i)=>sum+x*model.weights[i],0)*scale);
}
export function forecastSeries(model,config,startHour=8,weekday=1,horizon=24) {
  return Array.from({length:horizon},(_,i)=>{
    const hour=(startHour+i)%24;
    return {hour,label:`${String(hour).padStart(2,'0')}:00`,
      predicted:predictHour(model,hour,(weekday+Math.floor((startHour+i)/24))%7,
      (config.arrivalsPerHour/17)*config.surge)};
  });
}
