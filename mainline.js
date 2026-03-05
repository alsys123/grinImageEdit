
/*

  MAINLINE
  
*/

const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const copyBtn = document.getElementById('copyBtn');
const cutBtn = document.getElementById('cutBtn');
const pasteModeBtn = document.getElementById('pasteModeBtn');
const exportBtn = document.getElementById('exportBtn');

let img = new Image();
let hasImage = false;

let isSelecting = false;
let pasteMode = false;

let startX = 0, startY = 0;
let currentX = 0, currentY = 0;

let selection = null;
let clipboard = null;

// Pasted object state
let pastedObject = null;
let pastedSelected = false;
let draggingPasted = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

function activatePasteMode() {
    if (!clipboard) return;  // can't paste without something copied

    pasteMode = true;
    pasteModeBtn.classList.add('active');

    // clear selection mode
    selection = null;
    isSelecting = false;

    // clear pasted-object selection
    pastedSelected = false;
    draggingPasted = false;

    safeRedraw();
}

// -------------------------
// Load image
// -------------------------
fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
	img = new Image();
	img.onload = () => {
	    canvas.width = img.width;
	    canvas.height = img.height;
	    ctx.drawImage(img, 0, 0);
	    hasImage = true;

	    selection = null;
	    clipboard = null;
	    pastedObject = null;
	    pastedSelected = false;

	    copyBtn.disabled = true;
	    cutBtn.disabled = true;
	    pasteModeBtn.disabled = true;

	    redraw();
	};
	img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

// -------------------------
// Coordinate correction
// -------------------------
function getCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
	x: (clientX - rect.left) * scaleX,
	y: (clientY - rect.top) * scaleY
    };
}

// -------------------------
// Selection (mouse)
// -------------------------
canvas.addEventListener('mousedown', e => {
    if (!hasImage || pasteMode) return;

    const pos = getCanvasCoords(e.clientX, e.clientY);
    startX = pos.x;
    startY = pos.y;
    currentX = pos.x;
    currentY = pos.y;

    isSelecting = true;
});

canvas.addEventListener('mousemove', e => {
    if (!isSelecting || !hasImage || pasteMode) return;

    const pos = getCanvasCoords(e.clientX, e.clientY);
    currentX = pos.x;
    currentY = pos.y;

    redraw();
    drawSelectionRect();
});

canvas.addEventListener('mouseup', () => finishSelection());

// -------------------------
// Selection (touch)
// -------------------------
canvas.addEventListener('touchstart', e => {
    if (!hasImage || pasteMode) return;
    e.preventDefault();

    const t = e.touches[0];
    const pos = getCanvasCoords(t.clientX, t.clientY);

    startX = pos.x;
    startY = pos.y;
    currentX = pos.x;
    currentY = pos.y;

    isSelecting = true;
});

canvas.addEventListener('touchmove', e => {
    if (!isSelecting || !hasImage || pasteMode) return;
    e.preventDefault();

    const t = e.touches[0];
    const pos = getCanvasCoords(t.clientX, t.clientY);

    currentX = pos.x;
    currentY = pos.y;

    redraw();
    drawSelectionRect();
});

canvas.addEventListener('touchend', e => {
    if (!pasteMode) finishSelection();
});

// -------------------------
// Paste Mode tap handler
// -------------------------
canvas.addEventListener('click', e => {
    if (!pasteMode) return;

    const pos = getCanvasCoords(e.clientX, e.clientY);
    handlePasteModeTap(pos.x, pos.y);
});

canvas.addEventListener('touchstart', e => {
    if (!pasteMode) return;

    const t = e.touches[0];
    const pos = getCanvasCoords(t.clientX, t.clientY);
    handlePasteModeTap(pos.x, pos.y);
});

// -------------------------
// Handle tap in Paste Mode
// -------------------------
function handlePasteModeTap(x, y) {
    if (!clipboard) return;

    // Tap inside pasted object → select it
    if (pastedObject && isInsidePastedObject(x, y)) {
	pastedSelected = true;
	draggingPasted = true;
	dragOffsetX = x - pastedObject.x;
	dragOffsetY = y - pastedObject.y;
	redraw();
	drawPastedOutline();
	return;
    }

    // Tap outside → paste new object
    pastedObject = {
	data: clipboard,
	x: x,
	y: y,
	w: clipboard.width,
	h: clipboard.height
    };

    pastedSelected = false;
    draggingPasted = false;

    safeRedraw();
}

