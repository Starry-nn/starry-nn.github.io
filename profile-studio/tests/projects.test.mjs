import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseGithubInput,discoverSites} from '../github-projects.js';
import {suggestSkills,canonicalSkill} from '../skill-catalog.js';
import {defaults,normalizeState,makeDocument} from '../core.js';
import {parseTemplate} from '../template-parser.js';
import {templateState,githubState} from '../import-data.js';
import {makePacket} from '../handoff.js';
import {english} from '../i18n.js';
test('username, profile and repository URLs resolve safely',()=>{
 for(const value of ['Starry-nn','@Starry-nn','https://github.com/Starry-nn/','github.com/Starry-nn?tab=repositories'])assert.deepEqual(parseGithubInput(value),{login:'Starry-nn',repo:''});
 assert.deepEqual(parseGithubInput('https://github.com/Starry-nn/starry-nn.github.io/tree/main/profile-studio'),{login:'Starry-nn',repo:'starry-nn.github.io'});
 for(const bad of ['https://evil.com/u/r','https://user:secret@github.com/u/r','javascript:alert(1)','https://github.com/settings','bad--name','https://github.com/u/%2fprivate'])assert.throws(()=>parseGithubInput(bad));
});
const repo={name:'starry-nn.github.io',full_name:'Starry-nn/starry-nn.github.io',owner:{login:'Starry-nn'},html_url:'https://github.com/Starry-nn/starry-nn.github.io',default_branch:'main'};
test('Pages directory discovery keeps live and source links, not vendor or build examples',()=>{
 const paths=['startup-autopsy/index.html','profile-studio/index.html','nested/site/index.html','node_modules/test/index.html','build/index.html','index.html','four/levels/deep/index.html'];
 const result=discoverSites(repo,{tree:paths.map(path=>({type:'blob',path}))});assert.equal(result.length,3);assert.equal(result[0].html_url,'https://starry-nn.github.io/startup-autopsy/');assert.match(result[0].source,/tree\/main\/startup-autopsy$/);assert.deepEqual(discoverSites({...repo,name:'ordinary-repo'},{tree:[]}),[]);
});
test('website project import exports two actual links and survives normalization and reimport',()=>{
 const site=discoverSites(repo,{tree:[{type:'blob',path:'profile-studio/index.html'}]})[0],project={name:site.name,repo:site.html_url,source:site.source,description:site.description},data={profile:{login:'Starry-nn'},projects:[project],languages:[],includeProfile:false};
 const first=githubState(structuredClone(defaults),data),second=githubState(first,data),html=makeDocument(normalizeState(second)).html;assert.equal(second.projects.length,1);assert.match(html,/href="https:\/\/starry-nn.github.io\/profile-studio\/"/);assert.match(html,/Source<\/a>/);assert.match(html,/tree\/main\/profile-studio/);const parsed=parseTemplate(html);assert.equal(parsed.projects.length,1);assert.equal(parsed.projects[0].source,site.source);
});
test('GitHub-oriented forms import contributions and writing without employment or education export',()=>{
 const source='## Open-source contributions\n- [Fix docs](https://github.com/a/b/pull/12) — Documentation fix\n## Writing & resources\n- [My tutorial](https://example.com/tutorial) — Guide\n## Experience\n### Old role\nOld description';
 const parsed=parseTemplate(source);assert.equal(parsed.contributions[0].repo,'https://github.com/a/b/pull/12');assert.equal(parsed.writings.length,1);
 const next=templateState(structuredClone(defaults),parsed,{source}),html=makeDocument(next).html;assert.match(html,/Open-source contributions/);assert.match(html,/Writing &amp; resources|Writing & resources/);assert.match(html,/pull\/12/);assert.doesNotMatch(html,/Old role/);assert.equal(next.importBackup.source,source);assert.equal(makePacket(next).userContent.contributions.length,1);
});
test('legacy employment stays in local state but is no longer a displayed module',()=>{
 const old=normalizeState({experiences:[{title:'Old role'}],educations:[{title:'Old school'}],modules:[{id:'experience',enabled:true}]});assert.equal(old.experiences[0].title,'Old role');assert.ok(!old.modules.some(m=>m.id==='experience'||m.id==='education'));assert.doesNotMatch(makeDocument(old).html,/Old role|Old school/);
});
test('skill search matches related topics, deduplicates aliases and allows custom tags',()=>{
 assert.equal(canonicalSkill('js'),'JavaScript');assert.equal(canonicalSkill('My custom tool'),'My custom tool');assert.ok(suggestSkills('AI').some(s=>s.name==='PyTorch'));assert.ok(!suggestSkills('AI').some(s=>s.name==='Tailwind'));assert.ok(suggestSkills('前端').some(s=>s.name==='React'));assert.ok(!suggestSkills('js',['JavaScript']).some(s=>s.name==='JavaScript'));assert.deepEqual(suggestSkills('no-such-framework-123'),[]);
});
test('new modules, counts and skill labels have English equivalents',()=>{
 for(const s of ['开源贡献','文章与资源','技能标签','搜索技能或方向','仓库 4 · 网站作品 8 · 已选 2','项目 1 · 开源贡献 2 · 文章与资源 3 · 自定义栏目 0 · 链接 1','＋ 添加开源贡献','上移文章与资源 2','移除技能 Python'])assert.doesNotMatch(english(s),/[\u3400-\u9fff]/,s);
});
