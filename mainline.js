
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

// -------------------------
// Pinch to Zoom (iPad)
// -------------------------
let pinchStartDist = null;
let pinchStartScale = 1;
let currentScale = 1;

function getPinchDist(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function applyTransform() {
    // Clamp: can't go below 1 (original size), max 5x zoom in
    currentScale = Math.max(1, Math.min(5, currentScale));
    canvas.style.transform = `scale(${currentScale})`;
    
//    canvas.style.transformOrigin = "0 0";

}

// comes from copy and cut
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
    removeRectangle();
    
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

	/*
	img.onload = () => {
	    canvas.width = img.width;
	    canvas.height = img.height;

   // ⭐ Make the canvas fully white BEFORE drawing the image
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

	    
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
	*/
	img.onload = () => {
	    
	    // Create a temporary canvas
	    const temp = document.createElement('canvas');
	    temp.width = img.width;
	    temp.height = img.height;
	    const tctx = temp.getContext('2d');
	    
	    // Fill temp canvas with white
	    tctx.fillStyle = "white";
	    tctx.fillRect(0, 0, temp.width, temp.height);
	    
	    // Draw the image ON TOP of the white background
	    tctx.drawImage(img, 0, 0);
	    
	    // Now copy the flattened image into your real canvas
	    canvas.width = temp.width;
	    canvas.height = temp.height;
	    ctx.drawImage(temp, 0, 0);
	    
	    hasImage = true;
	    
	    selection = null;
	    clipboard = null;
	    pastedObject = null;
	    pastedSelected = false;
	    
	    copyBtn.disabled = true;
	    cutBtn.disabled = true;
	    pasteModeBtn.disabled = true;
	    
	    redraw();

//	    console.log(canvas.width, canvas.height);
//	    console.log(canvas.style.width, canvas.style.height);
//	    console.log("scroll area:", dei("canvasScrollArea").clientHeight);

//	    const pos = getCanvasCoords(e.clientX, e.clientY);
//	    cLog("Canvas coord: ", pos);
	    
//	    canvas.width = img.width;
//	    canvas.height = img.height;
//	    canvas.style.width = img.width + "px";
//	    canvas.style.height = img.height + "px";

	}; // on load
	
	img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
});

// -------------------------
// Coordinate correction
// -------------------------
/*
function getCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scale = currentScale || 1;

    const x = (clientX - rect.left) / scale;
    const y = (clientY - rect.top)  / scale;

    return { x, y };
}
*/
// this one works
function getCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
	x: (clientX - rect.left) * scaleX,
	y: (clientY - rect.top) * scaleY
    };
}

