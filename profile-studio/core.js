export const resources = [
  { id: 'capsule', name: 'Capsule Render', owner: 'kyechan99', license: 'MIT', url: 'https://github.com/kyechan99/capsule-render', description: '波浪形 SVG 横幅，自动带入你的名字和介绍。', tags: '横幅 banner 背景', apply: true },
  { id: 'typing', name: 'Readme Typing SVG', owner: 'DenverCoder1', license: 'MIT', url: 'https://github.com/DenverCoder1/readme-typing-svg', description: '让一句话介绍逐字出现，直接嵌入 README。', tags: '打字 动画 typing', apply: true },
  { id: 'icons', name: 'Skill Icons', owner: 'tandpfun', license: 'MIT', url: 'https://github.com/tandpfun/skill-icons', description: '把常见技术名变成图标；其他技能继续以文字显示。', tags: '图标 技能 icons', apply: true },
  { id: 'badges', name: 'Markdown Badges', owner: 'Ileriayo', license: 'MIT', url: 'https://github.com/Ileriayo/markdown-badges', description: '用 Shields.io 徽章展示技术栈，随内容自动生成。', tags: '徽章 badges 技术 标签', apply: true },
  { id: 'awesome', name: 'Awesome Profile READMEs', owner: 'abhisheknaiidu', license: 'CC0-1.0', url: 'https://github.com/abhisheknaiidu/awesome-github-profile-readme', visit: 'https://github.com/abhisheknaiidu/awesome-github-profile-readme#categories', description: '按极简、游戏、动态等风格整理的个人主页灵感库。', tags: '模板 灵感 案例 gallery', apply: false },
  { id: 'generator', name: 'Profile README Generator', owner: 'rahuldkjain', license: 'Apache-2.0', url: 'https://github.com/rahuldkjain/github-profile-readme-generator', visit: 'https://rahuldkjain.github.io/github-profile-readme-generator/', description: '社区维护的生成器，提供更多社交链接与模块选项。', tags: '模板 生成器 generator', apply: false }
];
// Popularity snapshot is a navigation aid, not a rating or service-availability guarantee.
const communityStars={capsule:1849,typing:9478,icons:13349,badges:17154,awesome:31456,generator:24460};
for(const resource of resources){resource.stars=communityStars[resource.id];resource.checkedAt='2026-10-28';}
export const templates = [
  { id: 'simple', name: '简洁', tag: '纯文字', header: 'plain', skillStyle: 'text', alignment: 'left', projectLayout: 'list' },
  { id: 'centered', name: '居中', tag: '名片', header: 'plain', skillStyle: 'icons', alignment: 'center', projectLayout: 'table' },
  { id: 'wave', name: '波浪', tag: 'Capsule', header: 'capsule', skillStyle: 'icons', alignment: 'left', projectLayout: 'table' },
  { id: 'typing', name: '打字', tag: 'Typing', header: 'typing', skillStyle: 'text', alignment: 'left', projectLayout: 'list' },
  { id: 'badges', name: '徽章', tag: 'Badges', header: 'plain', skillStyle: 'badges', alignment: 'left', projectLayout: 'table' },
  { id: 'portfolio', name: '作品集', tag: '双栏', header: 'plain', skillStyle: 'text', alignment: 'left', projectLayout: 'cards' },
  { id: 'compact', name: '紧凑', tag: '轻量', header: 'compact', skillStyle: 'text', alignment: 'left', projectLayout: 'list' },
  { id: 'terminal', name: '终端', tag: 'Code', header: 'terminal', skillStyle: 'icons', alignment: 'left', projectLayout: 'list' },
  { id: 'notebook', name: '手记', tag: '引言', header: 'plain', skillStyle: 'text', alignment: 'left', projectLayout: 'list', aboutLayout:'quote' },
  { id: 'folded', name: '折叠', tag: 'Details', header: 'plain', skillStyle: 'icons', alignment: 'center', projectLayout: 'table', aboutLayout:'folded' },
  { id: 'showcase', name: '横幅作品墙', tag: 'Capsule', header: 'capsule', skillStyle: 'badges', alignment: 'center', projectLayout: 'cards' },
  { id: 'live-card', name: '动态名片', tag: 'Typing', header: 'typing', skillStyle: 'icons', alignment: 'center', projectLayout: 'cards' },
  { id: 'developer-log', name: '开发者日志', tag: 'Code', header: 'terminal', skillStyle: 'text', alignment: 'left', projectLayout: 'table', aboutLayout:'folded' },
  { id: 'quiet-work', name: '轻量作品集', tag: '纯文字', header: 'compact', skillStyle: 'text', alignment: 'left', projectLayout: 'cards', aboutLayout:'quote' }
];
export const defaults = {
  template: 'simple', header: 'plain', skillStyle: 'text', alignment: 'left', projectLayout: 'list', aboutLayout:'plain', color: '#3155d9',
  autoFill: true, lockedFields: [], freeMode:false, customMarkdown:'', drafts:{},
  username: 'your-username', name: 'Alex Builder', tagline: 'Small ideas. Useful things.',
  bio: 'A fictional builder exploring the web.', working: 'Learning, making, and sharing.',
  skills: 'TypeScript, Python, React, Figma', website: '',
  modules: [{id:'about',name:'关于我',enabled:true},{id:'projects',name:'精选项目',enabled:true},{id:'experience',name:'工作经历',enabled:true},{id:'education',name:'教育经历',enabled:true},{id:'sections',name:'自定义栏目',enabled:true},{id:'skills',name:'技能',enabled:true},{id:'contact',name:'联系方式',enabled:true}],
  experiences:[], educations:[], sections:[], links:[], templateSource:'', savedTemplates:[],
  projects: [{name:'Example project',repo:'',description:'A fictional project. Replace this with something you built.'}]
};
export function normalizeState(saved) {
  const result = structuredClone(defaults);
  for (const key of ['username','name','tagline','bio','working','skills','website']) if (typeof saved[key] === 'string') result[key] = saved[key].slice(0,1000);
  if (templates.some(t => t.id === saved.template)) {
    const t = templates.find(t => t.id === saved.template);
    Object.assign(result, {template:t.id,header:t.header,skillStyle:t.skillStyle,alignment:t.alignment,projectLayout:t.projectLayout,aboutLayout:t.aboutLayout||'plain'});
  }
  if (['plain','capsule','typing','terminal','compact'].includes(saved.header)) result.header = saved.header;
  if (['text','icons','badges'].includes(saved.skillStyle)) result.skillStyle = saved.skillStyle;
  if (['left','center'].includes(saved.alignment)) result.alignment = saved.alignment;
  if (['table','list','cards'].includes(saved.projectLayout)) result.projectLayout = saved.projectLayout;
  if (['plain','quote','folded'].includes(saved.aboutLayout)) result.aboutLayout = saved.aboutLayout;
  result.autoFill=saved.autoFill!==false;
  result.lockedFields=Array.isArray(saved.lockedFields)?saved.lockedFields.filter(k=>['username','name','tagline','bio','working','skills','website','projects','experiences','educations','sections','links'].includes(k)):[];
  result.freeMode=saved.freeMode===true;
  result.profileLoaded=saved.profileLoaded===true;
  result.customMarkdown=typeof saved.customMarkdown==='string'?saved.customMarkdown.slice(0,100000):'';
  if(saved.drafts&&typeof saved.drafts==='object')for(const t of templates)if(typeof saved.drafts[t.id]==='string')result.drafts[t.id]=saved.drafts[t.id].slice(0,100000);
  if (/^#[0-9a-f]{6}$/i.test(saved.color)) result.color = saved.color;
  if (Array.isArray(saved.modules)) {
    const seen = new Set();
    result.modules = saved.modules.flatMap(m => {
      const original = defaults.modules.find(x => x.id === m?.id);
      if (!original || seen.has(m.id)) return [];
      seen.add(m.id); return [{...original, enabled:m.enabled !== false}];
    });
    for (const m of defaults.modules) if (!seen.has(m.id)) result.modules.push({...m});
  }
  if (Array.isArray(saved.projects)) result.projects = saved.projects.slice(0,30).filter(p => p && typeof p.name === 'string').map(p => ({name:p.name.slice(0,300),repo:String(p.repo||'').slice(0,300),description:String(p.description||'').slice(0,3000)}));
  for(const [key,fields] of Object.entries({experiences:['title','organization','period','description'],educations:['title','organization','period','description'],sections:['title','description'],links:['platform','label','value']}))if(Array.isArray(saved[key]))result[key]=saved[key].filter(x=>x&&typeof x==='object').slice(0,30).map(x=>Object.fromEntries(fields.map(f=>[f,String(x[f]||'').slice(0,f==='description'?3000:300)])));
  result.templateSource=typeof saved.templateSource==='string'?saved.templateSource.slice(0,1000):'';
  result.savedTemplates=Array.isArray(saved.savedTemplates)?saved.savedTemplates.filter(t=>t&&typeof t.markdown==='string').slice(0,10).map(t=>({name:String(t.name||'Imported README').slice(0,80),source:String(t.source||'').slice(0,1000),markdown:t.markdown.slice(0,100000)})):[];
  // Retire untouched legacy demo data, without changing explicitly edited/imported fields.
  if(!result.profileLoaded){const old={username:'Starry-nn',name:'Nan Yao',website:'https://starry-nn.github.io',tagline:'Curious by default. Building with intention.',bio:'I work at the intersection of AI, venture, and product.',working:'Building useful tools and playful experiences.'};for(const [k,v] of Object.entries(old))if(result[k]===v&&!result.lockedFields.includes(k))result[k]=defaults[k];if(!result.lockedFields.includes('projects')&&result.projects.some(p=>['startup-autopsy','prompt-task-router'].includes(p.repo)))result.projects=structuredClone(defaults.projects);}
  return result;
}
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const platforms=[{id:'linkedin',name:'LinkedIn',base:'https://www.linkedin.com/in/',hint:'用户名或完整链接'},{id:'x',name:'X',base:'https://x.com/',hint:'@用户名或完整链接'},{id:'scholar',name:'Google Scholar',base:'',hint:'粘贴学者主页的完整链接'},{id:'huggingface',name:'Hugging Face',base:'https://huggingface.co/',hint:'用户名或完整链接'},{id:'youtube',name:'YouTube',base:'https://www.youtube.com/@',hint:'@频道名或完整链接'},{id:'website',name:'个人网站',base:'',hint:'https://example.com'},{id:'other',name:'其他',base:'',hint:'完整的 https:// 链接'}];
export function safeURL(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export function socialURL(link){const value=String(link.value||'').trim();if(!value)return '';if(/^https?:\/\//i.test(value))return safeURL(value);const p=platforms.find(p=>p.id===link.platform);if(!p?.base||!/^[\w.-]+$/.test(value.replace(/^@/,'')))return '';return p.base+encodeURIComponent(value.replace(/^@/,''));}
export const getUsername = state => state.usePlaceholders&&state.username==='{{GITHUB_LOGIN}}'?'{{GITHUB_LOGIN}}':state.username.replace(/[^a-zA-Z0-9-]/g, '').slice(0,39) || 'your-username';
export function safeWebsite(state) { if(state.usePlaceholders&&state.website==='{{WEBSITE_URL}}')return state.website;try { const u=new URL(state.website); return ['https:','http:'].includes(u.protocol)?u.href:''; } catch { return ''; } }
const text = value => escapeHtml(value).replace(/\r?\n/g, '<br>');
const color = state => /^#[0-9a-f]{6}$/i.test(state.color) ? state.color.slice(1) : '3155d9';
const image = (url, alt, width) => `<img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}"${width ? ` width="${width}"` : ''}>`;
const remoteURL = (base, values) => `${base}?${new URLSearchParams(values).toString()}`;
export function makeHeader(state, compact=false) {
  if (state.header === 'capsule') return `<p align="center">${image(remoteURL('https://capsule-render.vercel.app/api',{type:'waving',color:color(state),height:'190',section:'header',text:state.name||'Hello there',fontSize:'42',fontColor:'ffffff',fontAlignY:'35',desc:state.tagline,descSize:'14',descAlignY:'57'}), 'Capsule Render 横幅', compact ? '300' : '100%')}</p>`;
  const heading = `<h1 align="${state.alignment}">Hi, I’m ${text(state.name||'Your name')}</h1>`;
  if(state.header==='compact')return `<h3>${text(state.name||'Your name')} · @${text(getUsername(state))}</h3>\n\n<p>${text(state.tagline)}</p>`;
  if(state.header==='terminal')return `<pre><code>${escapeHtml(JSON.stringify({name:state.name,github:getUsername(state),about:state.tagline},null,2))}</code></pre>`;
  if (state.header === 'typing') return (compact ? '' : heading+'\n\n') + `<p align="${state.alignment}">${image(remoteURL('https://readme-typing-svg.demolab.com/',{font:'Fira Code',size:'17',pause:'1500',color:color(state),width:'750',height:'45',lines:state.tagline.replace(/[;\r\n]/g,' ')||'Hello there',center:state.alignment==='center'?'true':'false'}),'Readme Typing SVG',compact?'300':'750')}</p>`;
  return `${heading}\n\n<p align="${state.alignment}">${text(state.tagline)}</p>`;
}
const knownSkills = {
  typescript:['ts','typescript','3178C6'],ts:['ts','typescript','3178C6'],python:['py','python','3776AB'],py:['py','python','3776AB'],react:['react','react','149ECA'],javascript:['js','javascript','323330'],js:['js','javascript','323330'],figma:['figma','figma','8B45B6'],html:['html','html5','E34F26'],css:['css','css','1572B6'],nodejs:['nodejs','nodedotjs','339933'],'node.js':['nodejs','nodedotjs','339933'],git:['git','git','F05032'],github:['github','github','24292E'],docker:['docker','docker','2496ED'],go:['go','go','00ADD8'],rust:['rust','rust','555555'],vue:['vue','vuedotjs','238E65'],nextjs:['nextjs','nextdotjs','24292E'],'next.js':['nextjs','nextdotjs','24292E'],tailwind:['tailwind','tailwindcss','087EA4'],java:['java',null,'C14631'],swift:['swift','swift','F05138'],postgresql:['postgres','postgresql','4169E1'],supabase:['supabase','supabase','207B54'],c:['c','c','555555'],cpp:['cpp','cplusplus','00599C'],kotlin:['kotlin','kotlin','7F52FF']
};
export const splitSkills = state => state.skills.split(/[,，]/).map(s=>s.trim()).filter(Boolean).slice(0,15);
export function makeSkills(state) {
  const skills = splitSkills(state);
  if (!skills.length) return '';
  if(state.usePlaceholders&&state.skills==='{{SKILLS}}')return '<p>{{SKILLS}}</p>';
  if (state.skillStyle === 'icons') {
    const ids = [...new Set(skills.map(s => knownSkills[s.toLowerCase()]?.[0]).filter(Boolean))];
    const other = skills.filter(s => !knownSkills[s.toLowerCase()]);
    return (ids.length ? `<p align="${state.alignment}"><a href="https://skillicons.dev">${image(`https://skillicons.dev/icons?i=${ids.join(',')}&theme=light&perline=8`, 'Skill Icons 技能图标')}</a></p>` : '') + (other.length?`\n\n<p align="${state.alignment}">${other.map(s=>`<code>${text(s)}</code>`).join(' · ')}</p>`:'');
  }
  if (state.skillStyle === 'badges') return `<p align="${state.alignment}">${skills.map(s=>{
    const known=knownSkills[s.toLowerCase()];
    const values={label:'',message:s,color:known?.[2]||color(state),style:'for-the-badge',logoColor:'white'};
    if(known?.[1])values.logo=known[1];
    return image(remoteURL('https://img.shields.io/static/v1',values),s);
  }).join('\n')}</p>`;
  return `<p align="${state.alignment}">${skills.map(s=>`<code>${text(s)}</code>`).join(' · ')}</p>`;
}
function makeProjects(state) {
  const projects = state.projects.filter(p => p.name.trim());
  if (!projects.length) return '';
  const link = p => /^https?:\/\//i.test(p.repo)?safeURL(p.repo):p.repo?`https://github.com/${getUsername(state)}/${encodeURIComponent(p.repo)}`:'';
  const projectName=p=>link(p)?`<a href="${escapeHtml(link(p))}">${text(p.name)}</a>`:text(p.name);
  if(state.projectLayout==='cards')return `<h2>Selected projects</h2>\n\n<table>\n<tbody>\n${Array.from({length:Math.ceil(projects.length/2)},(_,i)=>'<tr>'+projects.slice(i*2,i*2+2).map(p=>`<td width="50%"><h3>${projectName(p)}</h3><p>${text(p.description)}</p></td>`).join('')+'</tr>').join('\n')}\n</tbody>\n</table>`;
  if (state.projectLayout === 'table') return `<h2>Selected projects</h2>\n\n<table>\n<thead><tr><th>Project</th><th>What it does</th></tr></thead>\n<tbody>\n${projects.map(p=>`<tr><td>${projectName(p)}</td><td>${text(p.description)}</td></tr>`).join('\n')}\n</tbody>\n</table>`;
  return `<h2>Selected projects</h2>\n\n<ul>\n${projects.map(p=>`<li><strong>${projectName(p)}</strong> — ${text(p.description)}</li>`).join('\n')}\n</ul>`;
}
export function getSources(state) {
  const sources=[];
  if(['capsule','typing'].includes(state.header))sources.push(state.header);
  if(state.modules.some(m=>m.id==='skills'&&m.enabled)&&splitSkills(state).length) {
    if(state.skillStyle==='icons'&&splitSkills(state).some(s=>knownSkills[s.toLowerCase()]))sources.push('icons');
    if(state.skillStyle==='badges')sources.push('badges');
  }
  return sources;
}
export function makeDocument(state) {
  const blocks=[makeHeader(state)];
  for (const m of state.modules.filter(m=>m.enabled)) {
    if(m.id==='about') {
      const about=[state.bio.trim()?`<p>${text(state.bio)}</p>`:'',state.working.trim()?`<p><strong>Currently:</strong> ${text(state.working)}</p>`:''].filter(Boolean).join('\n');
      if(about)blocks.push(state.aboutLayout==='quote'?`<blockquote>${about}</blockquote>`:state.aboutLayout==='folded'?`<details>\n<summary>More about me</summary>\n${about}\n</details>`:about);
    }
    if(m.id==='projects')blocks.push(makeProjects(state));
    if(m.id==='experience'||m.id==='education'){const entries=(state[m.id==='experience'?'experiences':'educations']||[]).filter(e=>e.title||e.organization||e.description);if(entries.length)blocks.push(`<h2>${m.id==='experience'?'Experience':'Education'}</h2>\n`+entries.map(e=>`<h3>${text(e.title)}${e.organization?` · ${text(e.organization)}`:''}</h3>${e.period?`<p><em>${text(e.period)}</em></p>`:''}${e.description?`<p>${text(e.description)}</p>`:''}`).join('\n'));}
    if(m.id==='sections')for(const section of state.sections||[])if(section.title||section.description)blocks.push(`<h2>${text(section.title||'More')}</h2><p>${text(section.description)}</p>`);
    if(m.id==='skills'&&splitSkills(state).length)blocks.push(`<h2>Tools &amp; technologies</h2>\n\n${makeSkills(state)}`);
    if(m.id==='contact')blocks.push(`<h2>Find me elsewhere</h2>\n\n<p><a href="https://github.com/${getUsername(state)}">GitHub</a>${safeWebsite(state)?` · <a href="${escapeHtml(safeWebsite(state))}">Website</a>`:''}${(state.links||[]).filter(l=>socialURL(l)).map(l=>` · <a href="${escapeHtml(socialURL(l))}">${text(l.label||platforms.find(p=>p.id===l.platform)?.name||'Link')}</a>`).join('')}</p>`);
  }
  const html=blocks.filter(Boolean).join('\n\n');
  const sources=getSources(state);
  const attribution=sources.length?`\n\n<!-- Components used (configured via their public image APIs):\n${sources.map(id=>{const r=resources.find(r=>r.id===id);return `${r.name} · ${r.url} · ${r.license}`}).join('\n')}\n-->`:'';
  return {html,markdown:html+attribution+'\n'};
}
export function makeTemplateSample(id) {
  const title = id==='centered'?'<h1 align="center">Hello, I’m Alex.</h1>':'<h1>Hello, I’m Alex.</h1>';
  if(id==='portfolio')return `${title}<table><tr><td><h2>Project one</h2><p>Useful tools for builders.</p></td><td><h2>Project two</h2><p>Small, playful experiments.</p></td></tr></table>`;
  if(id==='compact')return '<h3>Alex Builder · @your-username</h3><p>Building things for the web.</p><p><code>TypeScript</code> · <code>Python</code></p><p>Projects · Website · Say hello</p>';
  if(id==='terminal')return '<pre><code>{\n  "name": "Alex Builder",\n  "about": "Curious by default.",\n  "building": "Something useful"\n}</code></pre><h2>Selected projects</h2>';
  if(id==='notebook')return `${title}<blockquote><p>Curiosity is a good place to start.</p><p>Building useful things.</p></blockquote><h2>Selected projects</h2>`;
  if(id==='folded')return `${title}<details><summary>More about me</summary><p>Work, ideas, and what is next.</p></details><h2>Selected projects</h2>`;
  if(id==='wave')return `<img src="https://capsule-render.vercel.app/api?type=waving&amp;color=3155d9&amp;height=140&amp;text=Alex%20Builder&amp;fontSize=42&amp;fontColor=ffffff" alt=""><h2>Selected projects</h2><p>Building useful things.</p>`;
  if(id==='typing')return `${title}<img src="https://readme-typing-svg.demolab.com/?lines=Building+with+curiosity.&amp;color=3155D9&amp;width=420&amp;height=35&amp;size=18" alt=""><h2>My projects</h2>`;
  if(id==='badges')return `${title}<p>Curious by default. Building with intention.</p><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&amp;logo=typescript&amp;logoColor=white" alt=""><h2>Selected projects</h2>`;
  if(id==='centered')return `${title}<p align="center">Creating things for the web.</p><p align="center"><img src="https://skillicons.dev/icons?i=ts,py,react,figma&amp;theme=light" width="190" alt=""></p><h2>Selected projects</h2>`;
  return `${title}<p>Curious by default. Building with intention.</p><h2>Selected projects</h2><p>Example project · A small experiment</p>`;
}
