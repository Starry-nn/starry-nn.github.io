import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { defaults, templates } from '../core.js';
import { makePacket, makeCommand, makePrompt, exportMarkdown, quotePowerShell, manualExport, previewVariables } from '../handoff.js';
import { markdownToHTML } from '../markdown.js';

test('auto-fill exports explicit slots instead of sample identity and projects',()=>{
  const packet=makePacket(structuredClone(defaults));
  assert.equal(packet.authorization.approved,false);
  assert.equal(packet.identity.mode,'github-auto');
  assert.match(packet.readme,/\{\{GITHUB_LOGIN\}\}/);
  assert.match(packet.readme,/\{\{DISPLAY_NAME\}\}/);
  assert.match(packet.readme,/PROJECT_1_NAME/);
  assert.doesNotMatch(packet.readme,/Nan Yao|Starry-nn|startup-autopsy|TypeScript/);
});
test('explicit edits and manual mode are kept while untouched fields stay automatic',()=>{
  const state={...structuredClone(defaults),name:'Custom Name',lockedFields:['name']};
  assert.match(exportMarkdown(state),/Custom Name/);
  assert.match(exportMarkdown(state),/\{\{GITHUB_LOGIN\}\}/);
  state.autoFill=false;
  assert.doesNotMatch(exportMarkdown(state),/\{\{/);
  assert.ok(makePacket(state).identity.pinnedFields.includes('username'));
});
test('all template modes include encoded image tokens in Agent exports',()=>{
  const state={...structuredClone(defaults),header:'capsule'};
  const packet=makePacket(state,true);
  assert.equal(packet.authorization.approved,true);
  assert.match(packet.readme,/%7B%7BDISPLAY_NAME%7D%7D/);
  assert.ok(packet.sources.some(r=>r.name==='Capsule Render'));
  assert.equal(packet.target.path,'README.md');
});
test('generated POSIX commands pass hostile-looking text as one literal argument',()=>{
  const state={...structuredClone(defaults),autoFill:false,name:"O'Neil $(printf INJECTION) `printf BACKTICK`",freeMode:true,customMarkdown:"# Demo\n'; printf BAD; #\n$HOME $(printf BAD) `printf BAD`\n"};
  for(const agent of ['codex','claude']){
    const command=makeCommand(state,{agent,approved:true});
    assert.ok(!command.includes('\n'));
    const proc=spawnSync('/bin/sh',['-c',`${agent}() { printf '%s' "$1"; }\n${command}`],{encoding:'utf8',maxBuffer:1_000_000});
    assert.equal(proc.status,0,proc.stderr);
    assert.equal(proc.stdout,makePrompt(state,true).replace(/\n/g,' '));
    assert.doesNotMatch(command,/--dangerously|--skip-permissions/);
  }
  assert.equal(quotePowerShell("O'Neil"),"'O''Neil'");
});
test('free edits survive export with only explicitly pinned variables filled',()=>{
  const state={...structuredClone(defaults),freeMode:true,customMarkdown:'# {{DISPLAY_NAME}}\n\nMy exact layout.\n{{SKILL_ICONS}}',lockedFields:['name'],name:'Chosen Name'};
  assert.equal(exportMarkdown(state),'# Chosen Name\n\nMy exact layout.\n{{SKILL_ICONS}}');
  assert.match(makeCommand(state,{agent:'generic'}),/未批准/);
  assert.match(makeCommand(state,{agent:'generic',approved:true}),/用户已在网页审阅/);
});
test('Markdown headings, tables and fenced code render without treating code as HTML',()=>{
  const html=markdownToHTML('# Hello\n\n| One | Two |\n| --- | --- |\n| A | B |\n\n```html\n<script>alert(1)</script>\n```');
  assert.match(html,/<h1>Hello<\/h1>/);
  assert.match(html,/<table>/);
  assert.doesNotMatch(html,/<script>/);
  assert.match(html,/&lt;script&gt;/);
});
test('generated terminal and project table HTML survives the Markdown pass',()=>{
  const html='<pre><code>{\n  "name": "Example"\n}</code></pre>\n\n<table>\n<tr><td>Project</td></tr>\n</table>';
  assert.equal(markdownToHTML(html).replace(/\s/g,''),html.replace(/\s/g,''));
  assert.ok(templates.length>=14);
});
test('manual export resolves variables without reintroducing cleared sample data',()=>{
  const state={...structuredClone(defaults),username:'my-login',name:'My Name',bio:'',projects:[],freeMode:true,customMarkdown:'# {{DISPLAY_NAME}}\n{{BIO}}\n{{PROJECT_1_NAME}}'};
  assert.equal(manualExport(state).readme,'# My Name\n\n');
  assert.deepEqual(manualExport(state).errors,[]);
  assert.equal(previewVariables('{{BIO}}',state),'');
  assert.ok(manualExport({...state,username:'bad--login'}).errors.length);
  assert.ok(manualExport({...state,customMarkdown:'{{CUSTOM_VALUE}}'}).errors.length);
});
