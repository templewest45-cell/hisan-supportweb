// import { DivisionLogic, AdditionLogic, SubtractionLogic, MultiplicationLogic } from './logic.js';

console.log("Math Support Tool Loaded");

let currentLogic = null;
let currentStepIndex = 0;
let currentOp = 'add';

const ui = {
    opSelect: document.getElementById('operation'),
    input1: document.getElementById('input1'),
    input2: document.getElementById('input2'),
    label1: document.getElementById('input1-label'),
    label2: document.getElementById('input2-label'),
    opDisplay: document.getElementById('operator-display'),
    startBtn: document.getElementById('start-btn')
};

function updateLabels() {
    const op = ui.opSelect.value;
    currentOp = op;

    if (op === 'add') {
        ui.label1.textContent = "たされる数";
        ui.label2.textContent = "たす数";
        ui.opDisplay.textContent = "+";
    } else if (op === 'sub') {
        ui.label1.textContent = "ひかれる数";
        ui.label2.textContent = "ひく数";
        ui.opDisplay.textContent = "-";
    }
}

// Initialize labels on load
// Force default to add if reloaded
ui.opSelect.value = 'add';
updateLabels();

ui.opSelect.addEventListener('change', updateLabels);

ui.startBtn.addEventListener('click', () => {
    const v1 = parseInt(ui.input1.value, 10);
    const v2 = parseInt(ui.input2.value, 10);

    if (isNaN(v1) || isNaN(v2)) {
        alert("数値を入力してください");
        return;
    }

    // Subtraction negative check
    if (currentOp === 'sub' && v1 < v2) {
        alert("ひかれる数はひく数より大きくしてください");
        return;
    }

    startCalculation(v1, v2);
});

async function startCalculation(v1, v2) {
    console.log(`Starting ${currentOp}: ${v1}, ${v2}`);

    if (currentOp === 'add') {
        currentLogic = new AdditionLogic(v1, v2);
    } else if (currentOp === 'sub') {
        currentLogic = new SubtractionLogic(v1, v2);
    }

    // Reset UI
    renderPracticeMode(v1, v2, currentOp);
}

// Navigation Event Listeners removed

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

function checkAnswer() {
    // Gather inputs
    const answerInputs = document.querySelectorAll('.answer-input');
    const width = answerInputs.length;
    let userAnsStr = "";

    // Logic is right-to-left based on data-col? 
    // data-col 0 is ones place.
    // We want to construct the number from highest col to 0.

    let correct = true;
    // Current result provided by Logic class?
    // We don't have direct access to "result" property easily unless we store it.
    // AdditionLogic and SubtractionLogic calculate it but assume steps.
    // Let's modify startCalculation to store the expected result.

    // Reconstruct user inputs into a number
    // Find max col index
    let maxCol = 0;
    answerInputs.forEach(inp => maxCol = Math.max(maxCol, parseInt(inp.dataset.col)));

    for (let i = maxCol; i >= 0; i--) {
        const inp = document.querySelector(`.answer-input[data-col="${i}"]`);
        if (inp && inp.value !== "") {
            userAnsStr += inp.value;
        } else if (userAnsStr.length > 0) {
            // If we have started seeing digits (e.g. 1...), and now see empty?
            // Treat empty as logic error or incomplete?
            // Just continue building string?
        }
    }

    if (userAnsStr === "") return; // Empty

    const userVal = parseInt(userAnsStr, 10);
    const expected = (currentOp === 'add') ? (currentLogic.a + currentLogic.b) : (currentLogic.a - currentLogic.b);

    if (userVal === expected) {
        showSuccess();
    }
}

// Updated Renderer for Practice Mode
function renderPracticeMode(a, b, op) {
    const steps = currentLogic.getSteps(); // Just to initialize if needed, or ignore
    // We just need the grid.

    renderCalculationStandard([], 0, a, b, op); // Empty steps, index 0

    // Add input listeners
    document.querySelectorAll('.hissan-input').forEach(inp => {
        inp.addEventListener('input', checkAnswer);
    });

    // Render initial coins
    if (op === 'add') {
        renderCoins({ a: a, b: b }, 'add');
    } else {
        renderCoins({ a: a, b: b }, 'sub');
    }
}

