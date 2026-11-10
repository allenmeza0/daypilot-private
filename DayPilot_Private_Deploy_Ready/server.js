"use strict";
// DayPilot private PIN gateway. Personal records stay in this device's browser.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { URL } = require('node:url');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const CODE = process.env.DAYPILOT_ACCESS_CODE || '';
const READY = CODE.length >= 6 && CODE.length <= 128;
const CODE_HASH = READY ? crypto.createHash('sha256').update(CODE).digest() : null;
const COOKIE = 'daypilot_gate';
const SESSION_MS = 14 * 24 * 60 * 60 * 1000;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
const sessions = new Map();
const failures = [];
const files = new Set(['/','/index.html','/manifest.webmanifest','/sw.js','/icon.svg','/icon-192.png','/icon-512.png','/theme-luxe.css','/markets.css','/markets.js','/local-ai.js']);
const publicAssets = new Set(['/sw.js','/manifest.webmanifest','/icon.svg','/icon-192.png','/icon-512.png']);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/manifest+json; charset=utf-8'};
const safeHeaders = {'Cache-Control':'no-store, max-age=0','Pragma':'no-cache','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'};
function respond(res,status,body,headers={}) {res.writeHead(status,{...safeHeaders,...headers});res.end(body)}
function json(res,status,obj){respond(res,status,JSON.stringify(obj),{'Content-Type':'application/json; charset=utf-8'})}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,v=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[v]))}
function lockPage(msg=''){
 const message=msg?`<p class="warn" role="alert">${escapeHTML(msg)}</p>`:'';
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0c0d14"><link rel="icon" href="/icon.svg"><link rel="manifest" href="/manifest.webmanifest"><title>Unlock DayPilot</title><style>
 :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;min-height:100dvh;display:grid;place-items:center;padding:20px;background:radial-gradient(circle at 20% 15%,#29233a,transparent 34%),radial-gradient(circle at 90% 85%,#123039,transparent 33%),#090b10;color:#f2f2f4;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}.gate{width:min(100%,430px);padding:34px;border:1px solid #393742;border-radius:24px;background:linear-gradient(140deg,#171920,#111317);box-shadow:0 20px 70px #0008}.icon{display:inline-grid;place-items:center;height:52px;width:52px;border-radius:16px;background:linear-gradient(135deg,#272334,#363342);color:#d6b886;font-size:28px}.kicker{color:#d6b886;letter-spacing:.16em;font-size:11px;font-weight:800;margin:22px 0 0}h1{font-size:30px;letter-spacing:-.04em;line-height:1.1;margin:10px 0}p{color:#aeb1be;margin:0 0 24px;font-size:14px}label{display:block;font-size:13px;color:#dddde3;margin:0 0 9px;font-weight:650}input{width:100%;padding:15px 16px;border-radius:12px;border:1px solid #555463;color:#fff;background:#22232c;font-size:18px;letter-spacing:.10em;outline:none}input:focus{border-color:#d6b886;box-shadow:0 0 0 3px #d6b88622}button{border:0;border-radius:12px;width:100%;margin-top:17px;padding:15px;font-size:15px;font-weight:750;background:#d6b886;color:#171717;cursor:pointer}button:hover{background:#f0d5a6}.warn{background:#3a2025;border:1px solid #8e4850;color:#ffbec6;padding:12px;border-radius:9px;margin:0 0 17px}.fine{color:#858892;text-align:center;font-size:12px;margin-top:20px;line-height:1.6}
 </style></head><body><main class="gate"><div class="icon">✦</div><div class="kicker">DAYPILOT · OBSIDIAN</div><h1>Your space, unlocked.</h1><p>Enter your private access code to open your dashboard. No email sign-in.</p>${message}<form method="POST" action="/unlock" autocomplete="off"><label for="access">Access code</label><input id="access" name="code" type="password" minlength="6" maxlength="128" required autofocus autocomplete="current-password"><button type="submit">Unlock DayPilot →</button></form><div class="fine">Access code is checked on the server. Your planner data stays in this browser.</div></main><script>if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});</script></body></html>`;
}
function parseCookies(req){const out={};for(const x of String(req.headers.cookie||'').split(';')){const i=x.indexOf('=');if(i>0)out[x.slice(0,i).trim()]=x.slice(i+1).trim()}return out}
function clean(now=Date.now()){
 for (const [token,expiry] of sessions) if(expiry<=now)sessions.delete(token);
 while (failures.length && failures[0]<=now-WINDOW_MS) failures.shift();
}
function authorized(req){clean();const token=parseCookies(req)[COOKIE];return token&&sessions.has(token)&&sessions.get(token)>Date.now()}
function isSecure(req){return !!process.env.RENDER || req.headers['x-forwarded-proto']==='https' || process.env.DAYPILOT_SECURE_COOKIE==='true'}
function cookieValue(req,token,age){return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${isSecure(req)?'; Secure':''}`}
function readBody(req,callback){let size=0,buf='';req.on('data',chunk=>{size+=chunk.length;if(size>1024){req.destroy();return}buf+=chunk.toString('utf8')});req.on('end',()=>callback(buf));}
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return true;try{const parsed=new URL(origin);return parsed.host===req.headers.host && ['http:','https:'].includes(parsed.protocol)}catch{return false}}
function serveStatic(req,res,pathname){
 if(!files.has(pathname))return json(res,404,{error:'Not found'});
 const filename=path.join(ROOT,pathname==='/'?'index.html':pathname.slice(1));
 fs.stat(filename,(err,st)=>{if(err||!st.isFile())return json(res,404,{error:'Not found'});
   res.writeHead(200,{...safeHeaders,'Content-Type':types[path.extname(filename)]||'application/octet-stream','Content-Length':st.size});
   if(req.method==='HEAD')return res.end();fs.createReadStream(filename).pipe(res);
 });
}
const app=http.createServer((req,res)=>{
 let pathname;try{pathname=new URL(req.url,'http://localhost').pathname}catch{return json(res,400,{error:'Bad request'})}
 if(!READY)return respond(res,503,'DayPilot is locked until DAYPILOT_ACCESS_CODE (6+ characters) is set in Render Environment.',{'Content-Type':'text/plain; charset=utf-8'});
 if(req.method==='POST' && pathname==='/unlock'){
   if(!sameOrigin(req))return json(res,403,{error:'Forbidden'});
   return readBody(req,raw=>{
     clean();
     if(failures.length>=MAX_FAILURES)return respond(res,429,lockPage('Too many attempts. Try again in about 15 minutes.'),{'Content-Type':'text/html; charset=utf-8','Retry-After':'900'});
     const params=new URLSearchParams(raw);const code=params.get('code')||'';
     const entered=crypto.createHash('sha256').update(code).digest();
     if(!crypto.timingSafeEqual(CODE_HASH,entered)){
       failures.push(Date.now());return respond(res,401,lockPage('That code did not match. Please try again.'),{'Content-Type':'text/html; charset=utf-8'});
     }
     const token=crypto.randomBytes(32).toString('base64url');sessions.set(token,Date.now()+SESSION_MS);failures.length=0;
     return respond(res,303,'',{'Location':'/','Set-Cookie':cookieValue(req,token,Math.floor(SESSION_MS/1000))});
   });
 }
 if(req.method==='POST'&&pathname==='/lock'){
   if(!sameOrigin(req))return json(res,403,{error:'Forbidden'});
   const token=parseCookies(req)[COOKIE];if(token)sessions.delete(token);
   return respond(res,303,'',{'Location':'/','Set-Cookie':cookieValue(req,'',0)});
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed'});
 if(publicAssets.has(pathname))return serveStatic(req,res,pathname);
 if(!authorized(req)){
   if(pathname==='/'||pathname==='/index.html'||pathname==='/unlock')return respond(res,200,req.method==='HEAD'?'':lockPage(),{'Content-Type':'text/html; charset=utf-8'});
   return json(res,401,{error:'Unlock DayPilot first'});
 }
 if(pathname==='/api/status')return json(res,200,{accessCodeEnabled:true,cloudEnabled:false,aiEnabled:false,pushEnabled:false,storage:'this-device-only'});
 if(pathname==='/config.js')return respond(res,200,'window.DAYPILOT_CONFIG={supabaseUrl:"",supabaseAnonKey:""};',{'Content-Type':'text/javascript; charset=utf-8'});
 if(pathname.startsWith('/api/'))return json(res,404,{error:'Cloud services are not connected'});
 return serveStatic(req,res,pathname);
});
app.listen(PORT,'0.0.0.0',()=>console.log('DayPilot PIN gateway listening on port',PORT));