/* fix not working...
function getCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();

    const x = (clientX - rect.left) / currentScale;
    const y = (clientY - rect.top)  / currentScale;

    return { x, y };
}
*/

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
   
    if (!hasImage || pasteMode) return; // i moved this up from after pinch

    if (e.touches.length === 2) {
    e.preventDefault();
    isSelecting = false;
    pinchStartDist = getPinchDist(e.touches);
    pinchStartScale = currentScale;
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

canvas.addEventListener('touchmove', e => {
    if (!isSelecting || !hasImage || pasteMode) return;

    if (e.touches.length === 2) {
    e.preventDefault();
    const dist = getPinchDist(e.touches);
    currentScale = pinchStartScale * (dist / pinchStartDist);
    applyTransform();
  } // pinch

    e.preventDefault();

    const t = e.touches[0];
    const pos = getCanvasCoords(t.clientX, t.clientY);

    currentX = pos.x;
    currentY = pos.y;

    redraw();
    drawSelectionRect();
});

canvas.addEventListener('touchend', e => {

    if (e.touches.length < 2) {
	pinchStartDist = null;


    }//pinch
    
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

//    redraw(); // removes rectangle
    safeRedraw();
//    if (selection) drawSelectionRect();
}

// -------------------------
// Copy / Cut
// -------------------------
copyBtn.addEventListener('click', () => {
    if (!selection) return;

    //    remove the red boarder before we copy to the clipboard
    const recX = selection.x + 2;
    const recY = selection.y + 2;
    const recW = selection.w - 4;
    const recH = selection.h - 4;
    
    clipboard = ctx.getImageData(recX, recY, recW,recH);

    pasteModeBtn.disabled = false;

    safeRedraw();
});

cutBtn.addEventListener('click', () => {
    if (!selection) return;

    let recX = selection.x + 2;
    let recY = selection.y + 2;
    let recW = selection.w - 4;
    let recH = selection.h - 4;
    clipboard = ctx.getImageData(recX, recY, recW,recH);

    recX = selection.x - 2;
    recY = selection.y - 2;
    recW = selection.w + 4;
    recH = selection.h + 4;
    
    ctx.fillStyle = "white";
    ctx.fillRect(recX, recY, recW,recH);
//    ctx.clearRect(recX, recY, recW,recH);

    img.src = canvas.toDataURL();

    // Remove the red rectangle (same as copy)
    selection = null;
    isSelecting = false;

    // Force image reload
    img.onload = () => {
        pasteModeBtn.disabled = false;
        safeRedraw();
    };

});


// -------------------------
// Paste Mode toggle
// -------------------------
pasteModeBtn.addEventListener('click', () => {

//    cLog("clicked PasteMode");
    
    if (!clipboard) return;
    
    pasteMode = !pasteMode;
    pasteModeBtn.classList.toggle('active', pasteMode);
    
    if (pasteMode) {

//	cLog(" .. if .. clicked PasteMode");

	// Entering paste mode
	selection = null;
	isSelecting = false;
	safeRedraw();
    } else {

//	cLog(" .. else .. clicked PasteMode");
	
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
/*
  exportBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = "image.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    });
*/

exportBtn.addEventListener('click', () => {
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = "image.png";
        link.click();
        URL.revokeObjectURL(url);
    }, "image/png");
});

// -------------------------
// Drawing helpers
// -------------------------

// ALSO, clears the rectangle
function redraw() {
    if (!hasImage) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (pastedObject) {
	ctx.putImageData(pastedObject.data, pastedObject.x, pastedObject.y);
    }
}//redraw

function removeRectangle(){
    if (!hasImage) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

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
//    cLog("drawSelectionRect");
    
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

//    cLog("...DONE drawing");
    
}//drawSelectionRect

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
}//drawPastedOutline

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
    
//    dei("pasteModeBtn").textContent = "Tap to Paste";

});

canvas.addEventListener('dblclick', e => {
    activatePasteMode();

//    dei("pasteModeBtn").textContent = "double tap to Finish";
    
});

// -------------------------
// Dragging pasted object (mouse)
// -------------------------
canvas.addEventListener('mousedown', e => {
    if (!pasteMode || !pastedObject) return;

    const pos = getCanvasCoords(e.clientX, e.clientY);

    if (isInsidePastedObject(pos.x, pos.y)) {
        pastedSelected = true;
        draggingPasted = true;
        dragOffsetX = pos.x - pastedObject.x;
        dragOffsetY = pos.y - pastedObject.y;
        redraw();
        drawPastedOutline();
    }
});

canvas.addEventListener('mousemove', e => {
    if (!draggingPasted || !pastedSelected) return;

    const pos = getCanvasCoords(e.clientX, e.clientY);

    pastedObject.x = pos.x - dragOffsetX;
    pastedObject.y = pos.y - dragOffsetY;

    redraw();
    drawPastedOutline();
});

canvas.addEventListener('mouseup', () => {
    draggingPasted = false;
});

// *** mainline
function main() {
    makeHelpPopupDraggable();

    //    wireUI();
//    wireCanvasEvents();
//    resetState();
//    safeRedraw();

}

document.addEventListener("DOMContentLoaded", main);

