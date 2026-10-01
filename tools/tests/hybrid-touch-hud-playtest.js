// Simulated hybrid capability + real Chromium touch/keyboard events, not hardware QA.
// Uses an existing server or deployed URL; owns no server and always closes its browser.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.PLAYWRIGHT_NODE_MODULES||path.join(__dirname,'../../node_modules')]}));
const gameUrl=process.env.HYBRID_QA_URL||'http://127.0.0.1:5503/';
const results=[];
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.MOBILE_BROWSER_EXECUTABLE?{executablePath:process.env.MOBILE_BROWSER_EXECUTABLE}:{})});
 try{
  for(const anyCoarse of [true,false]){
   const context=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true,isMobile:false});
   if(process.env.MOBILE_TAILWIND_SCRIPT)await context.route('https://cdn.tailwindcss.com/',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(process.env.MOBILE_TAILWIND_SCRIPT,'utf8')}));
   // Chromium's hasTouch normally also changes the primary-pointer media query.
   // Explicitly model a fine primary pointer with optional secondary coarse input.
   await context.addInitScript(anyCoarse=>{
    const original=window.matchMedia.bind(window);
    window.matchMedia=query=>{
     const native=original(query);
     const override=query==='(pointer: coarse)'?false:query==='(pointer: fine)'?true:query==='(any-pointer: coarse)'?anyCoarse:undefined;
     if(override===undefined)return native;
     return new Proxy(native,{get:(target,key)=>key==='matches'?override:typeof target[key]==='function'?target[key].bind(target):target[key]});
    };
   },anyCoarse);
   const page=await context.newPage();page.setDefaultTimeout(10000);
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(gameUrl,{waitUntil:'load',timeout:30000});
   await page.locator('#player-entry-name').waitFor({state:'visible'});
   assert.equal(await page.evaluate(()=>matchMedia('(pointer: coarse)').matches),false);
   assert.equal(await page.evaluate(()=>matchMedia('(any-pointer: coarse)').matches),anyCoarse);
   if(!process.env.HYBRID_QA_EXPECT_GAP)assert.equal(await page.evaluate(()=>document.body.classList.contains('touch-ui')),anyCoarse);
   await page.locator('#player-entry-name').fill('Hybrid QA');
   // Use mouse entry for advertised touch capability, and a native touch entry
   // for the observed-touch fallback before the welcome instructions are chosen.
   if(anyCoarse)await page.locator('#player-entry-primary').click();
   else await page.locator('#player-entry-primary').tap();
   if(!process.env.HYBRID_QA_EXPECT_GAP){
    assert.equal(await page.locator('#mobile-toolbar').isVisible(),true);
    assert.match(await page.locator('#chat-log').innerText(),/Touch: tap to move or act, hold for choices\./,'welcome instructions must match the active touch HUD');
    assert.doesNotMatch(await page.locator('#chat-log').innerText(),/Tip: Left-click to move\./);
   }
   const initial=await page.evaluate(()=>[playerState.x,playerState.y]);
   const destination=await page.evaluate(()=>projectWorldTileToScreen(213,251,0,0));
   await page.touchscreen.tap(destination.x,destination.y);
   await page.waitForFunction(([x,y])=>playerState.x!==x||playerState.y!==y,initial);
   if(process.env.HYBRID_QA_EXPECT_GAP){
    assert.equal(await page.locator('#mobile-toolbar').isVisible(),false,'baseline touch works while toolbar remains hidden');
    console.log('REPRODUCED published gap: fine primary pointer, touch movement succeeds, Stop/Home hidden');
    await context.close();break;
   }
   assert.equal(await page.locator('#mobile-toolbar').isVisible(),true);
   await page.locator('#mobile-stop').click();
   assert.equal(await page.evaluate(()=>pendingAction),null);
   assert.equal(await page.evaluate(()=>playerState.path.length),0);
   await page.locator('#mobile-bag').click();assert.equal(await page.locator('#main-ui-container').isVisible(),true);
   await page.keyboard.press('Enter');
   assert.equal(await page.locator('#chat-input').evaluate(input=>document.activeElement===input),true,'keyboard Enter opens and focuses the hidden Chat drawer');
   assert.equal(await page.locator('#main-ui-container').isVisible(),false);
   await page.keyboard.type('Hybrid keyboard chat');await page.keyboard.press('Enter');
   assert.match(await page.locator('#chat-log').innerText(),/Hybrid keyboard chat/);
   await page.keyboard.press('Escape');assert.equal(await page.locator('#chat-box').isVisible(),false);
   await page.keyboard.type('Shortcut chat');await page.keyboard.press('Enter');
   assert.match(await page.locator('#chat-log').innerText(),/Shortcut chat/);
   await page.keyboard.press('Escape');
   await page.evaluate(()=>{isFreeCam=true;});
   await page.keyboard.down('w');assert.equal(await page.evaluate(()=>keys.w),true);
   assert.equal(await page.locator('#chat-box').isVisible(),false,'movement keys keep their existing free-camera behavior');
   await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.keyboard.up('w');
   assert.equal(await page.evaluate(()=>Object.values(keys).some(Boolean)),false);
   await page.evaluate(()=>{isFreeCam=false;});
   await page.setViewportSize({width:1024,height:768});
   assert.equal(await page.locator('#mobile-toolbar').isVisible(),true,'resize and mouse/keyboard switching retain the touch controls');
   await page.evaluate(()=>saveProgressToStorage('hybrid-qa'));
   if(!process.env.HYBRID_QA_LIVE_HOME)await page.route('https://pazneria.github.io/arcade/',r=>r.fulfill({contentType:'text/html',body:'<title>Arcade test</title>Arcade'}));
   await page.locator('#mobile-home').click();await page.waitForURL('https://pazneria.github.io/arcade/');
   if(process.env.HYBRID_QA_LIVE_HOME)assert.match(await page.title(),/arcade/i);
   await page.goBack({waitUntil:'load',timeout:30000});
   await page.waitForFunction(()=>window.GameSessionRuntime&&GameSessionRuntime.getSession().progress.profile.name==='Hybrid QA');
   assert.equal(await page.locator('#player-entry-overlay').isVisible(),false,'Home retains the existing save');
   assert.deepEqual(errors,[]);
   const label=anyCoarse?'Fine primary + secondary coarse capability':'Fine-only reported capability + observed native touch fallback';
   results.push(label);console.log('PASS '+label+': touch onboarding, movement, Stop/Home, mouse, resize, keyboard chat/shortcuts/Escape, movement keys/blur and saved return');
   await context.close();
  }
  if(!process.env.HYBRID_QA_EXPECT_GAP){
   const desktop=await browser.newContext({viewport:{width:1280,height:800}});
   if(process.env.MOBILE_TAILWIND_SCRIPT)await desktop.route('https://cdn.tailwindcss.com/',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(process.env.MOBILE_TAILWIND_SCRIPT,'utf8')}));
   const page=await desktop.newPage();await page.goto(gameUrl,{waitUntil:'load',timeout:30000});
   await page.locator('#player-entry-name').fill('Mouse Tester');await page.locator('#player-entry-primary').click();
   assert.equal(await page.locator('#mobile-toolbar').isVisible(),false);
   assert.match(await page.locator('#chat-log').innerText(),/Tip: Left-click to move\. Right-click for actions\./,'mouse-only entry retains its existing instructions');
   assert.doesNotMatch(await page.locator('#chat-log').innerText(),/Touch: tap to move or act/);
   await page.keyboard.press('Enter');await page.keyboard.type('Desktop keys');await page.keyboard.press('Enter');
   assert.match(await page.locator('#chat-log').innerText(),/Desktop keys/);await page.keyboard.press('Escape');
   assert.equal(await page.locator('#mobile-toolbar').isVisible(),false);
   results.push('Fine-only desktop retains mouse onboarding, layout and keyboard chat');console.log('PASS fine-only desktop mouse onboarding, layout and keyboard chat');
   await desktop.close();
  }
 }finally{await browser.close();}
 if(process.env.HYBRID_QA_OUTPUT)fs.writeFileSync(process.env.HYBRID_QA_OUTPUT,JSON.stringify({gameUrl,results,simulatedHybrid:true,physicalHardware:false},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
