export interface TouchPoint { x: number; y: number }
export interface TouchSurfaceOptions {
  onTap?: (point: TouchPoint) => void;
  onHold?: (point: TouchPoint) => void;
  onDragStart?: (point: TouchPoint) => void;
  onDrag?: (dx: number, dy: number, point: TouchPoint) => void;
  onPinch?: (ratio: number, center: TouchPoint) => void;
  onEnd?: () => void;
}

// Touch commits actions on release. A drag, pinch, cancellation or hold can
// never also become a tap. Mouse handlers remain owned by the existing shell.
export function bindTouchSurface(element: HTMLElement, options: TouchSurfaceOptions): () => void {
  const points = new Map<number, TouchPoint>();
  let origin: TouchPoint | null = null;
  let moved = false;
  let held = false;
  let multi = false;
  let pinchDistance = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastTouchTime = 0;
  const clearTimer = () => { clearTimeout(timer); timer = undefined; };
  const end = () => {
    clearTimer();
    const ids = [...points.keys()];
    points.clear();
    origin = null;
    for (const id of ids) if (element.hasPointerCapture(id)) element.releasePointerCapture(id);
    options.onEnd?.();
  };
  const distance = () => {
    const [a, b] = [...points.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  const down = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') return;
    event.preventDefault();
    lastTouchTime = Date.now();
    const point = { x: event.clientX, y: event.clientY };
    points.set(event.pointerId, point);
    element.setPointerCapture(event.pointerId);
    if (points.size === 1) {
      origin = point;
      moved = held = multi = false;
      if (options.onHold) timer = setTimeout(() => {
        if (!origin || moved || multi) return;
        held = true;
        options.onHold?.(origin);
      }, 500);
    } else {
      multi = true;
      clearTimer();
      pinchDistance = distance();
      options.onEnd?.();
    }
  };
  const move = (event: PointerEvent) => {
    const previous = points.get(event.pointerId);
    if (!previous) return;
    event.preventDefault();
    const point = { x: event.clientX, y: event.clientY };
    points.set(event.pointerId, point);
    if (multi) {
      const nextDistance = distance();
      if (pinchDistance > 0 && nextDistance > 0) {
        const [a, b] = [...points.values()];
        options.onPinch?.(nextDistance / pinchDistance, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      }
      pinchDistance = nextDistance;
      return;
    }
    if (!origin || held) return;
    if (!moved && Math.hypot(point.x - origin.x, point.y - origin.y) >= 10) {
      moved = true;
      clearTimer();
      options.onDragStart?.(origin);
      options.onDrag?.(point.x - origin.x, point.y - origin.y, point);
    } else if (moved) options.onDrag?.(point.x - previous.x, point.y - previous.y, point);
  };
  const up = (event: PointerEvent) => {
    if (!points.has(event.pointerId)) return;
    event.preventDefault();
    lastTouchTime = Date.now();
    clearTimer();
    const tap = points.size === 1 && !moved && !held && !multi;
    points.delete(event.pointerId);
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    if (points.size === 0) {
      origin = null;
      options.onEnd?.();
      if (tap) options.onTap?.({ x: event.clientX, y: event.clientY });
    }
  };
  const lost = (event: PointerEvent) => { if (points.has(event.pointerId)) end(); };
  const nativeMenu = (event: Event) => {
    if (Date.now() - lastTouchTime < 1000) { event.preventDefault(); event.stopImmediatePropagation(); }
  };
  const hidden = () => { if (document.hidden) end(); };
  element.addEventListener('pointerdown', down);
  element.addEventListener('pointermove', move);
  element.addEventListener('pointerup', up);
  element.addEventListener('pointercancel', end);
  element.addEventListener('lostpointercapture', lost);
  element.addEventListener('contextmenu', nativeMenu, true);
  window.addEventListener('blur', end);
  window.addEventListener('resize', end);
  document.addEventListener('visibilitychange', hidden);
  return () => {
    end();
    element.removeEventListener('pointerdown', down);
    element.removeEventListener('pointermove', move);
    element.removeEventListener('pointerup', up);
    element.removeEventListener('pointercancel', end);
    element.removeEventListener('lostpointercapture', lost);
    element.removeEventListener('contextmenu', nativeMenu, true);
    window.removeEventListener('blur', end);
    window.removeEventListener('resize', end);
    document.removeEventListener('visibilitychange', hidden);
  };
}

// Delegation survives inventory/bank/equipment re-renders and leaves native
// scrolling and ordinary single-tap item actions intact.
export function bindTouchItemMenus(): void {
  let press: { element: HTMLElement; id: number; x: number; y: number; held: boolean } | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let suppressClick: { element: HTMLElement; id: number; until: number } | null = null;
  const cancel = () => {
    clearTimeout(timer);
    const previous = press;
    press = null;
    if (previous?.element.hasPointerCapture(previous.id)) previous.element.releasePointerCapture(previous.id);
  };
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    if (press) { cancel(); return; }
    // A new contact may reuse the same pointer ID (notably on mobile browsers).
    // Only the previous hold's compatibility click must be suppressed.
    suppressClick = null;
    const element = (event.target as Element).closest<HTMLElement>('.inventory-slot, .equip-slot, #bank-grid > div, #shop-grid > div');
    if (!element?.oncontextmenu) return;
    press = { element, id: event.pointerId, x: event.clientX, y: event.clientY, held: false };
    timer = setTimeout(() => {
      if (!press || !press.element.isConnected) return;
      press.held = true;
      // Keep release on the held slot, even when the menu covers that finger.
      press.element.setPointerCapture(press.id);
      suppressClick = { element: press.element, id: press.id, until: Date.now() + 1500 };
      press.element.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: press.x, clientY: press.y, button: 2 }));
    }, 500);
  }, true);
  document.addEventListener('pointermove', event => {
    if (press?.id === event.pointerId && Math.hypot(event.clientX - press.x, event.clientY - press.y) >= 10) cancel();
  }, true);
  document.addEventListener('pointerup', event => {
    if (press?.id !== event.pointerId) return;
    if (press.held) { event.preventDefault(); suppressClick = { element: press.element, id: press.id, until: Date.now() + 800 }; }
    cancel();
  }, true);
  document.addEventListener('click', event => {
    if (suppressClick && Date.now() < suppressClick.until && (event.pointerId === suppressClick.id || suppressClick.element.contains(event.target as Node))) {
      event.preventDefault(); event.stopImmediatePropagation(); suppressClick = null;
    }
  }, true);
  document.addEventListener('contextmenu', event => {
    if (event.isTrusted && (press || (suppressClick && Date.now() < suppressClick.until))) {
      event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener('pointercancel', cancel, true);
  document.addEventListener('scroll', cancel, true);
  document.addEventListener('visibilitychange', cancel);
  window.addEventListener('blur', cancel);
  window.addEventListener('resize', cancel);
}
