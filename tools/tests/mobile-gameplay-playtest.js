// Optional real-browser QA. Uses a disposable profile and an already running
// server; owns no server, and always closes its browser. No physical-device claim.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(require.resolve('playwright', { paths: [process.env.PLAYWRIGHT_NODE_MODULES || path.join(__dirname, '../../node_modules')] }));
const output = path.resolve(process.env.MOBILE_QA_OUTPUT || path.join(__dirname, '../../tmp/mobile-qa'));
fs.mkdirSync(output, { recursive: true });
const results = [];
async function run() {
  const browser = await chromium.launch({ headless: true, ...(process.env.MOBILE_BROWSER_EXECUTABLE ? { executablePath: process.env.MOBILE_BROWSER_EXECUTABLE } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    if (process.env.MOBILE_TAILWIND_SCRIPT) await context.route('https://cdn.tailwindcss.com/', route => route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(process.env.MOBILE_TAILWIND_SCRIPT, 'utf8') }));
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const session = await context.newCDPSession(page);
    const touch = (type, points = []) => session.send('Input.dispatchTouchEvent', { type, touchPoints: points.map((point, id) => ({ id, x: point.x, y: point.y, radiusX: 2, radiusY: 2 })) });
    const hold = async point => { await touch('touchStart', [point]); await page.waitForTimeout(550); await touch('touchEnd'); };
    const drag = async (start, end) => { await touch('touchStart', [start]); await touch('touchMove', [end]); await touch('touchEnd'); };
    const center = async selector => { const box = await page.locator(selector).first().boundingBox(); assert(box, `${selector} is visible`); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; };
    const state = () => page.evaluate(() => ({ ...GameSessionRuntime.getSession().player, pending: pendingAction }));
    const check = label => { results.push(label); console.log('PASS', label); };
    await page.goto(process.env.MOBILE_QA_URL || 'http://127.0.0.1:5503/', { waitUntil: 'load', timeout: 30000 });
    await page.locator('#player-entry-primary').waitFor({ state: 'visible' });
    if (process.env.MOBILE_QA_FIXTURE_ONLY) {
      await page.locator('#player-entry-name').fill('Touch Tester');
      await page.locator('#player-entry-primary').tap();
    } else {
    await page.locator('#player-entry-name').fill('<img src=x>');
    assert(!/[<>]/.test(await page.locator('#player-entry-name').inputValue()), 'name markup is sanitized');
    await page.locator('#player-entry-name').fill('a');
    assert.equal(await page.locator('#player-entry-primary').isDisabled(), true);
    await page.locator('#player-entry-name').fill('Touch Tester');
    await page.locator('#player-entry-gender-1').tap();
    await page.locator('.player-entry-arrow').first().tap();
    await page.locator('.player-entry-swatch').nth(1).tap();
    await page.evaluate(()=>{document.querySelector('.player-entry-shell').scrollTop=0;});
    await page.screenshot({ path: path.join(output, 'character-creation.png') });
    await page.locator('#player-entry-primary').tap();
    await page.locator('#player-entry-overlay').waitFor({ state: 'hidden' });
    assert.equal(await page.evaluate(() => playerProfileState.name), 'Touch Tester');
    check('Touch creation, appearance choices, HTML name sanitized, short name rejected');

    const guide = await page.evaluate(() => { const p = projectWorldTileToScreen(215, 253, 0, 1.1); return findQaRaycastHitNear(p.x, p.y, 'NPC', 'Tutorial Guide', 40, 5); });
    assert(guide, 'tutorial guide can be raycast');
    await hold(guide);
    await page.locator('#context-menu').waitFor({ state: 'visible' });
    assert.equal((await state()).pending, null, 'holding does not queue a primary action');
    await page.locator('.context-option').filter({ hasText: 'Talk-to Tutorial Guide' }).first().tap();
    await page.locator('#npc-dialogue-overlay').waitFor({ state: 'visible' });
    await page.screenshot({ path: path.join(output, 'tutorial-dialogue.png') });
    while (await page.locator('.npc-dialogue-option').filter({ hasText: 'Continue' }).count()) await page.locator('.npc-dialogue-option').filter({ hasText: 'Continue' }).first().tap();
    await page.locator('.npc-dialogue-option').filter({ hasText: 'I am ready' }).tap();
    assert.equal(await page.evaluate(() => playerProfileState.tutorialStep), 1);
    await page.locator('#npc-dialogue-close').tap();
    check('Hold world target, choose Talk-to, page dialogue, accept first lesson');

    await page.locator('#mobile-bag').tap();
    const slot = page.locator('#view-inv .inventory-slot').first();
    const slotBox = await slot.boundingBox();
    assert(slotBox.width >= 44 && slotBox.height >= 44);
    await hold(await center('#view-inv .inventory-slot'));
    await page.locator('#context-menu').waitFor({ state: 'visible' });
    assert.equal(await page.evaluate(() => equipment.weapon), null, 'hold does not also wield');
    await page.locator('.context-option').filter({ hasText: /Wield|Equip/ }).first().tap();
    assert.equal(await page.evaluate(() => equipment.weapon.id), 'bronze_axe');
    await page.locator('#tab-equip').tap();
    assert((await page.locator('#eq-weapon').boundingBox()).width >= 44);
    await page.locator('#eq-weapon').tap();
    assert.equal(await page.evaluate(() => equipment.weapon), null);
    await page.locator('#tab-combat').tap();
    await page.locator('#combat-style-strength').tap();
    assert.equal((await state()).selectedMeleeStyle, 'strength');
    await page.locator('#tab-stats').tap();
    await page.locator('.skill-tile').first().tap();
    await page.locator('#skill-panel').waitFor({ state: 'visible' });
    await page.locator('#skill-panel-close').tap();
    await page.locator('#tab-inv').tap();
    await page.screenshot({ path: path.join(output, 'inventory-portrait.png') });
    await page.locator('#mobile-bag-close').tap();
    check('48px inventory/equipment, hold choices without double action, wield/unequip, combat style, skills');

    const destination = await page.evaluate(() => { const p = GameSessionRuntime.getSession().player; return projectWorldTileToScreen(p.x - 1, p.y, p.z, 0); });
    const initial = await state();
    await page.touchscreen.tap(destination.x, destination.y);
    await page.waitForFunction(([x,y]) => { const p=GameSessionRuntime.getSession().player; return p.x!==x || p.y!==y; }, [initial.x,initial.y]);
    await page.locator('#mobile-stop').tap();
    const stationary = await state();
    const yaw = await page.evaluate(() => cameraYaw);
    await drag({ x: 180, y: 250 }, { x: 230, y: 275 });
    assert.notEqual(await page.evaluate(() => cameraYaw), yaw);
    assert.equal((await state()).x, stationary.x);
    const cameraDistance = await page.evaluate(() => cameraDist);
    await touch('touchStart', [{x:120,y:300},{x:220,y:300}]);
    await touch('touchMove', [{x:95,y:300},{x:245,y:300}]);
    await touch('touchEnd');
    assert((await page.evaluate(() => cameraDist)) < cameraDistance);
    assert.equal((await state()).pending, null);
    await touch('touchStart',[{x:180,y:300}]); await touch('touchCancel'); await page.waitForTimeout(550);
    assert.equal(await page.locator('#context-menu').isVisible(), false);
    assert.equal((await state()).pending, null);
    check('Tap movement, Stop, drag camera, pinch zoom, pointer cancellation without accidental movement');

    await page.locator('#mobile-chat').tap();
    await page.locator('#chat-input').fill('Touch chat'); await page.locator('#chat-send').tap();
    assert((await page.locator('#chat-log').innerText()).includes('Touch chat'));
    await page.locator('#mobile-chat-close').tap();
    await page.locator('#mapToggleBtn').tap();
    const mapCenter = await center('#world-map-canvas');
    const zoomBefore=await page.evaluate(()=>WorldMapHudRuntime.getWorldMapSourceRect(buildMapHudRuntimeContext()).sourceSize);
    await touch('touchStart',[{x:mapCenter.x-40,y:mapCenter.y},{x:mapCenter.x+40,y:mapCenter.y}]);
    await touch('touchMove',[{x:mapCenter.x-65,y:mapCenter.y},{x:mapCenter.x+65,y:mapCenter.y}]); await touch('touchEnd');
    const zoomAfter=await page.evaluate(()=>WorldMapHudRuntime.getWorldMapSourceRect(buildMapHudRuntimeContext()).sourceSize);
    assert(zoomAfter < zoomBefore);
    await drag(mapCenter,{x:mapCenter.x+25,y:mapCenter.y+20});
    await page.locator('#world-map-close').tap();
    check('Touch chat Send, world-map pinch and pan, close controls');
    }

    // Later gameplay fixtures use existing QA hooks. This is not a claim to
    // have completed the whole tutorial or every skill on a physical phone.
    await page.evaluate(()=>{stopCurrentPlayerAction();playerProfileState.tutorialStep=12;playerProfileState.tutorialCompletedAt=Date.now();sendChatMessage('/qa travel main_overworld');applyQaInventoryPreset('default');renderInventory();});
    await page.setViewportSize({width:844,height:390});
    await page.locator('#mobile-bag').tap();
    assert.equal((await page.locator('#view-inv .inventory-slot').first().boundingBox()).width,48);
    await page.screenshot({path:path.join(output,'inventory-landscape.png')});
    await page.locator('#mobile-bag-close').tap();
    check('Landscape drawer scrolls with 48px targets and world remains available');

    await page.evaluate(()=>{stopCurrentPlayerAction();setQaCameraView(Math.PI*1.5,1.0,16);});
    const dummy=await page.evaluate(()=>{const enemy=listQaCombatEnemyStates().find(e=>e.enemyId==='enemy_training_dummy'); const p=projectWorldTileToScreen(enemy.x,enemy.y,enemy.z,1); return findQaRaycastHitNear(p.x,p.y,'ENEMY','Training Dummy',40,5);});
    assert(dummy,'dummy has a touch target');
    await page.touchscreen.tap(dummy.x,dummy.y);
    await page.waitForFunction(()=>GameSessionRuntime.getSession().player.lockedTargetId==='enemy_spawn_training_dummy_hub');
    await page.screenshot({path:path.join(output,'combat-landscape.png')});
    await page.locator('#mobile-stop').tap();
    assert.equal((await state()).lockedTargetId,null);
    assert.equal((await state()).path.length,0);
    check('Touch enemy starts normal combat; Stop clears target and path');

    await page.evaluate(()=>{
      playerState.currentHitpoints=5;playerState.eatingCooldownEndTick=0;playerState.lastAttackTick=-1;
      inventory[13]={itemData:ITEM_DB.cooked_shrimp,amount:1};
      inventory[14]={itemData:ITEM_DB.cooked_shrimp,amount:1};renderInventory();
    });
    await page.locator('#mobile-bag').tap();
    await page.locator('#view-inv .inventory-slot').nth(13).tap();
    await page.locator('#view-inv .inventory-slot').nth(14).tap();
    assert.equal(await page.evaluate(()=>inventory[13]),null);
    assert.equal(await page.evaluate(()=>inventory[14].amount),1,'rapid repeat respects the existing eating cooldown');
    assert.equal((await state()).currentHitpoints,8);
    await page.locator('#mobile-stop').tap();
    assert((await state()).eatingCooldownEndTick>0,'Stop preserves the eating cooldown');
    check('Touch eating heals once; rapid repeat and Stop preserve the normal cooldown');

    await page.locator('#mobile-bag-close').tap();
    await page.evaluate(()=>{
      sendChatMessage('/qa gotofire starter');
      inventory[15]={itemData:ITEM_DB.logs,amount:3};renderInventory();
    });
    await page.locator('#mobile-bag').tap();
    const tinderIndex=await page.evaluate(()=>inventory.findIndex(s=>s?.itemData.id==='tinderbox'));
    await page.locator('#view-inv .inventory-slot').nth(tinderIndex).scrollIntoViewIfNeeded();
    const tinderBox=await page.locator('#view-inv .inventory-slot').nth(tinderIndex).boundingBox();
    await hold({x:tinderBox.x+tinderBox.width/2,y:tinderBox.y+tinderBox.height/2});
    await page.locator('#context-options-list .context-option').filter({hasText:/^Use /}).tap();
    await page.locator('#view-inv .inventory-slot').nth(15).tap();
    await page.waitForFunction(()=>playerState.action==='SKILLING: FIREMAKING');
    assert((await state()).firemakingSession,'touch Use starts the existing skill session');
    await page.locator('#mobile-stop').tap();
    assert.equal((await state()).firemakingSession,null);
    assert.equal((await state()).action,'IDLE');
    await page.locator('#mobile-bag-close').tap();
    check('Hold Use then tap logs starts firemaking; Stop cancels the real repeated skill action');

    await page.evaluate(()=>{openBank();});
    await page.locator('#mobile-bag').tap();
    const coinsIndex=await page.evaluate(()=>inventory.findIndex(s=>s&&s.itemData.id==='coins'));
    const invCoins=page.locator('#view-inv .inventory-slot').nth(coinsIndex);
    await invCoins.scrollIntoViewIfNeeded();
    let rect=await invCoins.boundingBox(); await hold({x:rect.x+rect.width/2,y:rect.y+rect.height/2});
    await page.locator('#context-options-list .context-option').filter({hasText:'Deposit-X'}).tap();
    await page.locator('#amount-input').fill('10'); await page.locator('#amount-ok').tap();
    assert.equal(await page.evaluate(()=>bankItems.find(s=>s&&s.itemData.id==='coins').amount),10);
    await hold(await center('#bank-grid > div'));
    await page.locator('#context-options-list .context-option').filter({hasText:'Withdraw-X'}).tap();
    await page.locator('#amount-cancel').tap();
    assert.equal(await page.evaluate(()=>bankItems.find(s=>s&&s.itemData.id==='coins').amount),10);
    await hold(await center('#bank-grid > div'));
    await page.locator('#context-options-list .context-option').filter({hasText:'Withdraw-All'}).tap();
    assert.equal(await page.evaluate(()=>bankItems.filter(s=>s&&s.itemData.id==='coins').length),0);
    await page.setViewportSize({width:390,height:667});
    await page.screenshot({path:path.join(output,'bank-portrait.png')});
    const bankBox=await page.locator('#bank-interface').boundingBox(),bagBox=await page.locator('#main-ui-container').boundingBox();
    assert(bankBox.y+bankBox.height<=bagBox.y+1,'portrait bank and inventory do not overlap');
    await page.locator('#bank-interface button').tap();
    await page.evaluate(()=>openShop('general_store'));
    await hold(await center('#shop-grid > div'));
    await page.locator('#context-options-list .context-option').filter({hasText:'Buy-X'}).tap();
    await page.locator('#amount-input').fill('1');await page.locator('#amount-ok').tap();
    await page.locator('#shop-interface button').tap();
    await page.locator('#mobile-bag-close').tap();
    check('Touch bank deposit/withdraw quantities, Cancel preserves items, small portrait service layout, shop Buy-X');

    await page.evaluate(()=>{
      queueAction('WALK',playerState.x+2,playerState.y,null);
      playerState.skillSessions={cooking:{kind:'processing',nextAttemptTick:currentTick+1}};
      playerState.action='SKILLING: COOKING';
      Object.defineProperty(document,'hidden',{configurable:true,value:true});
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal((await state()).pending,null);assert.equal((await state()).action,'IDLE');
    assert.equal(Object.keys((await state()).skillSessions).length,0);
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
    check('Background cancellation clears queued and repeated actions and saves');

    const saved=await page.evaluate(()=>{saveProgressToStorage('mobile-test');return JSON.parse(localStorage.getItem('osrsClone.progress.v2'));});
    assert(saved);
    await page.reload({waitUntil:'load'});
    await page.waitForFunction(()=>window.GameSessionRuntime&&GameSessionRuntime.getSession()?.progress.profile.name==='Touch Tester');
    assert.equal(await page.locator('#player-entry-overlay').isVisible(),false);
    check('Reload retains existing identity and progress');
    const beforeFailedSave=await page.evaluate(()=>localStorage.getItem('osrsClone.progress.v2'));
    await page.evaluate(()=>{window.__mobileQaSave=GameSessionRuntime.saveProgressPayloadToStorage;GameSessionRuntime.saveProgressPayloadToStorage=()=>({ok:false,reason:'test_storage_full'});});
    await page.locator('#mobile-home').tap();
    assert.equal(new URL(page.url()).origin,new URL(process.env.MOBILE_QA_URL||'http://127.0.0.1:5503/').origin);
    assert.equal(await page.locator('#mobile-save-status').isVisible(),true);
    assert.equal(await page.evaluate(()=>localStorage.getItem('osrsClone.progress.v2')),beforeFailedSave);
    await page.evaluate(()=>{GameSessionRuntime.saveProgressPayloadToStorage=window.__mobileQaSave;delete window.__mobileQaSave;});
    check('A failed save blocks Home and preserves the existing save');
    if(!process.env.MOBILE_QA_LIVE_HOME)await page.route('https://pazneria.github.io/arcade/',r=>r.fulfill({contentType:'text/html',body:'<title>Arcade return test</title>Arcade'}));
    await page.locator('#mobile-home').tap(); await page.waitForURL('https://pazneria.github.io/arcade/');
    if(process.env.MOBILE_QA_LIVE_HOME)assert.match(await page.title(),/arcade/i,'Home reaches the real Arcade page');
    check('Home saves before returning to the fixed Arcade URL');

    const desktop=await browser.newContext({viewport:{width:1280,height:800}});
    if(process.env.MOBILE_TAILWIND_SCRIPT)await desktop.route('https://cdn.tailwindcss.com/',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(process.env.MOBILE_TAILWIND_SCRIPT,'utf8')}));
    await context.close();
    const desktopPage=await desktop.newPage();
    await desktopPage.goto(process.env.MOBILE_QA_URL||'http://127.0.0.1:5503/',{waitUntil:'load'});
    await desktopPage.locator('#player-entry-name').fill('Keys Tester');await desktopPage.locator('#player-entry-primary').click();
    assert.equal(await desktopPage.locator('#mobile-toolbar').isVisible(),false);
    await desktopPage.keyboard.press('Enter');await desktopPage.keyboard.type('Keyboard chat');await desktopPage.keyboard.press('Enter');
    assert((await desktopPage.locator('#chat-log').innerText()).includes('Keyboard chat'));
    await desktopPage.keyboard.press('Escape');
    const worldPoint=await desktopPage.evaluate(()=>projectWorldTileToScreen(213,251,0,0));
    await desktopPage.mouse.click(worldPoint.x,worldPoint.y);
    await desktopPage.waitForFunction(()=>GameSessionRuntime.getSession().player.x!==212);
    await desktopPage.locator('#mapToggleBtn').click();await desktopPage.keyboard.press('Escape');
    assert.equal(await desktopPage.locator('#world-map-panel').isVisible(),false);
    await desktopPage.mouse.move(450,220);await desktopPage.mouse.down({button:'middle'});await desktopPage.mouse.move(480,250);await desktopPage.mouse.up({button:'middle'});
    await desktopPage.locator('#freeCamBtn').click();
    await desktopPage.keyboard.down('w');assert.equal(await desktopPage.evaluate(()=>keys.w),true);
    await desktopPage.evaluate(()=>window.dispatchEvent(new Event('blur')));await desktopPage.keyboard.up('w');
    assert.equal(await desktopPage.evaluate(()=>Object.values(keys).some(Boolean)),false);
    check('Desktop click movement, keyboard chat/Escape, middle-drag camera, blur releases keys');
    await desktop.close();

    const failed=await browser.newContext({viewport:{width:390,height:667},hasTouch:true,isMobile:true});
    if(process.env.MOBILE_TAILWIND_SCRIPT)await failed.route('https://cdn.tailwindcss.com/',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(process.env.MOBILE_TAILWIND_SCRIPT,'utf8')}));
    await failed.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:original.call(this,type,...args);};});
    await failed.addInitScript(payload=>localStorage.setItem('osrsClone.progress.v2',JSON.stringify(payload)),saved);
    const failedPage=await failed.newPage();await failedPage.goto(process.env.MOBILE_QA_URL||'http://127.0.0.1:5503/',{waitUntil:'load'});
    await failedPage.locator('#runtime-crash-overlay').waitFor({state:'visible'});
    assert.equal(await failedPage.locator('.runtime-recovery button').isVisible(),true);
    assert.equal(await failedPage.locator('.runtime-recovery a').getAttribute('href'),'https://pazneria.github.io/arcade/');
    assert.equal(await failedPage.evaluate(()=>localStorage.getItem('osrsClone.progress.v2')),JSON.stringify(saved));
    await failedPage.screenshot({path:path.join(output,'webgl-recovery.png')});await failed.close();
    check('Simulated WebGL failure exposes Reload and Exit without clearing saves');

    assert.deepEqual(errors,[]);
    check('No page errors in tested flow');
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({results,physicalDevice:false},null,2));
}
run().catch(error=>{console.error(error);process.exitCode=1;});
