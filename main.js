// import { DivisionLogic, AdditionLogic, SubtractionLogic, MultiplicationLogic } from './logic.js';

console.log("Math Support Tool Loaded");

let currentLogic = null;
let currentStepIndex = 0;
let currentOp = 'add';
let currentMode = 'coin'; // 'coin' or 'block'

const ui = {
    // opSelect removed
    settingsToggle: document.getElementById('settings-toggle-btn'),
    settingsPanel: document.getElementById('settings-panel'),
    modeSelect: document.getElementById('display-mode'),
    colorConfig: document.getElementById('color-config'),
    input1: document.getElementById('input1'),
    input2: document.getElementById('input2'),
    opDisplay: document.getElementById('operator-display'),
    startBtn: document.getElementById('start-btn'),
    // Color inputs
    color1: document.getElementById('color-1'),
    color10: document.getElementById('color-10'),
    color100: document.getElementById('color-100'),
    headerAnswer: document.getElementById('header-answer'),
    // Scaffolding Settings
    settingAutoAnswer: document.getElementById('setting-auto-answer'),
    settingAutoCarry: document.getElementById('setting-auto-carry')
};

// Toggle Settings
ui.settingsToggle.addEventListener('click', () => {
    ui.settingsPanel.classList.toggle('hidden');
});

// Hide settings when clicking outside (optional refinement)
document.addEventListener('click', (e) => {
    if (!ui.settingsPanel.contains(e.target) && e.target !== ui.settingsToggle) {
        ui.settingsPanel.classList.add('hidden');
    }
});

// Update Scaffolding Settings
ui.settingAutoAnswer.addEventListener('change', () => {
    // Refresh practice mode to update readonly state of inputs
    if (currentLogic) {
        renderPracticeMode(currentLogic.a, currentLogic.b, currentOp);
    }
});
// No immediate action needed for AutoCarry change, it's checked on execution

function updateMode() {
    currentMode = ui.modeSelect.value;
    if (currentMode === 'block') {
        ui.colorConfig.classList.remove('hidden');
    } else {
        ui.colorConfig.classList.add('hidden');
    }
    // Re-render if logic exists
    if (currentLogic) {
        renderObjects({ a: currentLogic.a, b: currentLogic.b }, currentOp);
        // Also update any existing regroup buttons
        document.querySelectorAll('.result-zone').forEach(zone => checkRegroup(zone));
    }
}

// Color Update Logic
function updateColor(val, color) {
    document.documentElement.style.setProperty(`--block-${val}-color`, color);
}

ui.color1.addEventListener('input', (e) => updateColor(1, e.target.value));
ui.color10.addEventListener('input', (e) => updateColor(10, e.target.value));
ui.color100.addEventListener('input', (e) => updateColor(100, e.target.value));

// Initialize
ui.modeSelect.addEventListener('change', updateMode);
// updateMode(); // Removed redundant call, startCalculation will handle render

ui.startBtn.addEventListener('click', () => {
    const v1 = parseInt(ui.input1.value, 10);
    const v2 = parseInt(ui.input2.value, 10);

    if (isNaN(v1) || isNaN(v2)) {
        alert("数値を入力してください");
        return;
    }

    startCalculation(v1, v2);
});

// Initial Start
ui.headerAnswer.addEventListener('input', checkAnswerHeader);

const initV1 = parseInt(ui.input1.value, 10);
const initV2 = parseInt(ui.input2.value, 10);
startCalculation(initV1, initV2);

// ... (startCalculation function) ...

async function startCalculation(v1, v2) {
    console.log(`Starting ${currentOp}: ${v1}, ${v2}`);

    // Always Addition
    currentLogic = new AdditionLogic(v1, v2);

    // Reset UI
    renderPracticeMode(v1, v2, currentOp);
}

// Sound Effect (Simple Synth)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playFanfare() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
    const duration = 0.2;

    notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + i * 0.15);
        gain.gain.setValueAtTime(0.1, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
        osc.stop(now + i * 0.15 + 0.5);
    });
}

