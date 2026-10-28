// A deliberately small Markdown renderer for local editing. Raw HTML is allowed
// only after a DOM allowlist pass; no custom source is executed in the preview.
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inline(s) {
  const held=[];
  const hold=value=>`\uE000${held.push(value)-1}\uE001`;
  s=s.replace(/`([^`]+)`/g,(_,code)=>hold(`<code>${esc(code)}</code>`));
  s=s.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,(_,alt,url)=>hold(`<img alt="${esc(alt)}" src="${esc(url)}">`));
  s=s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,(_,label,url)=>hold(`<a href="${esc(url)}">${esc(label)}</a>`));
  s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
  return s.replace(/\uE000(\d+)\uE001/g,(_,i)=>held[Number(i)]||'');
}
export function markdownToHTML(source) {
  const raw=[];
  const protectedSource=String(source).replace(/<(pre|table|details|blockquote|p|ul|ol|h[1-6]|div)\b[^>]*>[\s\S]*?<\/\1>/gi,block=>`\n\uE100${raw.push(block)-1}\uE101\n`);
  const lines=protectedSource.replace(/\r\n/g,'\n').split('\n');
  const out=[];
  for(let i=0;i<lines.length;i++){
    const line=lines[i];
    const rawBlock=line.match(/^\uE100(\d+)\uE101$/);if(rawBlock){out.push(raw[Number(rawBlock[1])]);continue;}
    if(/^\s*```/.test(line)){
      const code=[];while(i+1<lines.length&&!/^\s*```/.test(lines[i+1]))code.push(lines[++i]);
      if(i+1<lines.length)i++;
      out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);continue;
    }
    if(!line.trim()){out.push('');continue;}
    if(/^\s*</.test(line)){out.push(line);continue;}
    const heading=line.match(/^(#{1,6})\s+(.+)$/);
    if(heading){out.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);continue;}
    if(/^\s*([-*_])\1\1+\s*$/.test(line)){out.push('<hr>');continue;}
    if(line.includes('|')&&i+1<lines.length&&/^\s*\|?\s*:?-{3,}/.test(lines[i+1])){
      const cells=l=>l.trim().replace(/^\||\|$/g,'').split('|').map(s=>s.trim());
      out.push('<table><thead><tr>'+cells(line).map(s=>`<th>${inline(s)}</th>`).join('')+'</tr></thead><tbody>');i++;
      while(i+1<lines.length&&lines[i+1].includes('|')&&lines[i+1].trim()){out.push('<tr>'+cells(lines[++i]).map(s=>`<td>${inline(s)}</td>`).join('')+'</tr>');}
      out.push('</tbody></table>');continue;
    }
    if(/^\s*[-*+]\s+/.test(line)){
      out.push('<ul>');
      do{out.push('<li>'+inline(lines[i].replace(/^\s*[-*+]\s+/,''))+'</li>');if(i+1>=lines.length||!/^\s*[-*+]\s+/.test(lines[i+1]))break;i++;}while(true);
      out.push('</ul>');continue;
    }
    if(/^>\s?/.test(line)){out.push('<blockquote><p>'+inline(line.replace(/^>\s?/,''))+'</p></blockquote>');continue;}
    out.push('<p>'+inline(line)+'</p>');
  }
  return out.join('\n');
}

export function sanitizeHTML(html) {
  const doc=new DOMParser().parseFromString(html,'text/html');
  const allowed=new Set(['H1','H2','H3','H4','H5','H6','P','BR','STRONG','B','EM','I','S','DEL','A','IMG','UL','OL','LI','BLOCKQUOTE','PRE','CODE','TABLE','THEAD','TBODY','TR','TH','TD','HR','DETAILS','SUMMARY','SUB','SUP','DIV','SPAN']);
  const dangerous=new Set(['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','SVG','MATH','FORM','INPUT','BUTTON','TEMPLATE','LINK','META','BASE','VIDEO','AUDIO']);
  let removed=0;
  for(const el of [...doc.body.querySelectorAll('*')]){
    if(!allowed.has(el.tagName)){removed++;if(dangerous.has(el.tagName))el.remove();else el.replaceWith(...el.childNodes);continue;}
    for(const attr of [...el.attributes]){
      const name=attr.name.toLowerCase(), value=attr.value;
      const urlAttr=name==='href'&&el.tagName==='A'||name==='src'&&el.tagName==='IMG';
      if(urlAttr){
        if(!/^(https?:\/\/|#[a-z0-9_-])/i.test(value)){el.removeAttribute(name);removed++;}
      }else if(name==='align'&&/^(left|right|center)$/.test(value)){}
      else if(['width','height'].includes(name)&&/^\d{1,4}%?$/.test(value)){}
      else if(['alt','title'].includes(name)){}
      else{el.removeAttribute(name);removed++;}
    }
    if(el.tagName==='A'){el.setAttribute('target','_blank');el.setAttribute('rel','noopener noreferrer');}
  }
  return {html:doc.body.innerHTML,removed};
}
