import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),dir=new URL('.tools/',root);mkdirSync(dir,{recursive:true});
const exe=fileURLToPath(new URL('python/python.exe',dir));
async function download(url,name){const path=new URL(name,dir);if(existsSync(path))return;const r=await fetch(url);if(!r.ok)throw Error(url+': '+r.status);writeFileSync(path,Buffer.from(await r.arrayBuffer()));}
if(!existsSync(exe)){
 await download('https://www.python.org/ftp/python/3.12.10/python-3.12.10-embed-amd64.zip','python.zip');
 const zip=fileURLToPath(new URL('python.zip',dir)),out=fileURLToPath(new URL('python',dir));
 const run=spawnSync('powershell.exe',['-NoProfile','-Command',`Expand-Archive -LiteralPath '${zip.replaceAll("'","''")}' -DestinationPath '${out.replaceAll("'","''")}' -Force`],{stdio:'inherit'});if(run.status!==0)throw Error('Python archive extraction failed');
}
writeFileSync(new URL('python/python312._pth',dir),'python312.zip\n.\n../pylibs\n../../\nimport site\n');
await download('https://bootstrap.pypa.io/get-pip.py','get-pip.py');
let run=spawnSync(exe,['-m','pip','--version'],{stdio:'ignore'});
if(run.status!==0){run=spawnSync(exe,[fileURLToPath(new URL('get-pip.py',dir)),'--target',fileURLToPath(new URL('pylibs',dir)),'--no-warn-script-location'],{stdio:'inherit'});if(run.status!==0)throw Error('pip bootstrap failed');}
run=spawnSync(exe,['-m','pip','install','--target',fileURLToPath(new URL('pylibs',dir)),'--no-warn-script-location','-r',fileURLToPath(new URL('requirements-science.txt',root))],{stdio:'inherit'});
if(run.status!==0)throw Error('Scientific dependency setup failed');
console.log('Workspace-only Python science runtime ready: '+exe);