// -------------------------
// Dragging pasted object
// -------------------------
canvas.addEventListener('touchmove', e => {
    if (!draggingPasted || !pastedSelected) return;

    const t = e.touches[0];
    const pos = getCanvasCoords(t.clientX, t.clientY);

    pastedObject.x = pos.x - dragOffsetX;
    pastedObject.y = pos.y - dragOffsetY;

    redraw();
    drawPastedOutline();
});

canvas.addEventListener('touchend', () => {
    draggingPasted = false;
});

// -------------------------
// Finish selection
// -------------------------
function finishSelection() {
    if (!isSelecting || !hasImage) return;

    isSelecting = false;

    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    const w = Math.abs(currentX - startX);
    const h = Math.abs(currentY - startY);

    if (w > 0 && h > 0) {
	selection = { x, y, w, h };
	copyBtn.disabled = false;
	cutBtn.disabled = false;
    } else {
	selection = null;
	copyBtn.disabled = true;
	cutBtn.disabled = true;
    }

    redraw();
//    if (selection) drawSelectionRect();
}

// -------------------------
// Copy / Cut
// -------------------------
copyBtn.addEventListener('click', () => {
    if (!selection) return;

    clipboard = ctx.getImageData(selection.x, selection.y, selection.w, selection.h);
    pasteModeBtn.disabled = false;

    safeRedraw();
});

cutBtn.addEventListener('click', () => {
    if (!selection) return;

    clipboard = ctx.getImageData(selection.x, selection.y, selection.w, selection.h);
    ctx.clearRect(selection.x, selection.y, selection.w, selection.h);

    redraw(); // remove overlays

    img.src = canvas.toDataURL();

    selection = null;
    isSelecting = false;

    copyBtn.disabled = true;
    cutBtn.disabled = true;
    pasteModeBtn.disabled = false;

    safeRedraw();
});

// -------------------------
// Paste Mode toggle
// -------------------------
pasteModeBtn.addEventListener('click', () => {
    if (!clipboard) return;
    
    pasteMode = !pasteMode;
    pasteModeBtn.classList.toggle('active', pasteMode);
    
    if (pasteMode) {
	// Entering paste mode
	selection = null;
	isSelecting = false;
	safeRedraw();
    } else {
	
	redraw(); // clears canvas + redraws base image
	
	// Leaving paste mode → MERGE pasted object into image
	if (pastedObject) {
	    ctx.putImageData(pastedObject.data, pastedObject.x, pastedObject.y);
	}

	img.src = canvas.toDataURL(); // update base image
	
	// Clear pasted-object state
	pastedObject = null;
	pastedSelected = false;
	draggingPasted = false;
	
	safeRedraw();
    }
});

// -------------------------
// Export PNG
// -------------------------
exportBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = "image.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

// -------------------------
// Drawing helpers
// -------------------------
function redraw() {
    if (!hasImage) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (pastedObject) {
	ctx.putImageData(pastedObject.data, pastedObject.x, pastedObject.y);
    }
}//redraw

//function safeRedraw() {
//  setTimeout(() => { redraw(); redraw(); }, 10);
//}
function safeRedraw() {
    setTimeout(() => {
	redraw();
	if (isSelecting || selection) drawSelectionRect();
	if (pastedSelected) drawPastedOutline();
    }, 10);
}

function drawSelectionRect() {
    if (!selection && !isSelecting) return;

    const x = isSelecting ? Math.min(startX, currentX) : selection.x;
    const y = isSelecting ? Math.min(startY, currentY) : selection.y;
    const w = isSelecting ? Math.abs(currentX - startX) : selection.w;
    const h = isSelecting ? Math.abs(currentY - startY) : selection.h;

    ctx.save();
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
}

function drawPastedOutline() {
    if (!pastedSelected || !pastedObject) return;

    ctx.save();
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(
	pastedObject.x,
	pastedObject.y,
	pastedObject.w,
	pastedObject.h
    );
    ctx.restore();
}

function isInsidePastedObject(x, y) {
    if (!pastedObject) return false;
    return (
	x >= pastedObject.x &&
	    y >= pastedObject.y &&
	    x <= pastedObject.x + pastedObject.w &&
	    y <= pastedObject.y + pastedObject.h
    );
}

// -------------------------
// Double-tap / double-click to activate Paste Mode
// -------------------------
let lastTapTime = 0;

canvas.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTapTime < 300) {   // double-tap threshold
        activatePasteMode();
    }
    lastTapTime = now;
});

canvas.addEventListener('dblclick', e => {
    activatePasteMode();
});
