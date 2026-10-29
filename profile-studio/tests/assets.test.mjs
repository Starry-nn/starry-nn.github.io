import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
test('every local module import and stylesheet resolves without a build step',()=>{
  for(const filename of readdirSync(root).filter(p=>/\.(js|html)$/.test(p))){const text=readFileSync(new URL(filename,root),'utf8');for(const [,path] of text.matchAll(/(?:from\s+|(?:src|href)=)["'](\.\/[^"']+\.(?:js|css|html)(?:\?[^"']*)?)["']/g)){assert.ok(existsSync(new URL(path,new URL(filename,root))),`missing ${path} in ${filename}`);}}
});
test('literal bound control IDs exist in the static editor or known dynamic controls',()=>{
  const html=readFileSync(new URL('index.html',root),'utf8');const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));ids.add('undo-template');
  for(const filename of ['app.js','community.js','github-projects.js','collections.js','skills.js']){const text=readFileSync(new URL(filename,root),'utf8');for(const [,id] of text.matchAll(/\$\(['"]#([a-z][a-z0-9-]*)['"]\)/g))assert.ok(ids.has(id),`missing #${id} bound in ${filename}`);}
  assert.equal([...html.matchAll(/\bid="([^"]+)"/g)].length,ids.size-1,'duplicate DOM IDs');
});
