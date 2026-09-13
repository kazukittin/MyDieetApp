const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('path').join(__dirname,'../app.js'),'utf8');
const names=['sameSavedValue','persistOutbox','restoreOutbox','queueSync','pushEntriesToCloud','pushEntriesToCloudNow','mergeCloudEntryRows','setSyncState'];
const parts=names.map(name=>{const start=source.search(new RegExp('^(?:async )?function '+name+'\\(','m'));const tail=source.slice(start); const end=tail.indexOf('\n}\n');return tail.slice(0,end+2)}).join('\n');
function context(){const c=vm.createContext({console, document:{querySelector(){return null}}, navigator:{onLine:true}, localStorage:{data:new Map(),setItem(k,v){this.data.set(k,v)},getItem(k){return this.data.get(k)||null}}, getUserStorageKey:k=>'u:'+k,getCloudErrorMessage:e=>e.message,setCloudFeedback(){}, normalizeEntryWeights:e=>e});vm.runInContext(`let activeUser={id:'u'},entries=[],deletedEntries={},profile={},exercisePresets=[],foodPresets=[],appliedPresetSeedVersion=1,settingsUpdatedAt='2026-09-13T00:00:00.000Z',settingsDirty=false;const dirtyEntryDates=new Set();const outboxStorageKey='outbox';let syncQueue=Promise.resolve(),syncError='',syncBusy=false,cloudVerified=false,localSaveError=false;let supabaseClient;const entriesCloudTable='entries',settingsCloudTable='settings';const syncStatus={},assistantSyncStatus={},pendingSyncCount={},assistantPendingSyncCount={},cloudFeedback=null;${parts}`,c);return c}
const run=(c,s)=>vm.runInContext(s,c);
(async()=>{
let c=context();run(c,`entries=[{date:'2026-09-13',weight:60,updatedAt:'2026-09-13T00:00:00.000Z'}];dirtyEntryDates.add('2026-09-13');persistOutbox();entries=[];dirtyEntryDates.clear();restoreOutbox();`);assert.equal(run(c,'entries[0].weight'),60);assert.equal(run(c,'dirtyEntryDates.size'),1);
run(c,`mergeCloudEntryRows([{entry_date:'2026-09-13',payload:{weight:80},updated_at:'2026-09-14T00:00:00Z'}]);`);assert.equal(run(c,'entries[0].weight'),60);
run(c,`supabaseClient={from(){return {upsert(rows){return {async select(){entries[0]={...entries[0],weight:61};return {data:rows}}}}}}};`);await run(c,'pushEntriesToCloud()');assert.equal(run(c,'dirtyEntryDates.size'),1);assert.equal(run(c,'entries[0].weight'),61);
run(c,`supabaseClient={from(){return {upsert(rows){return {async select(){return {data:rows}}}}}}};`);await run(c,'pushEntriesToCloud()');assert.equal(run(c,'dirtyEntryDates.size'),0);assert.equal(run(c,'assistantSyncStatus.textContent'),'クラウド同期済み');
c=context();run(c,`entries=[{date:'d',weight:60,updatedAt:'2026-09-13T00:00:00.000Z'}];dirtyEntryDates.add('d');supabaseClient={from(){return {upsert(){return {async select(){return {error:new Error('通信エラー')}}}}}}};`);await assert.rejects(run(c,'pushEntriesToCloud()'));run(c,'setSyncState("同期済み")');assert.equal(run(c,'assistantSyncStatus.textContent'),'同期失敗・再試行できます');assert.equal(run(c,'dirtyEntryDates.size'),1);
run(c,`entries=[];dirtyEntryDates.clear();restoreOutbox();`);assert.equal(run(c,'entries[0].weight'),60);
run(c,`supabaseClient={from(){return {upsert(){return {async select(){return {data:[{entry_date:'d',payload:{weight:90},updated_at:'2026-09-14T00:00:00Z'}]}}}}}}};`);await assert.rejects(run(c,'pushEntriesToCloud()'));assert.equal(run(c,'dirtyEntryDates.size'),1);
c=context();run(c,`localStorage.setItem=()=>{throw new Error('quota')};`);assert.throws(()=>run(c,'persistOutbox()'));assert.equal(run(c,'assistantSyncStatus.textContent'),'端末への保存に失敗');
c=context();run(c,`navigator.onLine=false;dirtyEntryDates.add('d');`);await run(c,'pushEntriesToCloud()');assert.equal(run(c,'assistantSyncStatus.textContent'),'端末保存済み・オフライン');
console.log('PASS: recovery, pending protection, save during request, successful acknowledgement, network failure, conflict, storage failure, offline status');
})().catch(e=>{console.error(e);process.exitCode=1});