function showSuccess() {
    playFanfare();
    const overlay = document.getElementById('feedback-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('show');

    setTimeout(() => {
        overlay.classList.remove('show');
        setTimeout(() => overlay.classList.add('hidden'), 500);
    }, 2000);
}

function checkAnswerHeader() {
    if (!currentLogic) return; // Safeguard

    const userVal = parseInt(ui.headerAnswer.value, 10);
    const expected = (currentOp === 'add') ? (currentLogic.a + currentLogic.b) : (currentLogic.a - currentLogic.b);

    if (userVal === expected) {
        showSuccess();
    }
}

// Updated Renderer for Practice Mode
function renderPracticeMode(a, b, op) {
    const steps = currentLogic.getSteps();
    renderCalculationStandard([], 0, a, b, op);

    // Render initial objects (coins/blocks)
    renderObjects({ a: a, b: b }, op);

    // Clear header answer
    ui.headerAnswer.value = '';
}

// Helper to create a coin/block element with listeners
function makeItem(val, type = 'minuend') {
    const el = document.createElement('div');
    el.draggable = true;
    el.dataset.val = val;
    el.dataset.type = type;

    if (currentMode === 'block') {
        el.className = `block val-${val} ${type}`;
        el.innerText = val;
    } else {
        el.className = `coin ${type}`;
        const img = document.createElement('img');
        if (val === 100) img.src = 'assets/coin_100.png';
        else if (val === 10) img.src = 'assets/coin_10.png';
        else img.src = 'assets/coin_1.png';
        img.draggable = false;
        el.appendChild(img);
    }

    // Drag Events (Mouse / Desktop)
    el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', val);
        e.dataTransfer.effectAllowed = 'move';
        el.classList.add('dragging');
    });

    el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
    });

    // Touch Events (Mobile - Instant Drag)
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd); // Handle cancellation like end

    return el;
}

// Touch Drag Helpers
let activeTouchEl = null;
let touchOffsetX = 0;
let touchOffsetY = 0;
let cloneEl = null;

function handleTouchStart(e) {
    e.preventDefault(); // Prevent scroll/context menu
    const touch = e.touches[0];
    activeTouchEl = e.currentTarget; // The original element

    // Calculate offset
    const rect = activeTouchEl.getBoundingClientRect();
    touchOffsetX = touch.clientX - rect.left;
    touchOffsetY = touch.clientY - rect.top;

    // Create a clone for visual feedback
    cloneEl = activeTouchEl.cloneNode(true);
    cloneEl.style.position = 'fixed';
    cloneEl.style.zIndex = '1000';
    cloneEl.style.width = rect.width + 'px';
    cloneEl.style.height = rect.height + 'px';
    cloneEl.style.left = rect.left + 'px';
    cloneEl.style.top = rect.top + 'px';
    cloneEl.style.opacity = '0.8';
    cloneEl.style.pointerEvents = 'none'; // Allow touch to pass through to check underlying elements

    document.body.appendChild(cloneEl);
    activeTouchEl.classList.add('dragging');
}

function handleTouchMove(e) {
    if (!activeTouchEl || !cloneEl) return;
    e.preventDefault();
    const touch = e.touches[0];

    // Move clone
    cloneEl.style.left = (touch.clientX - touchOffsetX) + 'px';
    cloneEl.style.top = (touch.clientY - touchOffsetY) + 'px';

    // Highlight drop zone? (Optional visual feedback)
}

function handleTouchEnd(e) {
    if (!activeTouchEl) return;

    const touch = e.changedTouches[0];

    // Hide clone specifically to ensure elementFromPoint sees 'through' it
    // (Backup for pointer-events: none issues on some devices)
    if (cloneEl) cloneEl.style.display = 'none';

    const target = document.elementFromPoint(touch.clientX, touch.clientY);

    // Clean up clone completely
    if (cloneEl) {
        cloneEl.remove();
        cloneEl = null;
    }
    activeTouchEl.classList.remove('dragging');

    if (target) {
        let zone = target.closest('.place-col, .result-zone');
        if (zone) {
            // Logic to find the correct destination if dropped on parent column
            let destZone = zone;
            if (zone.classList.contains('place-col')) {
                // If dropped on the column wrapper, find the result-zone inside
                destZone = zone.querySelector('.result-zone');
            }

            if (!destZone) return;

            const val = parseInt(activeTouchEl.dataset.val, 10);

            let zoneVal = null;
            if (destZone.dataset.val) {
                zoneVal = parseInt(destZone.dataset.val, 10);
            }

            // Move if valid
            if (val === zoneVal) {
                if (destZone.innerText === '合わせる場所') destZone.innerText = '';
                destZone.appendChild(activeTouchEl);
                checkRegroup(destZone);
                checkRegroup(zone);
                // updateHissanFromBlocks(); // Handled by Observer
            }
        }
    }

    activeTouchEl = null;
}

