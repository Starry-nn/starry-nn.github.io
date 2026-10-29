import { templates, resources, makeDocument, makeHeader, makeSkills, makeTemplateSample, normalizeState, defaults, escapeHtml, getUsername, getSources } from './core.js?v=5';
import { exportMarkdown, makeCommand, makePrompt, makePacket, previewVariables, manualExport } from './handoff.js?v=5';
import { markdownToHTML, sanitizeHTML } from './markdown.js?v=5';
import { setupCollections } from './collections.js?v=5';
import { setupCommunity } from './community.js?v=5';

const $ = selector => document.querySelector(selector);
let state=structuredClone(defaults);
try { const saved=JSON.parse(localStorage.getItem('profile-studio-v3')||localStorage.getItem('profile-studio-v2')||localStorage.getItem('profile-studio-v1')||'null'); if(saved)state=normalizeState(saved); } catch {}
let dark=false, saveTimer, toastTimer, imageEpoch=0;
const shared=new URLSearchParams(location.hash.slice(1));
if(templates.some(t=>t.id===shared.get('layout'))){const t=templates.find(t=>t.id===shared.get('layout'));Object.assign(state,{template:t.id,header:t.header,skillStyle:t.skillStyle,alignment:t.alignment,projectLayout:t.projectLayout,aboutLayout:t.aboutLayout||'plain',freeMode:false});if(/^#[a-f\d]{6}$/i.test(shared.get('color')||''))state.color=shared.get('color');}
const fieldKeys=['username','name','tagline','bio','working','skills','website'];
function persist(){try{localStorage.setItem('profile-studio-v3',JSON.stringify(state));$('#save-state').textContent='内容已保存在本机';}catch{$('#save-state').textContent='当前会话 · 未保存';}}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
function pin(key){if(!state.lockedFields.includes(key))state.lockedFields.push(key);}
const renderCollections=setupCollections({getState:()=>state,changed:key=>{pin(key);renderPreview();if(state.freeMode)toast('资料已保存。自由编辑以源码为准，请在源码中同步新增内容。');},toast});
function renderIdentity(){
  $('#auto-fill').checked=state.autoFill;
  if(!state.autoFill)$('#basic-details').open=true;
  const count=state.lockedFields.length;
  $('#identity-note').textContent=state.autoFill?`发布时自动补全真实信息${count?`；保留 ${count} 项手动修改。`:'，可直接跳过填写。'}`:'使用你填写的信息；发布时会核对当前 GitHub 账号。';
  $('#mode-note').textContent=state.autoFill?`${state.profileLoaded?'已导入公开资料':'示例预览'} · Agent 补全未指定信息${count?`，保留 ${count} 项手动修改`:'；你可以直接选择模板'}。`:'手动填写模式 · 当前文字与项目将交给 Agent 原样保留。';
}
function renderTemplates(){
  const active=t=>!state.freeMode&&state.template===t.id&&['header','skillStyle','alignment','projectLayout'].every(k=>state[k]===t[k])&&state.aboutLayout===(t.aboutLayout||'plain');
  $('#template-status').textContent=state.freeMode?'自由编辑中':templates.some(active)?`${templates.length} 套排版`:'已自定义';
  const query=$('#template-search').value.trim().toLowerCase();
  const visible=templates.filter(t=>`${t.name} ${t.tag} ${t.id}`.toLowerCase().includes(query));
  $('#templates').classList.toggle('searching',!!query);
  $('#templates').innerHTML=visible.map(t=>`<button class="template ${active(t)?'active':''} ${state.drafts[t.id]?'free-draft':''}" data-template="${t.id}" aria-pressed="${active(t)}" aria-label="使用${t.name}模板"><div class="thumb" aria-hidden="true"><div class="thumb-content">${makeTemplateSample(t.id)}</div></div><div class="thumb-caption">${t.name}<span>${active(t)?'✓':t.tag}</span></div></button>`).join('')||'<p>没有匹配的排版，试试「作品」或「动态」。</p>';
}
function renderPreview(){
  const source=state.freeMode?markdownToHTML(previewVariables(state.customMarkdown,state)):makeDocument(state).html;
  const safe=sanitizeHTML(source);
  $('#preview').innerHTML=safe.html;
  $('#path-name').textContent=state.autoFill&&!state.lockedFields.includes('username')?'your-profile':getUsername(state);
  $('#target-repo').textContent=state.autoFill?'当前账号 / 同名仓库':`${getUsername(state)}/${getUsername(state)}`;
  $('#preview-state').textContent=state.freeMode?'自由编辑 · 实时预览':'实时预览';
  const sources=state.freeMode?resources.filter(r=>source.includes(r.url)||source.includes(({capsule:'capsule-render.vercel.app',typing:'readme-typing-svg.demolab.com',icons:'skillicons.dev',badges:'img.shields.io'})[r.id]||'__none__')).map(r=>r.id):getSources(state);
  $('#active-sources').textContent=sources.length?`已使用：${sources.map(id=>resources.find(r=>r.id===id)?.name).join(' · ')}`:'原生排版 · 无外部图片';
  $('#image-notice').hidden=safe.removed===0;
  if(safe.removed)$('#image-notice').textContent='预览已过滤不支持的标签、样式或不安全链接。GitHub 也会限制这些内容。';
  const epoch=++imageEpoch, failed=new Set();
  $('#preview').querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>{if(epoch!==imageEpoch)return;failed.add(img.alt||'图片');$('#image-notice').textContent=`${[...failed].join('、')}暂时未能加载，导出仍会保留图片链接。`;$('#image-notice').hidden=false;},{once:true}));
  renderIdentity();
  if($('#agent-dialog').open)updateHandoff(false);
  clearTimeout(saveTimer);saveTimer=setTimeout(persist,250);
}
function renderModules(){
  $('#modules').innerHTML=state.modules.map((m,i)=>`<div class="module-row"><input type="checkbox" id="module-${m.id}" data-module="${m.id}" ${m.enabled?'checked':''}><label for="module-${m.id}">${m.name}</label><button type="button" data-move="-1" data-id="${m.id}" aria-label="上移${m.name}" ${i===0?'disabled':''}>↑</button><button type="button" data-move="1" data-id="${m.id}" aria-label="下移${m.name}" ${i===state.modules.length-1?'disabled':''}>↓</button></div>`).join('');
}
function populate(){
  for(const key of fieldKeys)$('#'+key).value=state[key];
  $('#header-style').value=state.header;$('#skill-style').value=state.skillStyle;$('#project-layout').value=state.projectLayout;
  $('#swatches').innerHTML=[['蓝','#3155d9'],['绿','#28745e'],['红','#aa473e'],['灰','#475569']].map(([n,c])=>`<button type="button" class="swatch ${state.color===c?'active':''}" data-color="${c}" style="background:${c}" aria-label="${n}色" aria-pressed="${state.color===c}"></button>`).join('');
  renderCollections();
  renderModules();renderTemplates();renderIdentity();
}
function saveDraft(){if(state.freeMode)state.drafts[state.template]=state.customMarkdown;}
function setEditor(edit){
  if(edit&&!state.freeMode){state.customMarkdown=state.drafts[state.template]??exportMarkdown(state);state.freeMode=true;}
  $('#free-pane').hidden=!edit;$('#free-toolbar').hidden=!edit;$('#readme-frame').classList.toggle('editing',edit);
  $('#free-source').value=state.customMarkdown;
  for(const [id,selected] of [['preview-tab',!edit],['markdown-tab',edit]]){$('#'+id).classList.toggle('selected',selected);$('#'+id).setAttribute('aria-pressed',String(selected));}
  renderTemplates();renderPreview();
}
function insertSource(fragment){
  setEditor(true);
  const textarea=$('#free-source');
  textarea.setRangeText('\n\n'+fragment+'\n\n',textarea.selectionStart,textarea.selectionEnd,'end');
  state.customMarkdown=textarea.value;saveDraft();renderTemplates();renderPreview();textarea.focus();
}
function resourceVisual(r){if(r.id==='capsule'||r.id==='typing')return makeHeader({...state,header:r.id},true);if(r.id==='icons'||r.id==='badges')return makeSkills({...state,skillStyle:r.id});return `<span class="resource-symbol">${r.id==='awesome'?'&lt;profile /&gt;':'README.md →'}</span>`;}
function renderResources(){
  const query=$('#resource-search').value.trim().toLowerCase();
  const matches=resources.filter(r=>`${r.name} ${r.description} ${r.tags}`.toLowerCase().includes(query));
  $('#resource-list').innerHTML=matches.map(r=>`<article class="resource"><div class="resource-visual">${resourceVisual(r)}</div><div class="resource-body"><div class="resource-title"><strong>${r.name}</strong><span class="license">${r.license}</span></div><p>${r.description}</p><p class="community-meta">☆ ${r.stars.toLocaleString('en-US')} GitHub Stars · ${r.checkedAt} 核对</p><div class="resource-actions"><a href="${r.url}" target="_blank" rel="noopener noreferrer">${r.owner} ↗</a>${r.apply?`<button data-resource="${r.id}">${state.freeMode?'插入编辑区':'添加到主页'}</button>`:`<a href="${r.visit}" target="_blank" rel="noopener noreferrer">去原站使用 ↗</a>`}</div></div></article>`).join('')||'<p class="empty-resources">没有匹配资源，试试「图标」或「模板」。</p>';
}
function openLibrary(){renderResources();$('#library-dialog').showModal();}
function updateHandoff(approved=false){
  const agent=$('#agent-choice').value,shell=$('#shell-choice').value;
  $('#shell-label').hidden=agent==='generic';
  $('#agent-command').value=makeCommand(state,{agent,shell,approved});
  const oversized=agent!=='generic'&&$('#agent-command').value.length>24000;
  $('#confirm-agent').disabled=oversized;
  $('#command-label').firstChild.textContent=approved?'已确认 · 复制到你的 Agent 即可':'交接预览 · 尚未授权发布';
  $('#handoff-template').textContent=`${templates.find(t=>t.id===state.template)?.name||'自定义'}${state.freeMode?' / 自由编辑':''}`;
  $('#handoff-identity').textContent=state.autoFill?'Agent 自动补全信息':'保留手填信息';
  $('#confirm-agent').textContent=agent==='generic'?'确认并复制指令 ↗':'确认并复制命令 ↗';
  if(oversized)$('#command-label').firstChild.textContent='内容较长 · 请选「其他 Agent / 已打开的对话」，或下载交接包';
}
function downloadText(content,filename,type){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function copyText(source,message){try{await navigator.clipboard.writeText(source);toast(message);}catch{$('#copy-code').value=source;$('#copy-dialog').showModal();$('#copy-code').focus();$('#copy-code').select();}}

document.addEventListener('click',event=>{
  const t=event.target.closest('[data-template]');
  if(t){saveDraft();const recipe=templates.find(r=>r.id===t.dataset.template);for(const key of ['header','skillStyle','alignment','projectLayout'])state[key]=recipe[key];state.aboutLayout=recipe.aboutLayout||'plain';state.template=recipe.id;state.freeMode=false;state.customMarkdown='';state.templateSource='';populate();setEditor(false);}
  const color=event.target.closest('[data-color]');
  if(color){state.color=color.dataset.color;populate();renderPreview();if(state.freeMode)toast('自由编辑时，请在源码中调整已有 SVG 的颜色参数。');}
  const move=event.target.closest('[data-move]');
  if(move){const i=state.modules.findIndex(m=>m.id===move.dataset.id),j=i+Number(move.dataset.move);if(j>=0&&j<state.modules.length){[state.modules[i],state.modules[j]]=[state.modules[j],state.modules[i]];renderModules();renderPreview();}}
  const resource=event.target.closest('[data-resource]');
  if(resource){const id=resource.dataset.resource;if(state.freeMode){const forExport=state.autoFill?{...state,usePlaceholders:true,name:state.lockedFields.includes('name')?state.name:'{{DISPLAY_NAME}}',tagline:state.lockedFields.includes('tagline')?state.tagline:'{{TAGLINE}}'}:state;const body=['capsule','typing'].includes(id)?makeHeader({...forExport,header:id}):state.autoFill&&!state.lockedFields.includes('skills')?`{{${id==='icons'?'SKILL_ICONS':'SKILL_BADGES'}}}`:makeSkills({...state,skillStyle:id});const r=resources.find(r=>r.id===id);insertSource(`<!-- ${r.name}: ${r.url} (${r.license}) -->\n${body}`);$('#library-dialog').close();toast('组件已插入编辑区');}else{if(['capsule','typing'].includes(id))state.header=id;else{state.skillStyle=id;state.modules.find(m=>m.id==='skills').enabled=true;}populate();renderPreview();renderResources();toast('已加入主页');}}
  const insert=event.target.closest('[data-insert]');
  if(insert)insertSource(insert.dataset.insert==='heading'?'## A little more about me':'| Project | Description |\n| --- | --- |\n| [Project](https://github.com/{{GITHUB_LOGIN}}/project) | What it does |');
});
$('#profile-form').addEventListener('submit',event=>event.preventDefault());
for(const key of fieldKeys)$('#'+key).addEventListener('input',event=>{state[key]=event.target.value;pin(key);renderPreview();});
$('#auto-fill').onchange=event=>{state.autoFill=event.target.checked;renderPreview();};
for(const [id,key] of [['header-style','header'],['skill-style','skillStyle'],['project-layout','projectLayout']])$('#'+id).onchange=event=>{state[key]=event.target.value;renderTemplates();renderPreview();if(state.freeMode)toast('当前是自由编辑，设置将在重新应用模板时生效。');};
$('#modules').onchange=event=>{const m=state.modules.find(m=>m.id===event.target.dataset.module);if(m){m.enabled=event.target.checked;renderPreview();if(state.freeMode)toast('自由编辑时，可直接在源码中增删模块。');}};
$('#free-source').oninput=event=>{state.customMarkdown=event.target.value;saveDraft();renderTemplates();renderPreview();};
$('#free-source').onkeydown=event=>{if(event.key==='Tab'){event.preventDefault();event.target.setRangeText('  ',event.target.selectionStart,event.target.selectionEnd,'end');state.customMarkdown=event.target.value;saveDraft();renderPreview();}};
$('#preview-tab').onclick=()=>setEditor(false);$('#markdown-tab').onclick=()=>setEditor(true);
$('#more-templates').onclick=()=>{const expanded=$('#templates').classList.toggle('expanded');$('#more-templates').textContent=expanded?'收起 ↑':'展开全部 ↓';$('#more-templates').setAttribute('aria-expanded',String(expanded));};
$('#theme').onclick=()=>{dark=!dark;$('#readme-frame').classList.toggle('dark-preview',dark);$('#theme').textContent=dark?'浅色预览':'深色预览';$('#theme').setAttribute('aria-pressed',String(dark));};
$('#open-library').onclick=openLibrary;$('#source-details').onclick=openLibrary;$('#insert-resource').onclick=openLibrary;$('#resource-search').oninput=renderResources;
$('#open-help').onclick=()=>$('#help-dialog').showModal();
$('#open-agent').onclick=()=>{saveDraft();updateHandoff(false);$('#agent-dialog').showModal();};
function openManual(){const result=manualExport(state);$('#manual-code').value=result.readme;$('#manual-error').textContent=result.errors.join(' ');$('#manual-error').hidden=!result.errors.length;$('#manual-copy').disabled=$('#manual-download').disabled=!!result.errors.length;$('#manual-repo').href=`https://github.com/${getUsername(state)}/${getUsername(state)}`;$('#manual-repo').textContent=`打开 ${getUsername(state)}/${getUsername(state)} ↗`;$('#manual-dialog').showModal();}
$('#open-manual').onclick=openManual;
$('#close-manual').onclick=()=>$('#manual-dialog').close();
$('#manual-copy').onclick=()=>{const result=manualExport(state);if(!result.errors.length)copyText(result.readme,'已复制完整 README，粘贴到同名仓库即可');};
$('#manual-download').onclick=()=>{const result=manualExport(state);if(!result.errors.length)downloadText(result.readme,'README.md','text/markdown;charset=utf-8');};
$('#template-search').oninput=renderTemplates;
$('#share-layout').onclick=()=>{if(state.freeMode){toast('自由编辑内容请通过下载 .md 分享，避免把个人资料放进链接。');return;}const params=new URLSearchParams({layout:state.template,color:state.color});copyText(`${location.origin}${location.pathname}#${params}`,'已复制基础模板与配色链接，不含个人资料或自定义模块设置');};
$('#agent-choice').onchange=()=>updateHandoff(false);$('#shell-choice').onchange=()=>updateHandoff(false);
$('#confirm-agent').onclick=()=>{updateHandoff(true);copyText($('#agent-command').value,'已确认并复制，粘贴到终端或 Agent 对话即可');};
$('#copy-agent-prompt').onclick=()=>{updateHandoff(false);copyText(makePrompt(state,false),'已复制草稿指令；该指令只生成草稿，不会发布');};
$('#download-packet').onclick=()=>{downloadText(JSON.stringify(makePacket(state,false),null,2),'profile-studio.handoff.json','application/json');toast('已下载未授权发布的草稿交接包');};
$('#copy').onclick=()=>copyText(exportMarkdown(state),state.autoFill?'已复制源码，变量由 Agent 自动补全':'README 源码已复制');
$('#download').onclick=()=>{downloadText(exportMarkdown(state),'README.md','text/markdown;charset=utf-8');toast(state.autoFill?'已下载含 Agent 变量的 README.md':'README.md 已下载');};
$('#import-markdown').onclick=()=>$('#markdown-file').click();
$('#markdown-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;if(file.size>100000){toast('请导入小于 100 KB 的 README 文件');event.target.value='';return;}try{const source=await file.text();if(source.includes('\u0000'))throw new Error('invalid');setEditor(true);state.customMarkdown=source;$('#free-source').value=source;saveDraft();renderPreview();toast('已导入本地 README，可继续编辑');}catch{toast('文件无法读取，请选择 UTF-8 编码的 .md 文件');}event.target.value='';};
$('#open-profile-import').onclick=()=>$('#profile-import-dialog').showModal();
$('#copy-fill-prompt').onclick=()=>copyText('请只读查询你已授权的当前 GitHub 账号（gh auth status，gh api user 或等价 connector）。读取公开姓名、简介、网站、最多两个公开 pinned repo（没有则近期非 fork 项目）与其公开语言。返回一个 JSON 对象：{"username":"实际 login","name":"公开姓名或 login","bio":"公开简介或空字符串","tagline":"公开简介或空字符串","working":"","website":"公开网站或空字符串","skills":"仓库语言逗号分隔","projects":[{"name":"仓库名","repo":"仓库名","description":"公开描述"}]}。只提供可验证信息，不输出凭据，不创建仓库，不写任何远端内容。JSON 可另存为 profile-studio.profile.json 供我导入。','已复制只读资料获取指令');
$('#apply-profile-json').onclick=()=>{
  const error=$('#profile-import-error');error.hidden=true;
  try{const raw=$('#profile-json').value.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');if(raw.length>100000)throw new Error('资料超过 100 KB');const data=JSON.parse(raw);if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('需要一个 JSON 对象');if(typeof data.username!=='string'||!/^[a-z0-9][a-z0-9-]{0,38}$/i.test(data.username))throw new Error('请包含有效的 GitHub username');for(const key of fieldKeys){if(!state.lockedFields.includes(key)&&typeof data[key]==='string')state[key]=data[key].slice(0,800);}if(!state.lockedFields.includes('projects')&&Array.isArray(data.projects))state.projects=normalizeState({projects:data.projects}).projects;state.profileLoaded=true;populate();renderPreview();$('#profile-import-dialog').close();toast('已填入公开资料；你的手动修改保持不变');}catch(e){error.textContent=`无法导入：${e.message}`;error.hidden=false;}
};
for(const id of ['library','help','copy','agent','profile-import']){$('#close-'+id).onclick=()=>$('#'+id+'-dialog').close();$('#'+id+'-dialog').addEventListener('click',event=>{if(event.target!==event.currentTarget)return;const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.currentTarget.close();});}
$('#reset').onclick=()=>{const library=state.savedTemplates;state=structuredClone(defaults);state.savedTemplates=library;renderCollections.resetUndo();populate();setEditor(false);persist();toast('已恢复示例资料；我的模板保持不变');};
window.addEventListener('pagehide',persist);
setupCommunity({getState:()=>state,apply:(source,origin)=>{saveDraft();state.customMarkdown=source;state.freeMode=true;state.templateSource=origin;setEditor(true);persist();},persist,toast});
populate();setEditor(state.freeMode);
