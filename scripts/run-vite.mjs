// Keep compiler worker pressure predictable on the reference 6 GiB laptop.
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const child=spawn(process.execPath,['--max-old-space-size=768',fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url)),...process.argv.slice(2)],{
 stdio:'inherit',windowsHide:true,env:{...process.env,RAYON_NUM_THREADS:'2'},
});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
