import test from 'node:test';
import assert from 'node:assert/strict';
import {HospitalTwin,STAGES} from '../src/simulator.js';

test('patient journeys record true timestamped state transitions',()=>{
  const t=new HospitalTwin().step(390);
  assert.ok(t.patients.length>35);
  for(const p of t.patients){
    assert.ok(Array.isArray(p.journey) && p.journey.length>=1);
    assert.deepEqual(p.journey[0],{stage:'triageQueue',minute:p.arrived});
    assert.equal(p.journey.at(-1).stage,p.status);
    for(let i=1;i<p.journey.length;i++){
      assert.ok(STAGES.includes(p.journey[i].stage));
      assert.ok(p.journey[i].minute >= p.journey[i-1].minute);
      assert.notEqual(p.journey[i].stage,p.journey[i-1].stage);
    }
  }
});

test('discharged patient trace ends with discharge timestamp',()=>{
  const t=new HospitalTwin().step(390);
  const discharged=t.patients.filter(p=>p.status==='discharged');
  assert.ok(discharged.length>1);
  for(const p of discharged){
    assert.equal(p.journey.at(-1).minute,p.dischargedAt);
    assert.equal(p.journey.at(-1).stage,'discharged');
  }
});