// Helper to create a coin element with listeners
function makeCoin(val, type = 'minuend') {
    const el = document.createElement('div');
    el.className = `coin ${type}`; // Add class for styling
    el.draggable = true;
    el.dataset.val = val;
    el.dataset.type = type;

    const img = document.createElement('img');
    if (val === 100) img.src = 'assets/coin_100.png';
    else if (val === 10) img.src = 'assets/coin_10.png';
    else img.src = 'assets/coin_1.png';
    img.draggable = false;
    el.appendChild(img);

    // Drag Events
    el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', val);
        e.dataTransfer.effectAllowed = 'move';
        el.classList.add('dragging');
    });

    el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
    });

    return el;
}

function renderCoins(valOrObj, opType = null) {
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

    const appendCoins = (target, val, count, type) => {
        for (let i = 0; i < count; i++) target.appendChild(makeCoin(val, type));
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

        // Style for connection/separator
        const borderStyle = (opType === 'sub') ? '4px solid #333' : '1px dashed #ccc';
        const marginBottom = (opType === 'sub') ? '10px' : '5px';

        // 100s
        const row100A = document.createElement('div');
        row100A.className = 'operand-row';
        row100A.style.borderBottom = borderStyle;
        row100A.style.paddingBottom = '5px';
        appendCoins(row100A, 100, digitsA.h, 'minuend');

        const row100B = document.createElement('div');
        row100B.className = 'operand-row';
        appendCoins(row100B, 100, digitsB.h, 'subtrahend');

        col100.appendChild(row100A);
        col100.appendChild(row100B);

        // 10s
        const row10A = document.createElement('div');
        row10A.className = 'operand-row';
        row10A.style.borderBottom = borderStyle;
        row10A.style.paddingBottom = '5px';
        appendCoins(row10A, 10, digitsA.t, 'minuend');

        const row10B = document.createElement('div');
        row10B.className = 'operand-row';
        appendCoins(row10B, 10, digitsB.t, 'subtrahend');

        col10.appendChild(row10A);
        col10.appendChild(row10B);

        // 1s
        const row1A = document.createElement('div');
        row1A.className = 'operand-row';
        row1A.style.borderBottom = borderStyle;
        row1A.style.paddingBottom = '5px';
        appendCoins(row1A, 1, digitsA.o, 'minuend');

        const row1B = document.createElement('div');
        row1B.className = 'operand-row';
        appendCoins(row1B, 1, digitsB.o, 'subtrahend');

        col1.appendChild(row1A);
        col1.appendChild(row1B);

    } else {
        let val = (typeof valOrObj === 'number') ? valOrObj : 0;
        const d = getDigits(val);
        appendCoins(col100, 100, d.h, 'minuend');
        appendCoins(col10, 10, d.t, 'minuend');
        appendCoins(col1, 1, d.o, 'minuend');
    }

    // setupInteractions is now called once at startup
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

        // Logic 1: Borrowing (Exchange) - Minuend 100->10 or 10->1
        if ((val === 100 && zoneVal === 10) || (val === 10 && zoneVal === 1)) {
            draggedEl.remove();
            if (zone.innerText === '合わせる場所') zone.innerText = '';

            // Append 10 coins to the correct inner container
            // visual separation: MUST go to the Minuend row (Top), not just the column
            let targetContainer = zone;
            const operandRows = zone.querySelectorAll('.operand-row');
            if (operandRows.length > 0) {
                targetContainer = operandRows[0]; // Top row is Minuend
            } else {
                // Fallback: try to find coin-area if not strictly rows
                targetContainer = zone.classList.contains('coin-area') ? zone : zone.querySelector('.coin-area') || zone;
            }

            for (let i = 0; i < 10; i++) {
                const newCoin = makeCoin(zoneVal, 'minuend');
                targetContainer.appendChild(newCoin);
            }

            // Auto-fill Hissan (Carry/Borrow) Inputs
            if (currentOp === 'sub') {
                const sourceColIdx = Math.log10(val); // e.g. 100 -> 2, 10 -> 1
                const targetColIdx = Math.log10(zoneVal); // e.g. 10 -> 1, 1 -> 0

                // 1. Decrease Source Column
                const sourceInput = document.querySelector(`.carry-input[data-col="${sourceColIdx}"]`);
                if (sourceInput) {
                    let currentDigit;
                    if (sourceInput.value !== "") {
                        currentDigit = parseInt(sourceInput.value, 10);
                    } else {
                        // Get original digit from currentLogic.a
                        const a = currentLogic ? currentLogic.a : 0;
                        currentDigit = Math.floor(a / Math.pow(10, sourceColIdx)) % 10;
                    }
                    sourceInput.value = currentDigit - 1;
                    sourceInput.style.backgroundColor = "#ffcccc"; // Highlight
                    setTimeout(() => sourceInput.style.backgroundColor = "", 1000);
                }

                // 2. Add '1' to Target Column (indicating 10 added)
                const targetInput = document.querySelector(`.carry-input[data-col="${targetColIdx}"]`);
                if (targetInput) {
                    targetInput.value = "1";
                    targetInput.style.backgroundColor = "#ccffcc"; // Highlight
                    setTimeout(() => targetInput.style.backgroundColor = "", 1000);
                }
            }

            return;
        }

        // Logic 2: Cancellation (Subtraction) - REVERSED: Drag Minuend -> Subtrahend
        const source = draggedEl.dataset.type;
        const dropTargetCoin = e.target.closest('.coin');

        if (currentOp === 'sub' && source === 'minuend' && dropTargetCoin && dropTargetCoin.classList.contains('subtrahend')) {
            const dragVal = parseInt(draggedEl.dataset.val, 10);
            const targetVal = parseInt(dropTargetCoin.dataset.val, 10);

            if (dragVal === targetVal) {
                draggedEl.remove();
                dropTargetCoin.remove();
                // Optional: Play sound?
                return;
            }
        }

        // Logic 3: Standard Result Regrouping (Addition)
        if (zone.classList.contains('result-zone') && val === zoneVal) {
            if (zone.innerText === '合わせる場所') zone.innerText = '';
            zone.appendChild(draggedEl);
            checkRegroup(zone);
        }
    });
}

