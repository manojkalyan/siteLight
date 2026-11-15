import {defineConfig} from 'vite';
import {scienceApi} from './scripts/science-api.mjs';
export default defineConfig({build:{rolldownOptions:{input:{main:'index.html',classic:'classic.html'}}},plugins:[scienceApi()],server:{host:'127.0.0.1',watch:{ignored:['**/.tools/**','**/data/raw/**','**/data/cache/**']},fs:{deny:['.env','.env.*','**/.git/**','**/.tools/**','**/data/raw/**','**/data/cache/**']}}});
