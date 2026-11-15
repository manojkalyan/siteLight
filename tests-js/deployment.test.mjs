import test from 'node:test';
import assert from 'node:assert/strict';
import {Writable} from 'node:stream';
import {createScienceProxy} from '../api/science/[endpoint].mjs';
function response(){const chunks=[],headers={};const res=new Writable({write(chunk,encoding,done){chunks.push(Buffer.from(chunk));done();}});res.setHeader=(key,value)=>{headers[key.toLowerCase()]=value;};return {res,headers,text:()=>Buffer.concat(chunks).toString(),json:()=>JSON.parse(Buffer.concat(chunks).toString())};}
const request=(endpoint='capabilities',patch={})=>({url:'/api/science/'+endpoint,method:endpoint==='capabilities'?'GET':'POST',headers:{host:'sitelight.example','content-type':'application/json'},body:{siteId:'real-nobile'},...patch});
test('unconnected Vercel deployment reports real-data limits without inventing an available backend',async()=>{
 const handler=createScienceProxy({env:{},fetcher:()=>{throw Error('Must not fetch');}}),out=response();await handler(request(),out.res);assert.equal(out.res.statusCode,200);assert.equal(out.json().schema,'sitelight-science-service-1');assert.equal(out.json().available,false);assert.equal(out.json().deploymentMode,'bundled-real-data');const result=response();await handler(request('monthly'),result.res);assert.equal(result.res.statusCode,503);assert.match(result.json().error,/previous scenario is preserved/);
});
test('science proxy accepts only fixed endpoints, methods, small JSON objects and same-origin browser requests',async()=>{
 const handler=createScienceProxy({env:{SCIENCE_API_URL:'https://science.example'},fetcher:()=>{throw Error('Must not fetch');}});
 for(const [req,status] of [[request('internal'),404],[request('coverage',{method:'GET'}),405],[request('monthly',{headers:{host:'sitelight.example',origin:'https://evil.example'}}),403],[request('point',{headers:{host:'sitelight.example','content-type':'text/plain'}}),415],[request('coverage',{body:'['}),400],[request('monthly',{body:'x'.repeat(4097)}),413],[request('point',{body:[]}),400]]){const out=response();await handler(req,out.res);assert.equal(out.res.statusCode,status);}
});
test('science backend configuration and token remain server-side while successful JSON is streamed intact',async()=>{
 let received;const handler=createScienceProxy({env:{SCIENCE_API_URL:'https://science.example',SCIENCE_API_TOKEN:'test-server-only'},fetcher:async(url,options)=>{received={url:String(url),options};return new Response(JSON.stringify({schema:'test-large-json',values:'x'.repeat(5*1024*1024)}),{headers:{'Content-Type':'application/json'}});}}),out=response();await handler(request('monthly'),out.res);assert.equal(received.url,'https://science.example/api/science/monthly');assert.equal(received.options.headers.Authorization,'Bearer test-server-only');assert.equal(received.options.redirect,'error');assert.equal(out.res.statusCode,200);assert.equal(out.json().values.length,5*1024*1024);assert.ok(!out.text().includes('test-server-only'));assert.equal(out.headers['cache-control'],'no-store');
});
test('upstream failures do not disclose credentials or internal error bodies',async()=>{
 for(const fetcher of [async()=>new Response('private backend error',{status:500}),async()=>new Response('<html>wrong backend</html>',{headers:{'Content-Type':'text/html'}}),async()=>{throw Error('https://sensitive.example?token=private');}]){const handler=createScienceProxy({env:{SCIENCE_API_URL:'https://science.example',SCIENCE_API_TOKEN:'private'},fetcher}),out=response();await handler(request('coverage'),out.res);assert.equal(out.res.statusCode,502);assert.ok(!out.text().includes('private'));assert.ok(!out.text().includes('sensitive'));}
 for(const url of ['http://science.example','https://user:secret@science.example','https://science.example?token=secret']){const out=response();await createScienceProxy({env:{SCIENCE_API_URL:url}})(request(),out.res);assert.equal(out.res.statusCode,503);}
});
