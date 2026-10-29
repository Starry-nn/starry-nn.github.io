import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,normalizeState,makeDocument,socialURL} from '../core.js';
import {makePacket,manualExport} from '../handoff.js';
import {githubRawURL,checkTemplate} from '../community.js';

test('repeated modules survive migration and export well beyond two projects',()=>{
  const s=normalizeState({...defaults,username:'test-builder',name:'Test Builder',autoFill:false,projects:Array.from({length:12},(_,i)=>({name:'Project '+i,repo:'project-'+i,description:'Description'})),experiences:[{title:'Engineer',organization:'A & B',period:'2023–2025',description:'Shipped tools\nHelped users'}],educations:[{organization:'Example University',title:'Computer science'}],sections:[{title:'Awards',description:'My award'}],links:[{platform:'x',value:'@builder'}]});
  const out=makeDocument(s).markdown;
  assert.match(out,/Project 11/);assert.match(out,/Experience/);assert.match(out,/A &amp; B/);assert.match(out,/Example University/);assert.match(out,/Awards/);assert.match(out,/https:\/\/x.com\/builder/);
  assert.equal(makePacket(s).userContent.experiences[0].title,'Engineer');
  assert.deepEqual(manualExport(s).errors,[]);
  assert.equal(normalizeState({...s,projects:Array(31).fill(s.projects[0])}).projects.length,30);
});
test('empty optional modules disappear and unsafe social links never become anchors',()=>{
  const s=structuredClone(defaults);s.links=[{platform:'other',label:'Bad',value:'javascript:alert(1)'}];s.sections=[{title:'<script>',description:'<img onerror=x>'}];
  const out=makeDocument(s).markdown;assert.doesNotMatch(out,/<script|javascript:|<img|<h2>Experience|<h2>Education/);assert.match(out,/&lt;script&gt;/);
  assert.equal(socialURL({platform:'linkedin',value:'alex-builder'}),'https://www.linkedin.com/in/alex-builder');
  assert.equal(socialURL({platform:'scholar',value:'abc'}),'');
  assert.equal(socialURL({platform:'other',value:'https://user:secret@example.com'}),'');
});
test('neutral default retires only untouched legacy identity, not user edits',()=>{
  assert.doesNotMatch(JSON.stringify(defaults),/Nan Yao|Starry-nn|startup-autopsy/);
  const saved={name:'Nan Yao',username:'Starry-nn',projects:[{name:'Startup Autopsy',repo:'startup-autopsy'}]};
  assert.equal(normalizeState(saved).name,defaults.name);
  assert.equal(normalizeState({...saved,lockedFields:['name','username','projects']}).name,'Nan Yao');
  assert.equal(normalizeState({...saved,profileLoaded:true}).name,'Nan Yao');
  assert.ok(manualExport(defaults).errors.some(e=>e.includes('示例用户名')));
});
test('community URL import only reads public GitHub text without query secrets',()=>{
  assert.equal(githubRawURL('https://github.com/user/repo/blob/main/README.md?token=secret#x'),'https://raw.githubusercontent.com/user/repo/main/README.md');
  for(const url of ['http://github.com/u/r/blob/main/README.md','https://evil.com/README.md','https://github.com/u/r','https://raw.githubusercontent.com/u/r/main/private.png','https://user:password@raw.githubusercontent.com/u/r/main/README.md'])assert.throws(()=>githubRawURL(url));
  assert.throws(()=>checkTemplate(' '));assert.throws(()=>checkTemplate('字'.repeat(40000)));assert.throws(()=>checkTemplate('a\u0000'));
  assert.equal(checkTemplate('# Hello'),'# Hello');
});
