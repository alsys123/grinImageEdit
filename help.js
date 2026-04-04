

/* ------------------------------
   Help
   ------------------------------ */
let helpVisible = false;

/*
  function positionCheckButton() {
  } //positionCheckButton

  window.addEventListener("resize", positionCheckButton);
  positionCheckButton();
*/

document.getElementById("helpBtn").addEventListener("click", () => {
    toggleHelp(true);
});


document.getElementById("helpCloseBtn").addEventListener("click", () => {
    toggleHelp(false);
});

document.getElementById("helpCloseBtn").addEventListener("pointerup", (e) => {
    //    e.stopPropagation();  // prevent drag logic
    toggleHelp(false);
});
/*
function toggleHelp(show) {
    const panel = document.getElementById("helpPanel");
    helpVisible = show;

    if (show) {
	panel.classList.remove("hidden");
	loadHelpContent("about"); // default section

	// Highlight default
    document.querySelectorAll("#helpPanel .help-buttons button")
        .forEach(b => b.classList.remove("active-help"));

    document.querySelector('#helpPanel .help-buttons button[data-help="about"]')
            .classList.add("active-help");
	
    } else {
	panel.classList.add("hidden");
    }
}//toggleHelp
*/
function toggleHelp(show) {
    const panel = document.getElementById("helpPanel");
    helpVisible = show;

    if (show) {
        panel.classList.remove("hidden");

        // ⭐ Freeze position immediately so dragging works smoothly
        const rect = panel.getBoundingClientRect();
        panel.style.left = rect.left + "px";
        panel.style.top  = rect.top + "px";
        panel.style.transform = "none";

        loadHelpContent("about");
    } else {
        panel.classList.add("hidden");
    }
}

/*
// Context switching
document.querySelectorAll("#helpPanel .help-buttons button")
    .forEach(btn => {
	btn.addEventListener("click", () => {
	    const topic = btn.dataset.help;
	    loadHelpContent(topic);
	});
    });
*/
document.querySelectorAll("#helpPanel .help-buttons button")
    .forEach(btn => {
        btn.addEventListener("click", () => {

            // Remove highlight from all buttons
            document.querySelectorAll("#helpPanel .help-buttons button")
                .forEach(b => b.classList.remove("active-help"));

            // Highlight the clicked button
            btn.classList.add("active-help");

            // Load the content
            const topic = btn.dataset.help;
            loadHelpContent(topic);
        });
    });

function loadHelpContent(topic) {
    const content = document.querySelector("#helpPanel .help-content");

    if (topic === "about") {
	content.innerHTML = `
      <h3>About</h3>
      <p>This tool was created to help musicians quickly edit and prepare chord charts or annotated images. You can draw directly on the chart, clean up mistakes, move sections around, and export a finished version for printing or sharing.</p>
      <p>The interface is optimized for touch devices, so everything can be done with your finger or stylus.</p>
    `;
    } // about
    if (topic === "copy") {
	content.innerHTML = `
      <h3>Copy</h3>
      <p>To copy part of the image, drag your finger to draw a red selection box around the area you want.</p>
      <p>When the box appears, press the <strong>Copy</strong> button. The selected piece is stored in the clipboard.</p>
      <p>Copying does not change the original image — it simply saves a duplicate of the selected area for later use.</p>
    `;
    
    content.innerHTML += `
      <h3>Paste Mode</h3>
      <p>After copying or cutting, press <strong>Paste</strong> to enter Paste Mode.</p>
      <p>Drag the piece to position it anywhere on the image.</p>
      <p>Tap again to finish placing it. The button text will change to “Finish” while you are positioning the piece.</p>
      <p>Paste Mode stays active until you tap to confirm placement.</p>
    `;
    } // copy

    if (topic === "cutPaste") {
	content.innerHTML = `
      <h3>Cut & Paste</h3>

      <p><strong>Cut</strong> removes a selected part of the image and stores it in the clipboard.</p>

      <p><strong>How to Cut:</strong><br>
      1. Drag to select an area.<br>
      2. Press <strong>Cut</strong>. The selected area is removed and saved.</p>

      <p><strong>How to Paste:</strong><br>
      1. Press <strong>Paste</strong> to enter Paste Mode.<br>
      2. Drag the piece to position it.<br>
      3. Tap again to finish placing it.</p>

      <p>While in Paste Mode, the button text will change to guide you. You can reposition the piece as many times as you like before tapping to finish.</p>
    `;
    } // cutPaste

    if (topic === "saving") {
	
	content.innerHTML = `
      <h3>Saving Your Work</h3>
      <p>You can export your edited chart at any time. Press the <strong>Export</strong> button to save your work as <strong>image.png</strong>.</p>
      <p>The exported file contains everything currently visible on the canvas, including drawings, pasted pieces, and edits.</p>
      <p>On some devices, the file will download automatically. On others, you may be asked where to save it.</p>
    `;

    }

    if (topic === "faq") {

    content.innerHTML = `
      <h3>FAQ</h3>

      <p><strong>Paste button is disabled:  </strong>
      You must Copy or Cut something before you can paste.</p>

      <p><strong>Selection box does not appear: </strong>
      Make sure you drag far enough for the system to detect a rectangle.</p>

      <p><strong>Paste Mode won't finish: </strong>
      Tap once to place the piece. The button text will change when placement is complete.</p>

      <p><strong>Exported image looks different: </strong>
      Only what is visible on the canvas is saved. Make sure your edits are finalized before exporting.</p>

      <p><strong>Cut leaves a dark area: </strong>
      This can happen if the original image contains transparency. Reload the image or redraw the area.</p>
    `;
    } // faq
}

