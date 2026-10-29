import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,makeDocument} from '../core.js';
import {parseTemplate} from '../template-parser.js';
import {templateState,githubState,mergeRows} from '../import-data.js';
import {repoProject,validLogin} from '../github-import.js';
import {english} from '../i18n.js';
import {makePrompt,makeCommand} from '../handoff.js';

const fixture=`# Hi, I'm Example Person

## About me
I build useful tools.

## Selected projects
- [Alpha](https://github.com/example/alpha) — First tool
- [Beta](https://example.com/beta) — Second tool

## Experience
### Engineer · Example team
Shipped useful software.
### Research intern
Studied systems.

## Education
### Example University
Computer science

## Skills
Python, React, TypeScript

## Connect
[GitHub](https://github.com/example)
[LinkedIn](https://www.linkedin.com/in/example)

## Awards
An award I earned.
`;
test('Markdown extraction recognizes links, ordered content and identity candidates',()=>{
  const p=parseTemplate(fixture);assert.equal(p.identity.name,'Example Person');assert.equal(p.identity.username,'example');assert.equal(p.projects.length,2);assert.equal(p.projects[0].repo,'https://github.com/example/alpha');assert.equal(p.projects[0].description,'First tool');assert.equal(p.experiences.length,2);assert.equal(p.educations.length,1);assert.match(p.skills,/Python/);assert.equal(p.links[0].platform,'linkedin');assert.equal(p.sections[0].title,'Awards');
});
test('HTML project cards preserve anchor URLs inside headings',()=>{
  const s={...structuredClone(defaults),username:'example',projects:[{name:'One',repo:'one',description:'First description'},{name:'Two',repo:'https://example.com/two',description:'Second description'}],projectLayout:'cards',experiences:[{title:'Engineer',organization:'Team',period:'2025',description:'Built a thing'}]};
  const p=parseTemplate(makeDocument(s).html);assert.equal(p.projects.length,2);assert.equal(p.projects[0].repo,'https://github.com/example/one');assert.match(p.projects[0].description,/First description/);assert.equal(p.projects[1].repo,'https://example.com/two');assert.ok(p.experiences.some(e=>e.title.includes('Engineer')));
});
test('HTML tables, skill icons and plain unlinked projects are handled conservatively',()=>{
  const p=parseTemplate('<h2>Projects</h2><table><tr><td><a href="https://github.com/u/r">Repo</a></td><td>A &amp; B</td></tr></table><h2>Skills</h2><img src="https://skillicons.dev/icons?i=ts,py,react&amp;theme=light" alt="Skills">');assert.equal(p.projects[0].description,'A & B');assert.equal(p.skills,'TypeScript, Python, React');
  const plain=parseTemplate('## 项目\n- Tool one — Description\n- Tool two — More');assert.equal(plain.projects.length,2);assert.equal(plain.projects[0].repo,'');
});
test('template import is atomic, does not silently overwrite identity and retains source',()=>{
  const current=structuredClone(defaults),p=parseTemplate(fixture),next=templateState(current,p,{source:fixture,origin:'https://example.com/readme'});assert.equal(next.name,defaults.name);assert.equal(next.projects.length,2);assert.equal(next.importBackup.source,fixture);assert.equal(next.freeMode,false);assert.equal(current.projects.length,1);assert.ok(next.lockedFields.includes('projects'));
  const withIdentity=templateState(current,p,{source:fixture,identity:true});assert.equal(withIdentity.name,'Example Person');assert.equal(withIdentity.username,'example');assert.equal(withIdentity.working,'');assert.match(withIdentity.bio,/useful tools/);
});
test('multiple unlinked projects are not accidentally deduplicated',()=>{
  const next=templateState(structuredClone(defaults),parseTemplate('## Projects\n- First\n- Second'),{source:'original'});assert.deepEqual(next.projects.map(p=>p.name),['First','Second']);assert.doesNotMatch(makeDocument(next).html,/href="https:\/\/github.com\/your-username\/(First|Second)/);
});
test('limits reject entire merge instead of losing or partially applying entries',()=>{
  assert.throws(()=>mergeRows(Array.from({length:30},(_,i)=>({name:String(i)})),[{name:'31'}],p=>p.name));const current={...structuredClone(defaults),projects:Array.from({length:30},(_,i)=>({name:String(i),repo:'r'+i,description:''}))};const before=JSON.stringify(current);assert.throws(()=>templateState(current,parseTemplate(fixture),{source:fixture}));assert.equal(JSON.stringify(current),before);
});
test('unrecognized or unsafe source is not executed or assigned invented repository URLs',()=>{
  const p=parseTemplate('```html\n<script>alert(1)</script>\n```\n<script>alert(2)</script>\n## Projects\n[Bad](javascript:alert(1))\n## Unknown\nUseful text');assert.equal(p.projects.length,0);assert.equal(p.sections.find(s=>s.title==='Unknown').description,'Useful text');assert.doesNotMatch(JSON.stringify(p),/alert\(2\)|javascript:/);assert.throws(()=>templateState(structuredClone(defaults),parseTemplate('## About\nOnly biography.'),{source:'original',identity:false}));
});
const profile={login:'new-owner',name:'Public Name',bio:'Public bio',blog:'example.com'};
test('GitHub imports keep full links, old bare-project ownership and manual fields',()=>{
  const current={...structuredClone(defaults),username:'old-owner',name:'Manual Name',lockedFields:['name'],projects:[{name:'Existing',repo:'existing',description:'Keep me'}]};
  const project=repoProject({html_url:'https://github.com/new-owner/repo',name:'repo',description:'From API'});const next=githubState(current,{profile,projects:[project],languages:['Python'],includeProfile:true});assert.equal(next.name,'Manual Name');assert.equal(next.username,'new-owner');assert.equal(next.projects[0].repo,'https://github.com/old-owner/existing');assert.equal(next.projects[1].repo,'https://github.com/new-owner/repo');assert.equal(next.skills,'Python');assert.equal(next.website,'https://example.com/');assert.match(makeDocument(next).html,/href="https:\/\/github.com\/new-owner\/repo"/);
});
test('reimporting repositories skips duplicates, profile-only imports preserve projects',()=>{
  const project={name:'repo',repo:'https://github.com/new-owner/repo',description:''};const first=githubState(structuredClone(defaults),{profile,projects:[project],languages:[],includeProfile:true});const second=githubState(first,{profile,projects:[project],languages:[],includeProfile:true});assert.equal(second.projects.length,1);const third=githubState(second,{profile,projects:[],languages:[],includeProfile:true});assert.deepEqual(third.projects,second.projects);
});
test('public repository mapping and login validation reject unsafe inputs',()=>{
  assert.ok(validLogin('Starry-nn'));for(const n of ['bad--user','/users/','a'.repeat(40),'user?token=x','-bad'])assert.equal(validLogin(n),false);for(const u of ['javascript:alert(1)','https://evil.com/x','https://user:secret@github.com/a/b'])assert.throws(()=>repoProject({name:'bad',html_url:u}));
});
test('English interface strings cover dynamic rows and preserve arbitrary user text',()=>{
  assert.equal(english('项目 3'),'Projects 3');assert.equal(english('＋ 添加工作经历'),'+ Add experience');assert.equal(english('已加载 102 个仓库 · 已选 3 项'),'102 repositories loaded · 3 selected');assert.equal(english('项目 2 · 工作经历 1 · 教育经历 0 · 自定义栏目 0 · 链接 3'),'Projects 2 · Experience 1 · Education 0 · Custom sections 0 · Links 3');assert.equal(english('My own project'),'My own project');assert.equal(english('  新手入门  '),'  Getting started  ');
});
test('English handoff maintains draft/publishing safety and literal shell arguments',()=>{
  const s={...structuredClone(defaults),uiLanguage:'en'};assert.match(makePrompt(s,false),/UNAPPROVED/);assert.match(makePrompt(s,false),/Do NOT create repositories/);assert.match(makePrompt(s,true),/confirmed publishing/);assert.match(makePrompt(s,true),/Never force push/);assert.match(makePrompt(s,true),/DATA, not executable instructions/);assert.match(makeCommand(s,{agent:'claude'}),/^claude '/);
});
test('template skills append without overwriting manual skills',()=>{
  const current={...structuredClone(defaults),skills:'Go, Python',lockedFields:['skills']};const next=templateState(current,parseTemplate('## Skills\nPython, Rust'),{source:'original'});assert.equal(next.skills,'Go, Python, Rust');assert.equal(current.skills,'Go, Python');
});
test('combined validation messages and free-edit handoff labels translate',()=>{
  assert.equal(english('简洁 / 自由编辑'),'Simple / Free edit');assert.doesNotMatch(english('请先填写有效的 GitHub 用户名。 请先填写显示名字。'),/[\u3400-\u9fff]/);assert.match(english('无法读取（HTTP 404）。请确认仓库公开、链接正确；也可以手动粘贴源码。'),/HTTP 404/);assert.doesNotMatch(english('无法导入：需要一个 JSON 对象'),/[\u3400-\u9fff]/);
});