function renderObjects(valOrObj, opType = null) {
    // Clear columns
    const col100 = document.getElementById('col-100');
    const col10 = document.getElementById('col-10');
    const col1 = document.getElementById('col-1');
    const res100 = document.getElementById('result-100');
    const res10 = document.getElementById('result-10');
    const res1 = document.getElementById('result-1');

    col100.innerHTML = '';
    col10.innerHTML = '';
    col1.innerHTML = '';
    res100.innerHTML = '合わせる場所';
    res10.innerHTML = '合わせる場所';
    res1.innerHTML = '合わせる場所';

    // Clean up any old regroup buttons
    document.querySelectorAll('.regroup-btn').forEach(b => b.remove());

    const appendItems = (target, val, count, type) => {
        for (let i = 0; i < count; i++) target.appendChild(makeItem(val, type));
    };

    const getDigits = (num) => {
        return {
            h: Math.floor(num / 100),
            t: Math.floor((num % 100) / 10),
            o: num % 10
        };
    };

    if ((opType === 'add' || opType === 'sub') && typeof valOrObj === 'object') {
        const digitsA = getDigits(valOrObj.a);
        const digitsB = getDigits(valOrObj.b);

        const borderStyle = (opType === 'sub') ? '4px solid #333' : '1px dashed #ccc';

        // 100s
        const row100A = document.createElement('div');
        row100A.className = 'operand-row';
        row100A.style.borderBottom = borderStyle;
        row100A.style.paddingBottom = '5px';
        appendItems(row100A, 100, digitsA.h, 'minuend');

        const row100B = document.createElement('div');
        row100B.className = 'operand-row';
        appendItems(row100B, 100, digitsB.h, 'subtrahend');

        col100.appendChild(row100A);
        col100.appendChild(row100B);

        // 10s
        const row10A = document.createElement('div');
        row10A.className = 'operand-row';
        row10A.style.borderBottom = borderStyle;
        row10A.style.paddingBottom = '5px';
        appendItems(row10A, 10, digitsA.t, 'minuend');

        const row10B = document.createElement('div');
        row10B.className = 'operand-row';
        appendItems(row10B, 10, digitsB.t, 'subtrahend');

        col10.appendChild(row10A);
        col10.appendChild(row10B);

        // 1s
        const row1A = document.createElement('div');
        row1A.className = 'operand-row';
        row1A.style.borderBottom = borderStyle;
        row1A.style.paddingBottom = '5px';
        appendItems(row1A, 1, digitsA.o, 'minuend');

        const row1B = document.createElement('div');
        row1B.className = 'operand-row';
        appendItems(row1B, 1, digitsB.o, 'subtrahend');

        col1.appendChild(row1A);
        col1.appendChild(row1B);

    } else {
        let val = (typeof valOrObj === 'number') ? valOrObj : 0;
        const d = getDigits(val);
        appendItems(col100, 100, d.h, 'minuend');
        appendItems(col10, 10, d.t, 'minuend');
        appendItems(col1, 1, d.o, 'minuend');
    }

    // After rendering, if we are in calculation mode (objects in result zones), update hissan
    // Observer will handle initial update as well if we added items
    updateHissanFromBlocks();
}