/* future...
//avoid taps during help
function toggleHelp(show) {
const panel = document.getElementById("helpPanel");
helpVisible = show;

if (show) {
joinerMode = false;
selectedLetter = null;
panel.classList.remove("hidden");
loadHelpContent("drawing");
} else {
panel.classList.add("hidden");
}
}
*/
/*
document.getElementById("enableDrawingBtn").addEventListener("click", () => {
    if (!drawingEnabled) {
        const ok = confirm(
            "Drawing mode is experimental and may not always recognize letters correctly.\n\n" +
		"Enable it anyway?"
        );
        if (!ok) return;

        drawingEnabled = true;
        document.getElementById("enableDrawingBtn").textContent = "Disable Drawing Mode";
    } else {
        drawingEnabled = false;
        document.getElementById("enableDrawingBtn").textContent = "Enable Drawing Mode";
    }
    // ⭐ THIS is where the toggle goes
    document.body.classList.toggle("drawing-enabled", drawingEnabled);
});
*/
/*
document.getElementById("enableDictionaryBtn").addEventListener("click", () => {

    if (!dictionaryLookupEnabled) {
	
        dictionaryLookupEnabled = true;
        document.getElementById("enableDictionaryBtn").textContent =
            "Disable Dictionary Lookup";
    } else {
        dictionaryLookupEnabled = false;
        document.getElementById("enableDictionaryBtn").textContent =
            "Enable Dictionary Lookup";
    }
    // ⭐ THIS is where the toggle goes
    document.body.classList.toggle("dictionaryLookup-enabled", dictionaryLookupEnabled);
});
*/
// ?? one day ... generalize this and put it in utils .. so it can be re-useable.
function makeHelpPopupDraggable() {
    const panel = document.getElementById("helpPanel");
    const handle = document.getElementById("helpDragHandle");

    let offsetX = 0;
    let offsetY = 0;
    let isDragging = false;

    
    function freezePosition() {
        const rect = panel.getBoundingClientRect();
        panel.style.left = rect.left + "px";
        panel.style.top  = rect.top + "px";
	//        panel.style.transform = "none";   // remove centering AFTER freezing
    }
    
    
    handle.addEventListener("mousedown", (e) => {
        isDragging = true;

        // Remove centering transform so dragging works naturally
	//        panel.style.transform = "none";

        freezePosition();   // ⭐ prevents the jump
        panel.style.transform = "none";
	
        const rect = panel.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        document.body.style.userSelect = "none";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        panel.style.left = (e.clientX - offsetX) + "px";
        panel.style.top  = (e.clientY - offsetY) + "px";
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.userSelect = "";
    });
    
    // ---- iPAD / TOUCH SUPPORT ----
    handle.addEventListener("touchstart", (e) => {
        isDragging = true;

	freezePosition();   // ⭐ prevents the jump
        panel.style.transform = "none";

        const touch = e.touches[0];
        const rect = panel.getBoundingClientRect();
        offsetX = touch.clientX - rect.left;
        offsetY = touch.clientY - rect.top;

        e.preventDefault(); // prevents Safari from scrolling instead of dragging
    }, { passive: false });

    document.addEventListener("touchmove", (e) => {
        if (!isDragging) return;

        const touch = e.touches[0];
        panel.style.left = (touch.clientX - offsetX) + "px";
        panel.style.top  = (touch.clientY - offsetY) + "px";

        e.preventDefault(); // required for iPad dragging
    }, { passive: false });

    document.addEventListener("touchend", () => {
        isDragging = false;
    });
}
