const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(file, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '../../src/game/input', file), 'utf8');
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports, ...globals });
  return exports;
}
class Surface extends EventTarget {
  constructor() { super(); this.captured = new Set(); }
  setPointerCapture(id) { this.captured.add(id); }
  hasPointerCapture(id) { return this.captured.has(id); }
  releasePointerCapture(id) { this.captured.delete(id); }
}
const documentRef = new EventTarget();
documentRef.hidden = false;
const windowRef = new EventTarget();
const timers = new Map();
let nextTimer = 1;
const { bindTouchSurface } = loadModule('touch.ts', {
  document: documentRef, window: windowRef, Date,
  setTimeout: callback => { const id = nextTimer++; timers.set(id, callback); return id; },
  clearTimeout: id => timers.delete(id)
});
const surface = new Surface();
const calls = [];
const dispose = bindTouchSurface(surface, {
  onTap: point => calls.push(['tap', point.x, point.y]),
  onHold: point => calls.push(['hold', point.x, point.y]),
  onDragStart: () => calls.push(['drag-start']),
  onDrag: (x, y) => calls.push(['drag', x, y]),
  onPinch: ratio => calls.push(['pinch', ratio]),
  onEnd: () => calls.push(['end'])
});
function pointer(type, id = 1, x = 100, y = 100, pointerType = 'touch') {
  const event = new Event(type, { cancelable: true });
  Object.assign(event, { pointerId: id, clientX: x, clientY: y, pointerType });
  surface.dispatchEvent(event);
  return event;
}
function reset() { calls.length = 0; }
function count(name) { return calls.filter(call => call[0] === name).length; }
function fireTimers() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(callback => callback()); }
pointer('pointerdown'); pointer('pointerup');
assert.equal(count('tap'), 1, 'one released touch commits exactly one action');
reset(); pointer('pointerdown'); pointer('pointermove', 1, 125, 108); pointer('pointerup', 1, 125, 108); fireTimers();
assert.equal(count('tap'), 0); assert.equal(count('hold'), 0); assert.equal(count('drag-start'), 1);
reset(); pointer('pointerdown'); pointer('pointerdown', 2, 200, 100); pointer('pointermove', 2, 240, 100); pointer('pointerup', 2, 240, 100); pointer('pointerup');
assert.equal(count('pinch'), 1); assert.equal(count('tap'), 0); assert.equal(count('hold'), 0);
reset(); pointer('pointerdown'); fireTimers(); pointer('pointerup');
assert.equal(count('hold'), 1); assert.equal(count('tap'), 0);
for (const cancellation of ['pointercancel', 'lostpointercapture', 'blur', 'resize', 'visibilitychange']) {
  reset(); pointer('pointerdown');
  if (cancellation === 'blur' || cancellation === 'resize') windowRef.dispatchEvent(new Event(cancellation));
  else if (cancellation === 'visibilitychange') { documentRef.hidden = true; documentRef.dispatchEvent(new Event(cancellation)); documentRef.hidden = false; }
  else pointer(cancellation);
  fireTimers(); pointer('pointerup');
  assert.equal(count('tap'), 0, `${cancellation} must cancel a pending tap`);
  assert.equal(count('hold'), 0, `${cancellation} must cancel a pending hold`);
  assert.equal(surface.captured.size, 0, `${cancellation} must release captures`);
}
reset(); assert.equal(pointer('pointerdown', 1, 100, 100, 'mouse').defaultPrevented, false);
pointer('pointerup', 1, 100, 100, 'mouse'); assert.equal(count('tap'), 0);
pointer('pointerdown'); dispose(); fireTimers(); pointer('pointerup'); assert.equal(count('tap'), 0);

const { stopPlayerAction } = loadModule('stop-action.ts');
const player = { x: 4, y: 9, path: [{ x: 8, y: 9 }], action: 'SKILLING: FIREMAKING', skillSessions: { cooking: {} }, pendingSkillStart: {}, pendingActionAfterTurn: 'INTERACT', firemakingSession: {}, turnLock: true, currentHitpoints: 8, eatingCooldownEndTick: 31, remainingAttackCooldown: 2, unlockFlags: { gemMineUnlocked: true } };
stopPlayerAction(player);
assert.equal(player.action, 'IDLE'); assert.equal(player.path.length, 0); assert.equal(Object.keys(player.skillSessions).length, 0);
assert.equal(player.pendingSkillStart, null); assert.equal(player.pendingActionAfterTurn, null); assert.equal(player.firemakingSession, null);
assert.equal(player.currentHitpoints, 8); assert.equal(player.eatingCooldownEndTick, 31); assert.equal(player.remainingAttackCooldown, 2);
assert.equal(player.unlockFlags.gemMineUnlocked, true, 'Stop preserves progression and combat cooldowns');
console.log('Touch input runtime tests passed (tap, drag, hold, pinch, cancellation, lifecycle, mouse, stop).');