// New helper to count blocks and update Hissan
let autoFillTimeout = null;
function updateHissanFromBlocks() {
    if (!ui.settingAutoAnswer.checked) return; // Do not update if auto-answer is disabled

    // Debounce / Delay
    if (autoFillTimeout) clearTimeout(autoFillTimeout);

    autoFillTimeout = setTimeout(() => {
        const res100 = document.getElementById('result-100');
        const res10 = document.getElementById('result-10');
        const res1 = document.getElementById('result-1');

        if (!res100 || !res10 || !res1) return;

        const count100 = res100.querySelectorAll('.coin, .block').length;
        const count10 = res10.querySelectorAll('.coin, .block').length;
        const count1 = res1.querySelectorAll('.coin, .block').length;

        // Use new IDs for reliable access
        const inp1 = document.getElementById('hissan-ans-0');   // 1s
        const inp10 = document.getElementById('hissan-ans-1');  // 10s
        const inp100 = document.getElementById('hissan-ans-2'); // 100s

        if (inp1) inp1.value = count1 > 0 ? count1 : '';
        if (inp10) inp10.value = count10 > 0 ? count10 : '';
        if (inp100) inp100.value = count100 > 0 ? count100 : '';

        // Debug
        // console.log(`Auto-fill: 100s=${count100}, 10s=${count10}, 1s=${count1}`);
    }, 20); // 20ms debounce
}

// Event Delegation for Drag Interactions
function setupInteractions() {
    const getZone = (target) => target.closest('.place-col, .result-zone');

    document.addEventListener('dragover', (e) => {
        const zone = getZone(e.target);
        if (zone) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            zone.classList.add('drag-over');
        }
    });

    document.addEventListener('dragleave', (e) => {
        const zone = getZone(e.target);
        if (zone) {
            zone.classList.remove('drag-over');
        }
    });

    document.addEventListener('drop', (e) => {
        const zone = getZone(e.target);
        if (!zone) return;

        e.preventDefault();
        zone.classList.remove('drag-over');

        const draggedEl = document.querySelector('.dragging');
        if (!draggedEl) return;

        const val = parseInt(e.dataTransfer.getData('text/plain'), 10);

        let zoneVal = null;
        if (zone.dataset.val) {
            zoneVal = parseInt(zone.dataset.val, 10);
        } else {
            if (zone.id === 'col-100' || zone.querySelector('#col-100')) zoneVal = 100;
            else if (zone.id === 'col-10' || zone.querySelector('#col-10')) zoneVal = 10;
            else if (zone.id === 'col-1' || zone.querySelector('#col-1')) zoneVal = 1;
        }

        console.log('Drop:', val, '->', zoneVal, 'Op:', currentOp);

        // Logic 3: Standard Result Regrouping (Addition)
        if (zone.classList.contains('result-zone') && val === zoneVal) {
            if (zone.innerText === '合わせる場所') zone.innerText = '';

            // Re-Make item to ensure it matches current mode (legacy check, but draggable is usually fine)
            // But we should append the draggedEl directly to move it.
            // If draggedEl is from an operand row?
            // Yes, user drags from top.

            zone.appendChild(draggedEl);
            checkRegroup(zone);
            checkRegroup(zone);
            // updateHissanFromBlocks(); // Handled by Observer
        }
    });
}

// Initial Call
// ... (setupInteractions) ...
setupInteractions();

// Observer for Robust Auto-fill
function setupObservers() {
    const observer = new MutationObserver((mutations) => {
        // Trigger update if any mutation occurs in the observed zones
        updateHissanFromBlocks();
    });

    const config = { childList: true, subtree: true };

    const res100 = document.getElementById('result-100');
    const res10 = document.getElementById('result-10');
    const res1 = document.getElementById('result-1');

    if (res100) observer.observe(res100, config);
    if (res10) observer.observe(res10, config);
    if (res1) observer.observe(res1, config);
}

setupObservers();


function checkRegroup(zone) {
    const items = zone.querySelectorAll('.coin, .block'); // Check both classes
    const count = items.length;
    const val = parseInt(zone.dataset.val, 10);

    // Remove existing button if any to re-evaluate text (for mode switching)
    const existingBtn = zone.querySelector('.regroup-btn');
    if (existingBtn) existingBtn.remove();

    if (count >= 10) {
        const btn = document.createElement('button');
        btn.className = 'regroup-btn';
        if (currentMode === 'block') {
            btn.innerText = '10こを くりあげる！';
        } else {
            btn.innerText = '10枚を 両替する！';
        }

        const triggerRegroup = (e) => {
            e.preventDefault();
            e.stopPropagation(); // Stop propagation
            executeRegroup(zone, val);
        };

        btn.addEventListener('click', triggerRegroup);
        btn.addEventListener('touchend', triggerRegroup); // Ensure touch works

        zone.prepend(btn);
    }
}

