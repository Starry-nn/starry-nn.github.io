import {defaults,normalizeState,safeURL,splitSkills} from './core.js?v=13';

export function mergeRows(existing,incoming,key){
  const rows=[...existing],seen=new Set(rows.map(key));
  for(const item of incoming){const id=key(item);if(!seen.has(id)){seen.add(id);rows.push(item);}}
  if(rows.length>30)throw new Error('每类最多 30 项，请先精简内容再导入。');
  return rows;
}
export function projectKey(project,owner){
  const value=String(project.repo||'').trim();if(!value)return 'name:'+project.name;
  const url=safeURL(value)||`https://github.com/${owner}/${encodeURIComponent(value)}`;
  const parsed=new URL(url);return parsed.hostname==='github.com'?url.replace(/\/$/,'').toLowerCase():url;
}
const withoutExample=state=>JSON.stringify(state.projects)===JSON.stringify(defaults.projects)?[]:state.projects;
export function templateState(current,parsed,{source,origin='',identity=false}){
  const next=structuredClone(current);let applied=0;
  for(const key of ['projects','contributions','writings','sections','links']){
    const entries=parsed[key]||[];applied+=entries.length;
    next[key]=mergeRows(key==='projects'?withoutExample(next):next[key],entries,row=>key==='projects'?projectKey(row,next.username):key==='links'?row.value:JSON.stringify(row));
    if(entries.length)next.lockedFields.push(key);
  }
  if(parsed.skills){const keep=current.skills===defaults.skills&&!current.lockedFields.includes('skills')?[]:splitSkills(current);const skills=[...new Map([...keep,...splitSkills({skills:parsed.skills})].map(s=>[s.toLowerCase(),s])).values()];const value=skills.join(', ');if(skills.length>15||value.length>240)throw new Error('技能内容过长，请精简后再导入。');next.skills=value;next.lockedFields.push('skills');applied++;}
  if(identity){for(const [key,value] of Object.entries({...parsed.identity,...(parsed.bio?{bio:parsed.bio}:{})})){if(value){next[key]=value;next.lockedFields.push(key);applied++;}}if(!next.lockedFields.includes('working'))next.working='';}
  if(!applied)throw new Error('没有可填入的内容，请选择导入原文身份资料，或取消自动解析以保留源码。');
  next.importBackup={source,origin};next.templateSource=origin;next.freeMode=false;next.customMarkdown='';return normalizeState(next);
}
export function githubState(current,{profile,projects,languages,includeProfile}){
  const next=structuredClone(current),oldOwner=current.username==='your-username'&&includeProfile?profile.login:current.username;
  const existing=withoutExample(next).map(p=>p.repo&&!safeURL(p.repo)?{...p,repo:`https://github.com/${oldOwner}/${encodeURIComponent(p.repo)}`}:{...p});
  next.projects=mergeRows(existing,projects,p=>projectKey(p,oldOwner));if(projects.length)next.lockedFields.push('projects');
  if(includeProfile){next.username=profile.login;next.lockedFields.push('username');const blog=String(profile.blog||'');const fields={name:profile.name||profile.login,bio:profile.bio||'',tagline:profile.bio||'',website:blog?safeURL(/^https?:\/\//i.test(blog)?blog:'https://'+blog):'',working:''};for(const [key,value] of Object.entries(fields))if(!next.lockedFields.includes(key))next[key]=value;if(!next.lockedFields.includes('skills')&&projects.length)next.skills=languages.join(', ');next.profileLoaded=true;}
  return normalizeState(next);
}