// Initial Call
setupInteractions();

// Initialize Interactions Once
setupInteractions();

function checkRegroup(zone) {
    const coins = zone.querySelectorAll('.coin');
    const count = coins.length;
    const val = parseInt(zone.dataset.val, 10);

    if (count >= 10) {
        if (zone.querySelector('.regroup-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'regroup-btn';
        btn.innerText = '10枚を両替する！';
        btn.onclick = () => executeRegroup(zone, val);
        zone.prepend(btn);
    }
}

function executeRegroup(zone, val) {
    const coins = Array.from(zone.querySelectorAll('.coin'));
    if (coins.length < 10) return;

    for (let i = 0; i < 10; i++) {
        coins[i].remove();
    }

    const remaining = zone.querySelectorAll('.coin');
    if (remaining.length < 10) {
        const btn = zone.querySelector('.regroup-btn');
        if (btn) btn.remove();
    }

    const nextVal = val * 10;
    const nextZoneId = `result-${nextVal}`;
    const nextZone = document.getElementById(nextZoneId);

    if (nextZone) {
        if (nextZone.innerText === '合わせる場所') nextZone.innerText = '';

        const newCoin = document.createElement('div');
        newCoin.className = 'coin';
        newCoin.draggable = true;
        newCoin.dataset.val = nextVal;

        const img = document.createElement('img');
        if (nextVal === 100) img.src = 'assets/coin_100.png';
        else if (nextVal === 10) img.src = 'assets/coin_10.png';
        else img.src = 'assets/coin_1.png'; // Fallback

        img.draggable = false;
        newCoin.appendChild(img);

        newCoin.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', nextVal);
            e.dataTransfer.effectAllowed = 'move';
            newCoin.classList.add('dragging');
        });
        newCoin.addEventListener('dragend', () => newCoin.classList.remove('dragging'));

        nextZone.appendChild(newCoin);
        checkRegroup(nextZone);

        // Auto-fill Carry Input (Only for Addition)
        if (currentOp === 'add') {
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
}

// ---------------------------------------------------------
// Render Logic for Division (Left-aligned)
// ---------------------------------------------------------
function renderCalculationDiv(allSteps, currentIndex) {
    const container = document.getElementById('calc-container');
    container.innerHTML = '';

    // Using pre for simple alignment
    const lines = generateAsciiMathDiv(allSteps, currentIndex, currentLogic.dividendStr, currentLogic.divisor);
    container.innerHTML = `<pre style="font-family: monospace; font-size: 2rem; line-height: 1.2;">${lines}</pre>`;
}

function generateAsciiMathDiv(allSteps, currentIndex, dividendStr, divisor) {
    let qLine = " ".repeat(String(divisor).length + 2);
    let qArr = new Array(dividendStr.length).fill(" ");
    let workLines = [];
    let lastRemLineIndex = -1;

    for (let i = 0; i <= currentIndex; i++) {
        const s = allSteps[i];
        if (s.type === 'ESTIMATE') {
            qArr[s.digitIndex] = String(s.qDigit);
        }
        if (s.type === 'MULTIPLY') {
            const indent = String(divisor).length + 2 + s.digitIndex - String(s.product).length + 1;
            let line = " ".repeat(indent) + s.product;
            workLines.push(line);
            workLines.push(" ".repeat(indent) + "-".repeat(String(s.product).length));
        }
        if (s.type === 'SUBTRACT') {
            const indent = String(divisor).length + 2 + s.digitIndex - String(s.remainder).length + 1;
            let line = " ".repeat(indent) + s.remainder;
            workLines.push(line);
            lastRemLineIndex = workLines.length - 1;
        }
        if (s.type === 'BRING_DOWN') {
            if (lastRemLineIndex !== -1) {
                const digit = dividendStr[s.nextDigitIndex];
                workLines[lastRemLineIndex] += digit;
            }
        }
    }

    qLine += qArr.join("");
    let mainLine = `${divisor}) ${dividendStr}`;
    // Fix separator length
    let separator = " ".repeat(String(divisor).length + 2) + "-".repeat(dividendStr.length);

    return [qLine, separator, mainLine, ...workLines].join("\\n");
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

    let opSymbol = (op === 'add') ? '+' : '-';

    // CSS Grid for proper alignment
    // We need columns equal to width.
    let html = `<div class="hissan-grid" style="display: grid; grid-template-columns: repeat(${width}, 1fr); gap: 5px; width: fit-content; margin: 0 auto; font-family: monospace; font-size: 2rem;">`;

    // 1. Carry/Borrow Row (Top) - Editable
    // Align with digits.
    for (let c = 0; c < width; c++) {
        // ID based on column index?
        // Rightmost is 0? Let's use left-to-right index 0..width-1
        // But logic calls rightmost 0.
        // Let's create inputs.
        // If it's the operator column (index 0), empty?
        // Let's just create generic inputs for now.
        const idx = width - 1 - c; // Convert to logic index (0 = units)
        // Skip operator column if extra space?
        html += `<input type="text" class="hissan-input carry-input" data-col="${idx}" maxlength="1" style="width: 30px; border: 1px dashed #ccc; text-align: center; color: #f00;">`;
    }

    // 2. Operand A
    const padA = strA.padStart(width, ' ');
    for (let char of padA) {
        html += `<div class="digit">${char}</div>`;
    }

    // 3. Operand B (with Symbol)
    // Symbol is usually on the left-most.
    const padB = strB.padStart(width, ' ');
    // We need to place symbol manually?
    // In standard Grid:
    // Row 3: [Symbol] [B1] [B2] ...
    // But operator is outside the grid often or takes first col.
    // Let's iterate.
    for (let i = 0; i < width; i++) {
        const char = padB[i];
        if (i === 0 && width > strB.length) {
            // This is the operator column effectively if A is longer
            html += `<div class="digitop">${opSymbol}</div>`;
        } else if (i === 0) {
            // A and B same length, operator needs space?
            // usually width = max(len) + 1.
            // padA has space at 0.
            // padB has space at 0?
            // If padB[0] is ' ', put symbol.
            html += `<div class="digitop">${opSymbol}</div>`;
        } else {
            // If padB[i] is ' ' but we need to show B?
            html += `<div class="digit">${char}</div>`;
        }
    }

    // 4. Bar
    html += `<div style="grid-column: 1 / -1; border-bottom: 2px solid black;"></div>`;

    // 5. Answer Row (Editable)
    for (let c = 0; c < width; c++) {
        const idx = width - 1 - c;
        // Attempt to pre-fill if we have an answer in steps?
        // User wants to input calculation.
        // Let's leave empty? Or partial?
        // Let's leave empty for user to type.
        html += `<input type="text" class="hissan-input answer-input" data-col="${idx}" maxlength="1" style="width: 30px; border: 1px solid #aaa; text-align: center; font-size: 2rem;">`;
    }

    html += `</div>`;

    container.innerHTML = html;
}