function executeRegroup(zone, val) {
    const items = Array.from(zone.querySelectorAll('.coin, .block'));
    if (items.length < 10) return;

    for (let i = 0; i < 10; i++) {
        items[i].remove();
    }

    const remaining = zone.querySelectorAll('.coin, .block');
    if (remaining.length < 10) {
        const btn = zone.querySelector('.regroup-btn');
        if (btn) btn.remove();
    }

    const nextVal = val * 10;
    const nextZoneId = `result-${nextVal}`;
    const nextZone = document.getElementById(nextZoneId);

    if (nextZone) {
        if (nextZone.innerText === '合わせる場所') nextZone.innerText = '';

        const newItem = makeItem(nextVal, 'result');
        nextZone.appendChild(newItem);
        checkRegroup(nextZone);
        checkRegroup(nextZone);
        // updateHissanFromBlocks(); // Handled by Observer

        // Auto-fill Carry Input (Only for Addition)
        if (currentOp === 'add' && ui.settingAutoCarry.checked) {
            const carryColIdx = Math.log10(nextVal);
            const carryInput = document.querySelector(`.carry-input[data-col="${carryColIdx}"]`);
            if (carryInput) {
                carryInput.value = "1";
                // Optional: Highlight it?
                carryInput.style.backgroundColor = "#ffcccc";
                setTimeout(() => carryInput.style.backgroundColor = "", 1000);
            }
        }
    }
    // updateHissanFromBlocks(); // Handled by Observer
}

// ---------------------------------------------------------
// Render Logic for Add/Sub/Mul (Right-aligned)
// ---------------------------------------------------------
function renderCalculationStandard(allSteps, currentIndex, a, b, op) {
    const container = document.getElementById('calc-container');
    container.innerHTML = '';

    const strA = a.toString();
    const strB = b.toString();
    const width = Math.max(strA.length, strB.length) + 1;

    let opSymbol = '+'; // Restricted to add

    // CSS Grid
    let html = `<div class="hissan-grid" style="display: grid; grid-template-columns: repeat(${width}, 1fr); gap: 5px; width: fit-content; margin: 0 auto; font-family: monospace; font-size: 2rem;">`;

    // 1. Carry/Borrow Row (Top) - Editable
    for (let c = 0; c < width; c++) {
        const idx = width - 1 - c;
        html += `<input type="text" class="hissan-input carry-input" data-col="${idx}" maxlength="1" style="width: 30px; border: 1px dashed #ccc; text-align: center; color: #f00;">`;
    }

    // 2. Operand A
    const padA = strA.padStart(width, ' ');
    for (let char of padA) {
        html += `<div class="digit">${char}</div>`;
    }

    // 3. Operand B (with Symbol)
    const padB = strB.padStart(width, ' ');
    for (let i = 0; i < width; i++) {
        const char = padB[i];
        if (i === 0) {
            html += `<div class="digitop">${opSymbol}</div>`;
        } else {
            html += `<div class="digit">${char}</div>`;
        }
    }

    // 4. Bar
    html += `<div style="grid-column: 1 / -1; border-bottom: 2px solid black;"></div>`;

    // 5. Answer Row (Editable vs Read-only based on setting)
    const isAutoAnswer = ui.settingAutoAnswer.checked;
    for (let c = 0; c < width; c++) {
        const idx = width - 1 - c;
        // If AutoAnswer is TRUE: Readonly, no border (look like auto-filled text)
        // If AutoAnswer is FALSE: Editable, standard border
        const style = isAutoAnswer
            ? "width: 30px; border: none; background: transparent; text-align: center; font-size: 2rem; font-weight: bold; color: #000;"
            : "width: 30px; border: 1px solid #aaa; text-align: center; font-size: 2rem; color: #000;";

        const readonlyAttr = isAutoAnswer ? "readonly" : "";

        // Added ID for reliable selection
        html += `<input type="text" id="hissan-ans-${idx}" class="hissan-input answer-input" data-col="${idx}" maxlength="2" ${readonlyAttr} style="${style}">`;
    }

    html += `</div>`;
    container.innerHTML = html;
}
