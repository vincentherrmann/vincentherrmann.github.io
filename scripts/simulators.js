// --- 1. Tag Machine ---
let tagSimulationInterval = null;

function runTagMachine() {
    if (tagSimulationInterval) clearInterval(tagSimulationInterval);
    const rules = {
        'a': document.getElementById("rule-a").value.trim(),
        'b': document.getElementById("rule-b").value.trim(),
        'c': document.getElementById("rule-c").value.trim()
    };
    const outputEl = document.getElementById("tag-output");
    let currentString = "aaa", indent = "", steps = 0;

    outputEl.textContent = currentString + "\n";
    tagSimulationInterval = setInterval(() => {
        if (currentString.length === 0 || steps >= 200) { clearInterval(tagSimulationInterval); return; }
        let firstChar = currentString[0];
        if (firstChar === 'H' || currentString.length < 2 || !rules[firstChar]) {
            clearInterval(tagSimulationInterval);
            outputEl.textContent += indent + `(Halted)`;
            return;
        }
        currentString = currentString.substring(2) + rules[firstChar];
        indent += "  ";
        outputEl.textContent += indent + currentString + "\n";
        outputEl.scrollTop = outputEl.scrollHeight;
        steps++;
    }, 50);
}
document.getElementById("btn-run-tag").addEventListener("click", runTagMachine);

// --- 2. Rule 110 CA ---
function hexToBin512(hexStr) {
    let binStr = "";
    for (let i = 0; i < hexStr.length; i++) binStr += parseInt(hexStr[i], 16).toString(2).padStart(4, '0');
    return binStr.padStart(512, '0');
}

let caAnimationFrameId = null;

function runCA() {
    if (caAnimationFrameId) cancelAnimationFrame(caAnimationFrameId);

    const progInput = document.getElementById("ca-program").value.trim();
    const statusEl = document.getElementById("ca-status");
    const finalOutputEl = document.getElementById("ca-final-output");

    finalOutputEl.style.display = "none";
    finalOutputEl.textContent = "";

    if (!/^[01]+$/.test(progInput)) {
        statusEl.textContent = "Error: Program must consist of 0s and 1s only.";
        return;
    }

    statusEl.textContent = "Computing history...";

    let state = new Uint8Array(512);
    for (let i = 0; i < progInput.length; i++) {
        if (i < 512) {
            state[511 - i] = progInput[i] === '1' ? 1 : 0;
        }
    }

    let history = [];
    let seen = new Set();
    let loopEnd = -1;
    const maxSteps = 20000;
    const SHOW_FINAL_BINARY_STRING = true;

    for (let step = 0; step < maxSteps; step++) {
        let stateStr = state.join('');
        history.push(new Uint8Array(state));

        if (seen.has(stateStr)) {
            loopEnd = step;
            break;
        }
        seen.add(stateStr);

        let next = new Uint8Array(512);
        for (let i = 0; i < 512; i++) {
            let l = state[(i - 1 + 512) % 512];
            let c = state[i];
            let r = state[(i + 1) % 512];
            let val = (l << 2) | (c << 1) | r;
            next[i] = (110 >> val) & 1;
        }
        state = next;
    }

    if (loopEnd !== -1) statusEl.textContent = `Halted on repeating state at step ${loopEnd}. Rendering...`;
    else statusEl.textContent = `Did not halt. Reached max steps (${maxSteps}). Rendering...`;

    const caCanvas = document.getElementById("ca-canvas");
    const viewport = document.getElementById("ca-viewport");
    const ctx = caCanvas.getContext("2d");

    caCanvas.width = 1024;
    caCanvas.height = (history.length * 2) + 2 + 10;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, caCanvas.width, caCanvas.height);

    let row = 0;
    const chunkSize = 40;

    function drawFrame() {
        let end = Math.min(row + chunkSize, history.length);

        if (row < end) {
            let imgData = ctx.createImageData(1024, (end - row) * 2);
            let data = imgData.data;

            for (let r = 0; r < end - row; r++) {
                let st = history[row + r];
                for (let c = 0; c < 512; c++) {
                    let color = st[c] === 1 ? 0 : 255;

                    let idxTopLeft = ((r * 2) * 1024 + c * 2) * 4;
                    let idxTopRight = idxTopLeft + 4;
                    let idxBotLeft = ((r * 2 + 1) * 1024 + c * 2) * 4;
                    let idxBotRight = idxBotLeft + 4;

                    data[idxTopLeft] = data[idxTopLeft+1] = data[idxTopLeft+2] = color; data[idxTopLeft+3] = 255;
                    data[idxTopRight] = data[idxTopRight+1] = data[idxTopRight+2] = color; data[idxTopRight+3] = 255;

                    data[idxBotLeft] = data[idxBotLeft+1] = data[idxBotLeft+2] = color; data[idxBotLeft+3] = 255;
                    data[idxBotRight] = data[idxBotRight+1] = data[idxBotRight+2] = color; data[idxBotRight+3] = 255;
                }
            }

            ctx.putImageData(imgData, 0, row * 2);
            row = end;

            let currentY = row * 2;
            if (currentY > viewport.clientHeight) {
                viewport.scrollTop = currentY - viewport.clientHeight + 40;
            } else {
                viewport.scrollTop = 0;
            }

            caAnimationFrameId = requestAnimationFrame(drawFrame);
        } else {
            let ribbonY = history.length * 2;

            // Sync with dynamic CSS variable
            let ribbonColor = getComputedStyle(document.documentElement).getPropertyValue('--ribbon-color').trim() || "#ff3c3c";
            ctx.fillStyle = ribbonColor;
            ctx.fillRect(0, ribbonY, 1024, 2);

            let finalState = history[history.length - 1];
            let ribbonData = ctx.createImageData(1024, 10);
            let rData = ribbonData.data;

            for (let r = 0; r < 10; r++) {
                for(let c = 0; c < 512; c++) {
                    let color = finalState[c] === 1 ? 0 : 255;
                    let idxLeft = (r * 1024 + c * 2) * 4;
                    let idxRight = idxLeft + 4;

                    rData[idxLeft] = rData[idxLeft+1] = rData[idxLeft+2] = color; rData[idxLeft+3] = 255;
                    rData[idxRight] = rData[idxRight+1] = rData[idxRight+2] = color; rData[idxRight+3] = 255;
                }
            }
            ctx.putImageData(ribbonData, 0, ribbonY + 2);

            viewport.scrollTop = viewport.scrollHeight;
            statusEl.textContent = statusEl.textContent.replace("Rendering...", "Done.");

            if (SHOW_FINAL_BINARY_STRING) {
                finalOutputEl.textContent = "Final Binary Output:\n" + finalState.join('');
                finalOutputEl.style.display = "block";
            }
        }
    }

    caAnimationFrameId = requestAnimationFrame(drawFrame);
}
document.getElementById("btn-run-ca").addEventListener("click", runCA);

