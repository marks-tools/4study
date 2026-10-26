import {build} from 'esbuild';
import {readFile,stat} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const root=process.cwd();
const loader={name:'bounded-package-loader',setup(b){b.onResolve({filter:/.*/},async args=>{let p;if(args.path.startsWith('.'))p=path.resolve(args.importer?path.dirname(args.importer):root,args.path);else if(path.isAbsolute(args.path))p=args.path;else {const req=createRequire(pathToFileURL(args.importer||path.join(root,'build.mjs')));p=req.resolve(args.path);let dir=path.dirname(p);while(dir.length>root.length){try{const pkg=JSON.parse(await readFile(path.join(dir,'package.json'),'utf8'));if(pkg.module){p=path.join(dir,pkg.module);break;}if(pkg.name)break;}catch{}dir=path.dirname(dir);}}for(const candidate of [p,p+'.js',p+'.mjs',path.join(p,'index.js')]){try{if((await stat(candidate)).isFile())return {path:candidate,namespace:'bounded'};}catch{}}throw Error('Dependency not found: '+args.path);});b.onLoad({filter:/.*/,namespace:'bounded'},async args=>({contents:await readFile(args.path,'utf8'),loader:args.path.endsWith('.json')?'json':'js'}));}};
await build({stdin:{contents:"export {createClient} from '@supabase/supabase-js';",resolveDir:root},plugins:[loader],tsconfigRaw:{},bundle:true,format:'esm',platform:'browser',target:['safari15'],minify:true,outfile:'dist/supabase.js'});
