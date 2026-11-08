const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../app.js'), 'utf8').replace(/\r\n/g, '\n');
function setup(saved = {}) {
  const data = new Map(Object.entries(saved));
  const alerts = [];
  const localStorage = { get length() { return data.size; }, key: i => [...data.keys()][i], getItem: k => data.get(k) ?? null, setItem: (k,v) => data.set(k,v), removeItem: k => data.delete(k) };
  const c = vm.createContext({ localStorage, window: { alert: m => alerts.push(m) } });
  const names = ['migrateSingleUserData', 'getUserStorageKey', 'persistOutbox', 'restoreOutbox'];
  const parts = names.map(name => { const start = source.indexOf(`function ${name}(`); const end = source.indexOf('\n}\n', start); return source.slice(start, end + 2); }).join('\n');
  vm.runInContext(`const activeUser={id:'single-user'}; const storageKey='entries',profileStorageKey='profile',exercisePresetStorageKey='exercise',foodPresetStorageKey='food',presetSeedStorageKey='seed',deletedEntriesStorageKey='deleted',settingsUpdatedStorageKey='updated',outboxStorageKey='outbox';let entries=[],deletedEntries={},profile={},exercisePresets=[],foodPresets=[],appliedPresetSeedVersion=0,settingsUpdatedAt='',settingsDirty=false,localSaveError=false;const dirtyEntryDates=new Set();function setSyncState(){};${parts}`, c);
  return { c, data, alerts, run: s => vm.runInContext(s,c) };
}
test('copies one legacy account and pending writes without deleting originals', () => {
  const t = setup({ 'entries:old': '[{"date":"2026-11-08","weight":60}]', 'profile:old': '{"height":165}', 'outbox:old': '{"entries":[{"date":"2026-11-08","weight":61}]}' });
  t.run('migrateSingleUserData(); restoreOutbox()');
  assert.equal(t.run('entries[0].weight'),61);
  assert.equal(t.data.get('profile:single-user'),'{"height":165}');
  assert.ok(t.data.has('entries:old'));
  t.run('migrateSingleUserData()');
  assert.equal(t.alerts.length,0);
});
test('does not merge multiple accounts', () => {
  const t=setup({'entries:a':'[]','profile:b':'{}'}); t.run('migrateSingleUserData()');
  assert.equal(t.alerts.length,1); assert.equal(t.data.has('entries:single-user'),false);
});
test('recovers offline records and settings after reload', () => {
  const t=setup(); t.run(`entries=[{date:'2026-11-08',weight:62}];dirtyEntryDates.add('2026-11-08');profile={height:170};settingsDirty=true;persistOutbox();entries=[];profile={};restoreOutbox()`);
  assert.equal(t.run('entries[0].weight'),62);assert.equal(t.run('profile.height'),170);
});
test('reports storage failures instead of success', () => {
  const t=setup();t.c.localStorage.setItem=()=>{throw new Error('quota')};
  assert.throws(()=>t.run('persistOutbox()')); assert.equal(t.run('localSaveError'),true);
});
test('frontend has no authentication or remote database dependency', () => {
  const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
  assert.doesNotMatch(source,/supabase|signInWithPassword|initializeAuth/);
  assert.doesNotMatch(html,/auth-screen|@supabase|logout-button/);
});
