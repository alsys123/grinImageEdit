// -------------------------
// Touch controls and also dragging using the mouse
// -------------------------


let lastTapTime = 0;

// -------------------------
// Pinch to Zoom (iPad)
// -------------------------

let pinchStartDist = null;
let pinchStartScale = 1;
let currentScale = 1;

// for panning
let panX = 0;
let panY = 0;
let pinchMidStart = null;

function getPinchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/* working
function applyTransform() {
    // Clamp: can't go below 1 (original size), max 5x zoom in
    currentScale = Math.max(1, Math.min(5, currentScale));
    canvas.style.transform = `scale(${currentScale})`;
    
//    canvas.style.transformOrigin = "0 0";

    
}
*/
function applyTransform() {
    // Clamp zoom
    currentScale = Math.max(1, Math.min(5, currentScale));

    canvas.style.transform =
        `translate(${panX}px, ${panY}px) scale(${currentScale})`;

    canvas.style.transformOrigin = "0 0";
}

function getPinchMid(touches) {
    return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2
    };
}

// -------------------------
// Selection (touch)
// -------------------------
canvas.addEventListener('touchstart', e => {
   
    if (!hasImage || pasteMode) return; // i moved this up from after pinch
    
    if (e.touches.length === 2) {
	e.preventDefault();
	isSelecting = false;
	pinchStartDist = getPinchDist(e.touches);
	pinchStartScale = currentScale;

	// pan code here
	pinchMidStart = getPinchMid(e.touches);
	pinchStartPanX = panX;
	pinchStartPanY = panY;
	
	//	return;
    } // pinch
    
    
    e.preventDefault();
    
    const t = e.touches[0];
    const pos = getCanvasCoords(t.clientX, t.clientY);

    startX = pos.x;
    startY = pos.y;
    currentX = pos.x;
    currentY = pos.y;

    isSelecting = true;

});
/* orig
canvas.addEventListener('touchmove', e => {
    if (!isSelecting || !hasImage || pasteMode) return;

    if (e.touches.length === 2) {
    e.preventDefault();
    const dist = getPinchDist(e.touches);
    currentScale = pinchStartScale * (dist / pinchStartDist);
	applyTransform();
	return; // ⭐ stop here — no selection, no dragging
  } // pinch

    e.preventDefault();

    const t = e.touches[0];
    const pos = getCanvasCoords(t.clientX, t.clientY);

    currentX = pos.x;
    currentY = pos.y;

    redraw();
    drawSelectionRect();
});
*/
canvas.addEventListener('touchmove', e => {

    // 1. Pinch zoom
    if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getPinchDist(e.touches);
        currentScale = pinchStartScale * (dist / pinchStartDist);

	//pan code here
	const mid = getPinchMid(e.touches);
	// Pan follows the midpoint movement
	panX = pinchStartPanX + (mid.x - pinchMidStart.x);
	panY = pinchStartPanY + (mid.y - pinchMidStart.y);
	
	applyTransform();
        return; // ⭐ stop here — no selection, no dragging
    }

    // 2. Dragging pasted object
    if (draggingPasted && pastedSelected) {
        const t = e.touches[0];
        const pos = getCanvasCoords(t.clientX, t.clientY);

        pastedObject.x = pos.x - dragOffsetX;
        pastedObject.y = pos.y - dragOffsetY;

        redraw();
        drawPastedOutline();
        return;
    }

    // 3. Selection
    if (isSelecting && hasImage && !pasteMode) {
        e.preventDefault();
        const t = e.touches[0];
        const pos = getCanvasCoords(t.clientX, t.clientY);

        currentX = pos.x;
        currentY = pos.y;

        redraw();
        drawSelectionRect();
    }
});

canvas.addEventListener('touchend', e => {

    if (e.touches.length < 2) {
	pinchStartDist = null;
    }//pinch
    
    if (!pasteMode) finishSelection();

    // new merge with other touchend
    
    // Finish selection
    if (!pasteMode && isSelecting) {
        finishSelection();
    }

    // ⭐ Ignore double-tap logic if pinch or multi-touch was used
    if (e.changedTouches.length > 1 || e.touches.length > 0) {
        lastTapTime = 0;
        return;
    }
    
    // Double tap
    const now = Date.now();
    if (now - lastTapTime < 300) {
        activatePasteMode();
    }
    lastTapTime = now;

    draggingPasted = false;
});

// -------------------------
// Dragging pasted object
// -------------------------
/* dupicate
canvas.addEventListener('touchmove', e => {
    if (!draggingPasted || !pastedSelected) return;

    const t = e.touches[0];
    const pos = getCanvasCoords(t.clientX, t.clientY);

    pastedObject.x = pos.x - dragOffsetX;
    pastedObject.y = pos.y - dragOffsetY;

    redraw();
    drawPastedOutline();
    
});
*/
/*
canvas.addEventListener('touchend', () => {
    draggingPasted = false;
});



canvas.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTapTime < 300) {   // double-tap threshold
        activatePasteMode();
    }
    lastTapTime = now;
    
//    dei("pasteModeBtn").textContent = "Tap to Paste";

});
*/
