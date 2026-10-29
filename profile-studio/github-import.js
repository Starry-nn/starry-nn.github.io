import {safeURL} from './core.js?v=13';
export function validLogin(login){return /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(login)&&!login.includes('--');}
export function repoProject(repo){const u=safeURL(repo.html_url);if(!u||new URL(u).hostname!=='github.com')throw new Error('仓库链接无效');return {name:String(repo.name||'').slice(0,300),repo:u,description:String(repo.description||'').slice(0,3000)};}
