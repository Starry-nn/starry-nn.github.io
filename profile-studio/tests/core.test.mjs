import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaults, templates, makeDocument, normalizeState, makeSkills, getSources } from '../core.js';

test('every layout exports the preview body and its actual external URLs', () => {
  const outputs = templates.map(t => makeDocument({...structuredClone(defaults), header:t.header, skillStyle:t.skillStyle, alignment:t.alignment, projectLayout:t.projectLayout, aboutLayout:t.aboutLayout||'plain', template:t.id}));
  assert.equal(new Set(outputs.map(o => o.html)).size, templates.length);
  outputs.forEach(o => {
    assert.ok(o.markdown.startsWith(o.html));
    assert.doesNotMatch(o.markdown, /<script|\sstyle="|<style/);
    assert.match(o.markdown, /https:\/\/github.com\/Starry-nn\/startup-autopsy/);
  });
  assert.match(outputs[2].markdown, /capsule-render.vercel.app\/api/);
  assert.match(outputs[3].markdown, /readme-typing-svg.demolab.com/);
  assert.match(outputs[4].markdown, /img.shields.io/);
});

test('user content cannot inject markup, scripts, or unsafe contact links', () => {
  const s = {...structuredClone(defaults), name:'<img src=x onerror=alert(1)>', website:'javascript:alert(1)', username:'user/evil"', bio:'<script>alert(1)</script>', tagline:'a & b', projects:[{name:'</a><script>',repo:'x" onmouseover="alert(1)',description:'<img onerror=alert(1)>'}]};
  const {html} = makeDocument(s);
  assert.doesNotMatch(html, /<script|<img|javascript:|href="[^"]*" onmouseover/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /a &amp; b/);
  assert.match(html, /github.com\/userevil\//);
});

test('unknown skills are preserved as text while known icons are deduplicated', () => {
  const s = {...structuredClone(defaults),skillStyle:'icons',skills:'TypeScript, ts, Python, AI workflows'};
  const html=makeSkills(s);
  assert.match(html,/i=ts,py&amp;/);
  assert.match(html,/<code>AI workflows<\/code>/);
});

test('hidden and reordered sections affect export; unused resources have no attribution', () => {
  const s=structuredClone(defaults);
  s.header='capsule'; s.skillStyle='icons';
  s.modules=[{id:'contact',name:'联系方式',enabled:true},{id:'skills',name:'技能',enabled:false},{id:'projects',name:'精选项目',enabled:false},{id:'about',name:'关于我',enabled:true}];
  const {html}=makeDocument(s);
  assert.doesNotMatch(html,/Selected projects|skillicons/);
  assert.ok(html.indexOf('Find me elsewhere') < html.indexOf('Currently:'));
  assert.deepEqual(getSources(s), ['capsule']);
});

test('migration repairs duplicate/unknown modules and invalid modes', () => {
  const s=normalizeState({template:'editorial',header:'<script>',skillStyle:'oops',name:'Saved name',modules:[{id:'skills',enabled:false},{id:'skills'},{id:'unexpected'}],projects:[null,{name:'Mine',repo:'mine'}]});
  assert.equal(s.template,'simple');
  assert.equal(s.name,'Saved name');
  assert.equal(s.header,'plain');
  assert.equal(s.modules.length,4);
  assert.equal(s.modules[0].enabled,false);
  assert.equal(s.projects.length,1);
});
