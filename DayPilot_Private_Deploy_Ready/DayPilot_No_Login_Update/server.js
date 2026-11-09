"use strict";
// DayPilot no-login static host. No user-specific data is stored on this server.
const http=require("node:http");
const fs=require("node:fs");
const path=require("node:path");
const {URL}=require("node:url");
const PORT=Number(process.env.PORT||3000);
const ROOT=__dirname;
const files=new Set(["/","/index.html","/manifest.webmanifest","/sw.js","/icon.svg","/icon-192.png","/icon-512.png","/theme-luxe.css","/markets.css","/markets.js"]);
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".png":"image/png",".svg":"image/svg+xml",".webmanifest":"application/manifest+json; charset=utf-8"};
function json(res,status,body){res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});res.end(JSON.stringify(body))}
http.createServer((req,res)=>{
 let pathname;try{pathname=new URL(req.url,"http://localhost").pathname}catch{return json(res,400,{error:"Bad request"})}
 if(req.method!=="GET"&&req.method!=="HEAD")return json(res,405,{error:"Method not allowed"});
 if(pathname==="/api/status")return json(res,200,{aiEnabled:false,cloudEnabled:false,pushEnabled:false,ownerRestricted:false,storage:"this-device-only"});
 if(pathname==="/config.js"){
  res.writeHead(200,{"Content-Type":"text/javascript; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"});return res.end('window.DAYPILOT_CONFIG={supabaseUrl:"",supabaseAnonKey:""};');
 }
 if(pathname.startsWith("/api/"))return json(res,404,{error:"Cloud services disabled in no-login mode"});
 if(!files.has(pathname))return json(res,404,{error:"Not found"});
 const filename=path.join(ROOT,pathname==="/"?"index.html":pathname.slice(1));
 fs.stat(filename,(err,st)=>{
  if(err||!st.isFile())return json(res,404,{error:"Not found"});
  res.writeHead(200,{"Content-Type":types[path.extname(filename)]||"application/octet-stream","Content-Length":st.size,"Cache-Control":pathname==="/sw.js"?"no-store":"no-cache","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer"});
  if(req.method==="HEAD")return res.end();
  fs.createReadStream(filename).pipe(res);
 });
}).listen(PORT,"0.0.0.0",()=>console.log("DayPilot local-only mode on port",PORT));