// --- 3. Brainfuck ---
function escapeChar(charCode) {
    if (charCode > 127) return "";
    if (charCode === 9) return "\\t"; if (charCode === 10) return "\\n";
    if (charCode === 13) return "\\r"; if (charCode === 92) return "\\\\";
    if (charCode < 32 || charCode === 127) return "\\x" + charCode.toString(16).padStart(2, '0');
    return String.fromCharCode(charCode);
}

let bfSimulationInterval = null;

function runBfMachine() {
    if (bfSimulationInterval) clearInterval(bfSimulationInterval);
    let rawCode = document.getElementById("bf-code").value.trim(), code = "";
    for(let char of rawCode) if ("><+-.[],".includes(char)) code += char;

    let memory = new Uint8Array(20), ptr = 0, pc = 0, outputText = "", steps = 0;
    let jumps = {}, stack = [];

    for (let i = 0; i < code.length; i++) {
        if (code[i] === '[') stack.push(i);
        else if (code[i] === ']' && stack.length > 0) { let start = stack.pop(); jumps[start] = i; jumps[i] = start; }
    }

    const updateUI = () => {
        let codeHTML = "";
        for (let i = 0; i < code.length; i++) codeHTML += `<span class="code-char ${i === pc ? 'active' : ''}">${code[i]}</span>`;
        document.getElementById("bf-code-display").innerHTML = codeHTML;

        let tapeHTML = "";
        for (let i = 0; i < memory.length; i++) tapeHTML += `<span class="tape-cell ${i === ptr ? 'active' : ''}">${memory[i]}</span>`;
        document.getElementById("bf-tape-display").innerHTML = tapeHTML;
        document.getElementById("bf-output-display").textContent = outputText;
    };

    updateUI();
    bfSimulationInterval = setInterval(() => {
        for(let k = 0; k < 3; k++) {
            if (pc >= code.length || steps >= 50000) { clearInterval(bfSimulationInterval); updateUI(); return; }
            switch (code[pc]) {
                case '>': ptr = Math.min(ptr + 1, memory.length - 1); break;
                case '<': ptr = Math.max(ptr - 1, 0); break;
                case '+': memory[ptr] = (memory[ptr] + 1) & 255; break;
                case '-': memory[ptr] = (memory[ptr] - 1) & 255; break;
                case '.': outputText += escapeChar(memory[ptr]); break;
                case '[': if (memory[ptr] === 0) pc = jumps[pc]; break;
                case ']': if (memory[ptr] !== 0) pc = jumps[pc]; break;
            }
            pc++; steps++;
        }
        updateUI();
    }, 15);
}
document.getElementById("btn-run-bf").addEventListener("click", runBfMachine);