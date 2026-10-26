import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');

function harness(auth){
 const notices=[],calls=[],buttons=[{disabled:false}];
 const form={reset(){calls.push('reset');},querySelectorAll(){return buttons;}};
 const context=vm.createContext({
  window:{YONSTUDY_CONFIG:{supabaseUrl:'new-project'}},
  localStorage:{getItem(){throw Error('must not read legacy config');}},
  client:{auth},
  FormData:class{get(key){return key==='email'?' person@example.com ':key==='password'?'secret-password':'';}},
  location:{origin:'https://yonstudy.bxd05575.chatgpt.site',pathname:'/'},
  toast:(...args)=>notices.push(args),
  changeUser:async user=>calls.push(user),
  initAuth:async()=>{}
 });
 vm.runInContext("const AUTH_REDIRECT='https://marks-tools.github.io/4study/#settings';\n"+source.slice(source.indexOf('function getConfig()'),source.indexOf('function accountCard()')),context);
 return {context,form,notices,calls,buttons};
}

test('config ignores localStorage and auth errors stay Japanese',async()=>{
 const h=harness({signInWithPassword:async()=>({error:{code:'invalid_credentials'}})});
 assert.equal(vm.runInContext('getConfig().supabaseUrl',h.context),'new-project');
 await h.context.submitAuth(h.form,false);
 assert.equal(h.notices[0][0],'メールアドレスまたはパスワードが違います');
 assert.equal(h.context.authMessage({message:'network failure'}),'ログインできませんでした。しばらくしてからもう一度お試しください');
 assert.ok(h.buttons.every(button=>!button.disabled));
});

test('login sends email and password with signInWithPassword',async()=>{
 let request;
 const user={id:'user-1'};
 const h=harness({signInWithPassword:async value=>(request=value,{data:{user}})});
 await h.context.submitAuth(h.form,false);
 assert.equal(request.email,'person@example.com');
 assert.equal(request.password,'secret-password');
 assert.equal(h.calls[0],'reset');
 assert.equal(h.calls[1],user);
 assert.equal(h.notices.at(-1)[0],'ログインしました');
});

test('signup sends email and password and keeps confirmation-email notice',async()=>{
 let request;
 const h=harness({signUp:async value=>(request=value,{data:{}})});
 await h.context.submitAuth(h.form,true);
 assert.equal(request.email,'person@example.com');
 assert.equal(request.password,'secret-password');
 assert.equal(request.options.emailRedirectTo,'https://marks-tools.github.io/4study/#settings');
 assert.equal(h.notices.at(-1)[0],'確認メールを送りました。メール内のリンクを開いてから、ログインしてください');
});

test('logged-out card has one primary submit button and mode links',()=>{
 assert.match(source,/<button type="submit" class="primary" name="\$\{authMode\}">/);
 assert.doesNotMatch(source,/<button type="submit" name="signup">新規登録<\/button>/);
 assert.match(source,/新規登録はこちら/);
 assert.match(source,/ログインはこちら/);
 assert.match(source,/パスワードを忘れた方/);
 assert.match(source,/再設定メールを送る/);
 assert.match(source,/ログインに戻る/);
 assert.match(source,/function switchAuthMode\(/);
 assert.match(source,/autocomplete="\$\{authMode==='signup'\?'new-password':'current-password'\}"/);
 assert.equal(source.includes('signInWithOtp'),false);
 assert.equal(source.includes('signInWithOAuth'),false);
 assert.equal(source.includes('yonstudy-config'),false);
 assert.equal(source.includes('config-form'),false);
 assert.ok(source.includes("db:{schema:'yonstudy'}"));
 assert.ok(source.includes("flowType:'pkce'"));
 assert.ok(source.includes('detectSessionInUrl:true'));
});

test('password reset uses the fixed GitHub Pages redirect and a Japanese notice',async()=>{
 let request;
 const h=harness({resetPasswordForEmail:async(email,options)=>(request={email,options},{error:null})});
 const form={querySelectorAll:()=>h.buttons};
 h.context.FormData=class{get(){return ' person@example.com ';}};
 vm.runInContext(source.slice(source.indexOf('async function resetPassword('),source.indexOf('async function updatePassword(')),h.context);
 await h.context.resetPassword(form);
 assert.equal(request.email,'person@example.com');
 assert.equal(request.options.redirectTo,'https://marks-tools.github.io/4study/#settings');
 assert.equal(h.notices.at(-1)[0],'パスワード再設定メールを送りました');
});

test('recovery landing and new-password form are present',()=>{
 assert.match(source,/event==='PASSWORD_RECOVERY'/);
 assert.match(source,/location\.hash='#settings'/);
 assert.match(source,/id="recovery-form"/);
 assert.match(source,/新しいパスワード/);
 assert.match(source,/client\.auth\.updateUser\(\{password\}\)/);
 assert.match(source,/パスワードを変更しました/);
});
