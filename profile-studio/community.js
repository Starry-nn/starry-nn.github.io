import {escapeHtml as esc} from './core.js?v=5';

export function githubRawURL(value){
  const u=new URL(value);
  if(u.protocol!=='https:'||u.username||u.password||u.port)throw new Error('只支持公开的 HTTPS GitHub README 链接。');
  if(u.hostname==='github.com'){const parts=u.pathname.split('/').filter(Boolean);if(parts.length<5||parts[2]!=='blob')throw new Error('请打开 README 文件后复制含 /blob/ 的链接，或使用 raw.githubusercontent.com 原文链接。');u.hostname='raw.githubusercontent.com';parts.splice(2,1);u.pathname='/'+parts.join('/');}
  else if(u.hostname!=='raw.githubusercontent.com')throw new Error('只支持 github.com 或 raw.githubusercontent.com；其他来源请粘贴源码。');
  if(!/\.(md|markdown|txt)$/i.test(u.pathname))throw new Error('请选择 .md、.markdown 或 .txt 文本文件。');
  u.search='';u.hash='';return u.href;
}
export function checkTemplate(source){if(!source.trim())throw new Error('请先读取链接、选择文件或粘贴源码。');if(new TextEncoder().encode(source).length>100000)throw new Error('模板需小于 100 KB，请精简后重试。');if(source.includes('\u0000'))throw new Error('请选择 UTF-8 编码的文本文件。');return source;}

export function setupCommunity({getState,apply,persist,toast}){
  const $=s=>document.querySelector(s);
  const error=message=>{$('#community-error').hidden=!message;$('#community-error').textContent=message;};
  let undo=null;
  function renderSaved(){const saved=getState().savedTemplates;$('#saved-templates').innerHTML=saved.length?saved.map((t,i)=>`<div class="saved-template"><span>${esc(t.name)}</span><div><button data-saved-use="${i}">使用</button><button data-saved-remove="${i}" aria-label="移出我的模板：${esc(t.name)}">移出</button></div></div>`).join(''):'<p class="library-note">还没有保存的模板。导入后会出现在这里，换设备不会同步。</p>';if(undo)$('#saved-templates').insertAdjacentHTML('beforeend','<button id="undo-template">撤销上次移出</button>');}
  $('#open-community').onclick=()=>{renderSaved();error('');$('#community-dialog').showModal();};
  $('#close-community').onclick=()=>$('#community-dialog').close();
  $('#community-file-button').onclick=()=>$('#community-file').click();
  $('#community-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>100000)throw new Error('文件需小于 100 KB。');$('#community-source').value=checkTemplate(await file.text());if(!$('#community-name').value)$('#community-name').value=file.name.replace(/\.(md|markdown|txt)$/i,'');error('');toast('已读取文件，请检查内容与复用许可。');}catch(e){error(e.message);}event.target.value='';};
  $('#fetch-community').onclick=async()=>{const button=$('#fetch-community');button.disabled=true;button.textContent='读取中…';error('');const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);try{const url=githubRawURL($('#community-url').value.trim());const response=await fetch(url,{credentials:'omit',referrerPolicy:'no-referrer',redirect:'error',signal:controller.signal});if(!response.ok)throw new Error(`无法读取（HTTP ${response.status}）。请确认仓库公开、链接正确；也可以手动粘贴源码。`);const reader=response.body.getReader();let length=0;const chunks=[];while(true){const {value,done}=await reader.read();if(done)break;length+=value.byteLength;if(length>100000){await reader.cancel();throw new Error('文件需小于 100 KB。');}chunks.push(value);}const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}$('#community-source').value=checkTemplate(new TextDecoder('utf-8',{fatal:true}).decode(bytes));error('');toast('已读取公开 README，请检查原作者信息与许可。');}catch(e){error(e.name==='AbortError'?'读取超时，请稍后重试或直接粘贴源码。':e instanceof TypeError?'读取失败，可能是网络、链接或文本编码问题；请改为粘贴源码。':e.message);}finally{clearTimeout(timeout);button.disabled=false;button.textContent='从 GitHub 读取';}};
  $('#apply-community').onclick=()=>{try{const source=checkTemplate($('#community-source').value);if(!$('#community-consent').checked)throw new Error('请先确认你拥有该内容，或原作者允许复用。');const saved=getState().savedTemplates;if(saved.length>=10)throw new Error('最多保存 10 个模板，请先备份并移出一个。');const origin=$('#community-url').value.trim();const name=$('#community-name').value.trim()||'导入的 README';saved.push({name,source:origin,markdown:source});apply(source,origin);$('#community-dialog').close();$('#community-consent').checked=false;toast('已保存到我的模板，进入自由编辑；请替换原作者的资料。');}catch(e){error(e.message);}};
  $('#saved-templates').onclick=event=>{const use=event.target.closest('[data-saved-use]'),remove=event.target.closest('[data-saved-remove]');if(use){const t=getState().savedTemplates[Number(use.dataset.savedUse)];apply(t.markdown,t.source);$('#community-dialog').close();toast('已打开本机模板，自由编辑内容以源码为准。');}if(remove){const index=Number(remove.dataset.savedRemove);undo={index,template:getState().savedTemplates.splice(index,1)[0]};persist();renderSaved();}if(event.target.id==='undo-template'&&undo){if(getState().savedTemplates.length>=10){error('请先移出一个模板再撤销。');return;}getState().savedTemplates.splice(undo.index,0,undo.template);undo=null;persist();renderSaved();}};
}
