import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const root=new URL('../',import.meta.url);
const guide=readFileSync(new URL('guide.html',root),'utf8');
const editor=readFileSync(new URL('index.html',root),'utf8');

test('tutorial has working internal anchors and local assets',()=>{
  const ids=new Set([...guide.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  for(const [,hash] of guide.matchAll(/href="#([^"]+)"/g))assert.ok(ids.has(hash),`missing ${hash}`);
  for(const [,path] of guide.matchAll(/(?:href|src)="(\.\/[^"]+)"/g))assert.ok(existsSync(new URL(path,root)),`missing ${path}`);
  assert.ok(ids.has('agent')&&ids.has('manual')&&ids.has('free-edit')&&ids.has('questions'));
  assert.doesNotMatch(guide,/<script\b/i);
});
test('editor offers a visible entry and quick help without breaking handoff target',()=>{
  assert.match(editor,/class="getting-started" aria-label="第一次使用"/);
  assert.match(editor,/href="\.\/guide\.html"[^>]*>查看入门教程/);
  assert.match(editor,/id="open-help" aria-label="新手入门"/);
  assert.match(editor,/id="target-repo"/);
  assert.match(guide,/示例/);
  assert.match(guide,/没有发布授权/);
  assert.match(guide,/不是 <code>octocat\.github\.io<\/code>/);
});
