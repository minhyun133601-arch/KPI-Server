export function bindDragScroll(element) {
  if (element.dataset.dragBound === 'true') {
    return;
  }
  element.dataset.dragBound = 'true';
  const dragThreshold = 4;
  const dragSpeed = 1.45;
  const edgeZone = 28;
  const edgeBoostMax = 18;
  let active = false;
  let dragging = false;
  let pointerId = null;
  let activePointerType = 'mouse';
  let startX = 0;
  let startY = 0;
  let scrollLeft = 0;
  let scrollTop = 0;
  let lastClientX = 0;
  let lastClientY = 0;
  let edgeFrame = 0;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const edgeDelta = (position, min, max) => {
    if (position < min + edgeZone) {
      const ratio = (min + edgeZone - position) / edgeZone;
      return -Math.ceil(clamp(ratio, 0, 1) * edgeBoostMax);
    }
    if (position > max - edgeZone) {
      const ratio = (position - (max - edgeZone)) / edgeZone;
      return Math.ceil(clamp(ratio, 0, 1) * edgeBoostMax);
    }
    return 0;
  };
  const stopEdgeScroll = () => {
    if (!edgeFrame) {
      return;
    }
    cancelAnimationFrame(edgeFrame);
    edgeFrame = 0;
  };
  const runEdgeScroll = () => {
    if (!(active && dragging)) {
      edgeFrame = 0;
      return;
    }
    const rect = element.getBoundingClientRect();
    const extraX = edgeDelta(lastClientX, rect.left, rect.right);
    const extraY = edgeDelta(lastClientY, rect.top, rect.bottom);
    if (extraX || extraY) {
      scrollLeft += extraX;
      scrollTop += extraY;
      element.scrollLeft += extraX;
      element.scrollTop += extraY;
    }
    edgeFrame = requestAnimationFrame(runEdgeScroll);
  };
  const ensureEdgeScroll = () => {
    if (!edgeFrame) {
      edgeFrame = requestAnimationFrame(runEdgeScroll);
    }
  };
  const stop = () => {
    if (!active) {
      return;
    }
    active = false;
    dragging = false;
    pointerId = null;
    stopEdgeScroll();
    element.classList.remove('is-dragging');
  };
  const start = (clientX, clientY, nextPointerId = null, nextPointerType = 'mouse') => {
    active = true;
    dragging = false;
    pointerId = nextPointerId;
    activePointerType = nextPointerType || 'mouse';
    startX = clientX;
    startY = clientY;
    scrollLeft = element.scrollLeft;
    scrollTop = element.scrollTop;
    lastClientX = clientX;
    lastClientY = clientY;
  };
  const move = (clientX, clientY, event) => {
    if (!active) {
      return;
    }
    lastClientX = clientX;
    lastClientY = clientY;
    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    if (!dragging && (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold)) {
      dragging = true;
      element.classList.add('is-dragging');
    }

    if (!dragging) {
      return;
    }

    event.preventDefault();
    const direction = activePointerType === 'touch' ? -1 : 1;
    element.scrollLeft = scrollLeft + (deltaX * dragSpeed * direction);
    element.scrollTop = scrollTop + (deltaY * dragSpeed * direction);
    ensureEdgeScroll();
  };
  element.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType !== 'touch') {
      return;
    }
    start(event.clientX, event.clientY, event.pointerId, event.pointerType);
    if (typeof element.setPointerCapture === 'function') {
      element.setPointerCapture(event.pointerId);
    }
    event.preventDefault();
  });
  element.addEventListener('pointermove', (event) => {
    if (pointerId !== null && event.pointerId !== pointerId) {
      return;
    }
    move(event.clientX, event.clientY, event);
  });
  const finishPointer = (event) => {
    if (pointerId !== null && event.pointerId !== pointerId) {
      return;
    }
    stop();
  };
  element.addEventListener('pointerup', finishPointer);
  element.addEventListener('pointercancel', finishPointer);
  element.addEventListener('lostpointercapture', stop);
  element.addEventListener('dragstart', (event) => {
    event.preventDefault();
  });
}
