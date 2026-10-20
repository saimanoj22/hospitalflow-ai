/** Tiny zero-dependency local server for browsers that restrict file:// ES modules. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const port = Number(process.env.PORT)||8000;
const types = {'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json;charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.pdf':'application/pdf','.csv':'text/csv;charset=utf-8'};
http.createServer((req,res)=>{
  let pathname;
  try {pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch {res.writeHead(400);res.end('Bad request');return;}
  const filename=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!filename.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
  fs.readFile(filename,(err,data)=>{
    if(err){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});
    res.end(data);
  });
}).listen(port,'127.0.0.1',()=>console.log(`HospitalFlow AI running at http://localhost:${port}`));
