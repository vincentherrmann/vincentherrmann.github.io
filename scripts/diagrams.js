const CONFIG = {
    domainMax: 50,
    horizons: [1, 2, 4], // Prediction horizons

    // Layout & Dimensions
    layout: {
        left: {
            margin: {top: 28, right: 20, left: 125},
            widthTotal: 400,
            chartHeight: 230,
            probClipHeight: 100,
            offsetTopPlotY: 140, // Increased to make room for labels and the box
            offsetBotPlotY: 120
        },
        right: {
            margin: {top: 55, right: 20, left: 40, bottom: 30},
            widthTotal: 315,
            chartHeightBase: 245 // Reduced to balance the overall height with the left column
        },
        box: {
            width: 140,
            height: 30,
            offsetX: -50,
            offsetY: 75,         // Pushed down to clear the bottom-hanging math labels
        }
    },

    // Centralized D3 Styling Values
    colors: {
        blue: "#4682b4",
        green: "#228b22",
        orange: "#e67e22",
        dark: "#222",
        base: "#666",
        gray: "#777",
        grayNeutral: "#888",
        lightGray: "#999",
        boxFill: "#e8e8e8"
    },
    opacities: {
        horizons: [0.25, 0.45, 0.7] // Matches the 3 horizons above
    },
    strokes: {
        guide: 1.5,
        normal: 2,
        thick: 2.5
    }
};

/**
 * ==========================================
 * 2. STATE & DATA DICTIONARIES
 * ==========================================
 */
let state = {
    nx: 0.91 * CONFIG.domainMax,
    mx: 0.23 * CONFIG.domainMax,
    kx: 0.65 * CONFIG.domainMax,
    t:  0.40 * CONFIG.domainMax,
    prior: 'length'
};

const labelCache = {};
const latexMap = {
    'transform_eq': '(i, j) \\mapsto (\\text{BB}(i), i+j)',
    'nx': '\\hat{n}',
    'kx': '\\hat{k}',
    'mx': '\\hat{m}',
    'kx_minus_mx': '\\hat{k} - \\hat{m}',
    'bbmx': '\\text{BB}(\\hat{m})',
    'bbt': '\\text{BB}(t)',
    't': 't',
    'Px': '\\hat{P}',
    'Dx': '\\hat{D}',
    'ePx': 'P_x',
    'eDx': 'D_x',
    'mxe': 'm_x',
    'kxe': 'k_x',
    'bbmxe': '\\text{BB}(m_x)',
    'delta_t': 't - \\hat{m}'
};

/**
 * ==========================================
 * 3. D3 SETUP & SCALES
 * ==========================================
 */
const layoutL = CONFIG.layout.left;
const layoutR = CONFIG.layout.right;

const widthLeft = layoutL.widthTotal - layoutL.margin.left - layoutL.margin.right;
const widthRight = layoutR.widthTotal - layoutR.margin.left - layoutR.margin.right;
const chartHeightRight = layoutR.chartHeightBase - layoutR.margin.top - layoutR.margin.bottom;

// X/Y Scales
const xScale = d3.scaleLinear().domain([0, CONFIG.domainMax]).range([0, widthLeft]);
const yScale = d3.scaleLinear().domain([0, CONFIG.domainMax]).range([layoutL.chartHeight, 0]);

const xScaleRight = d3.scaleLinear().domain([0, CONFIG.domainMax]).range([0, widthRight]);
const yScaleRightProb = d3.scaleLinear().domain([0, 1.111]).range([chartHeightRight, 0]);
const yScaleRightDiff2 = d3.scaleLinear().domain([0, CONFIG.domainMax / 8]).range([chartHeightRight, 0]);
const yScaleRightDiff3 = d3.scaleLinear().domain([0, CONFIG.domainMax / 2]).range([chartHeightRight, 0]);

const colLeft = d3.select("#col-left");
const colRight = d3.select("#col-right");

// SVG Defs (Markers & Clip Paths)
const defs = d3.select("body").append("svg").attr("height", 0).append("defs");
defs.append("marker").attr("id", "arrow").attr("viewBox", "0 0 10 10").attr("refX", 6).attr("refY", 5)
    .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
    .append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").style("fill", CONFIG.colors.dark);

defs.append("marker").attr("id", "arrow-gray").attr("viewBox", "0 0 10 10").attr("refX", 6).attr("refY", 5)
    .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
    .append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").style("fill", CONFIG.colors.grayNeutral);

defs.append("clipPath").attr("id", "clip-right2")
    .append("rect").attr("x", 0).attr("y", 0).attr("width", widthRight).attr("height", chartHeightRight);

/**
 * ==========================================
 * 4. MATHEMATICAL MODELS
 * ==========================================
 */
function calculateExpectedAlgorithmic(kx, t) {
    let pow2 = Math.pow(2, t-kx);
    let n_m_log_arg = kx - t - 1 + pow2;
    let m_m_log_arg = (t + 1) * (kx - t - 1) - 2 + (kx + 3) * pow2;
    let k_m_log_arg = (kx + t) * (kx - t - 1) - 2 + 2 * (kx + 1) * pow2;

    if(n_m_log_arg <= 0) n_m_log_arg = 1e-10;
    if(m_m_log_arg <= 0) m_m_log_arg = 1e-10;
    if(k_m_log_arg <= 0) k_m_log_arg = 1e-10;

    let log_n_m = 1 - t + Math.log2(n_m_log_arg);
    let log_m_m = 1 - t + Math.log2(m_m_log_arg);
    let log_k_m = -t + Math.log2(k_m_log_arg);

    return { mxe: Math.pow(2, log_m_m - log_n_m), kxe: Math.pow(2, log_k_m - log_n_m), log_n_m };
}

function calculateExpectedLength(kx, t) {
    let powTerm = Math.pow(2, kx - t + 1);
    let n_m_log_arg = -kx + t - 2 + powTerm;
    let m_m_log_arg = (t + 1) * powTerm - (kx*kx + 3*kx - t*t + t + 4)/2;
    let k_m_log_arg = (kx - 2) * powTerm - (kx*kx - kx - t*t + 5*t - 8)/2;

    if(n_m_log_arg <= 0) n_m_log_arg = 1e-10;
    if(m_m_log_arg <= 0) m_m_log_arg = 1e-10;
    if(k_m_log_arg <= 0) k_m_log_arg = 1e-10;

    let log_n_m = Math.log2(n_m_log_arg);
    let log_m_m = Math.log2(m_m_log_arg);
    let log_k_m = Math.log2(k_m_log_arg);

    return { mxe: Math.pow(2, log_m_m - log_n_m), kxe: Math.pow(2, log_k_m - log_n_m), log_n_m };
}

function calculateExpectedSpeed(kx, t) {
    return { mxe: t, kxe: (kx + t - 1) / 2, log_n_m: 0 };
}

function calculateExpected(kx, t, prior) {
    if (kx - t <= 1) return { mxe: t, kxe: t, log_n_m: 0 };
    if (prior === 'length') return calculateExpectedLength(kx, t);
    if (prior === 'speed') return calculateExpectedSpeed(kx, t);
    return calculateExpectedAlgorithmic(kx, t);
}

function getProbabilityAlgorithmic(val, kx, t, log_n_m, type) {
    if (type === 'k') {
        let term = Math.pow(2, 1-t) - Math.pow(2, -val);
        if (term > 1e-30) return Math.pow(2, Math.log2(term) - log_n_m);
    } else if (type === 'm') {
        if (kx - val > 1e-9) return Math.pow(2, Math.log2(kx - val) - val - log_n_m);
    }
    return 0;
}

function getProbabilityLength(val, kx, t, log_n_m, type) {
    if (type === 'k') {
        let term = Math.pow(2, val - t + 1) - 1;
        if (term > 0) return Math.pow(2, Math.log2(term) - log_n_m);
    } else if (type === 'm') {
        let term = Math.pow(2, kx - val) - 1;
        if (term > 0) return Math.pow(2, Math.log2(term) - log_n_m);
    }
    return 0;
}

function getProbabilitySpeed(val, kx, t, log_n_m, type) {
    let denominator = Math.max(1e-9, kx - t);
    if (type === 'k') { if (val >= t && val <= kx) return 1 / denominator; }
    else if (type === 'm') { if (Math.abs(val - t) < 0.1) return 1.0; }
    return 0;
}

function getProbHeight(val, kx, t, log_n_m, prior, type) {
    if (prior === 'speed' && type === 'm') return layoutL.probClipHeight;
    let prob = prior === 'length' ? getProbabilityLength(val, kx, t, log_n_m, type) :
               prior === 'speed'  ? getProbabilitySpeed(val, kx, t, log_n_m, type) :
                                    getProbabilityAlgorithmic(val, kx, t, log_n_m, type);
    return Math.min(layoutL.probClipHeight, prob * 750);
}

function getMaxProbHeight(kx, t, log_n_m, prior, type) {
    if (prior === 'speed' && type === 'm') return layoutL.probClipHeight;
    let max_h = 0;
    for (let i = 0; i <= 80; i++) {
        let val = t + i * ((kx - t) / 80);
        let h = getProbHeight(val, kx, t, log_n_m, prior, type);
        if (h > max_h) max_h = h;
    }
    return max_h;
}

// --- FUTURE DROP LOGIC (RIGHT PLOTS) ---
function future_drop_prob_horizon_al(t, k_hat, m_hat, horizon) {
    let z_stop = Math.pow(2, -m_hat) + Math.pow(2, -t - horizon + 1) - Math.pow(2, -k_hat + 1);
    let z_drop = (k_hat - t - 1)*Math.pow(2, -t + 1) - (k_hat - t - horizon - 1)*Math.pow(2, -t - horizon + 1);
    let z_perhaps = (k_hat - t - horizon - 2) * Math.pow(2, -t - horizon + 1) + Math.pow(2, -k_hat + 2);
    let p_drop_lb = z_drop / (z_stop + z_drop + z_perhaps);

    let k_horizon = Math.pow(2, -t)*(k_hat*(k_hat - 1) - t*(t+1) - 2) - Math.pow(2, -t-horizon)*(k_hat*(k_hat - 1) - (t+horizon)*(t+horizon+1) - 2);
    let expected_progress_lb = p_drop_lb * (k_hat - k_horizon / z_drop);
    return { prob_drop_horizon: p_drop_lb, progress_horizon: expected_progress_lb };
}

function future_drop_prob_horizon_len(t, k_hat, m_hat, horizon) {
    let z_stop = Math.pow(2, k_hat - m_hat) + Math.pow(2, k_hat - t - horizon) - 1;
    let z_drop = Math.pow(2, k_hat - t + 1) - Math.pow(2, k_hat - t - horizon + 1) - horizon;
    let z_perhaps = Math.pow(2, k_hat - t - horizon) + t + horizon - k_hat - 1;
    let p_drop_lb = z_drop / (z_stop + z_drop + z_perhaps);

    let k_horizon = (k_hat-2) * (Math.pow(2, k_hat-t+1) - Math.pow(2, k_hat-t-horizon+1)) + 0.5*horizon*(5 - 2*t - horizon);
    let expected_progress_lb = p_drop_lb * (k_hat - k_horizon / z_drop);
    return { prob_drop_horizon: p_drop_lb, progress_horizon: expected_progress_lb };
}

function future_drop_prob_horizon_speed() { return { prob_drop_horizon: 0., progress_horizon: 0. }; }

function future_drop_prob_al(t, k_hat, m_hat) {
    let N_M = (k_hat - t - 1) * Math.pow(2, 1 - t) + Math.pow(2, 1 - k_hat);
    let hat_N_M = Math.pow(2, -m_hat);
    return (hat_N_M + N_M === 0) ? 0 : N_M / (hat_N_M + N_M);
}

function future_drop_prob_len(t, k_hat, m_hat) {
    let N_L = Math.pow(2, k_hat - t + 1) - k_hat + t - 2;
    let hat_N_L = Math.pow(2, k_hat - m_hat);
    return (hat_N_L + N_L === 0) ? 0 : N_L / (hat_N_L + N_L);
}

function future_drop_prob_speed() { return 0; }

/**
 * ==========================================
 * 5. PATH & SHAPE GENERATORS
 * ==========================================
 */
function generateProfiles(nx, kx, mx, t) {
    const dropStep = CONFIG.domainMax / 10;
    let N = Math.ceil((nx - kx) / dropStep);
    if (N < 1 && nx > kx) N = 1; if (nx === kx) N = 0;

    let dx = N > 0 ? mx / (2 * N) : 0;
    let dy = N > 0 ? (nx - kx) / N : 0;

    let dBot = `M ${xScale(0)},${yScale(nx)}`, dTop = `M ${xScale(0)},${yScale(nx)}`;
    let rBot = `M ${xScale(0)},${yScale(CONFIG.domainMax)} L ${xScale(0)},${yScale(nx)}`;
    let rTop = `M ${xScale(0)},${yScale(CONFIG.domainMax)} L ${xScale(0)},${yScale(nx)}`;

    let cur_x = 0, cur_y = nx;
    for (let i = 0; i < N; i++) {
        let nxt_x = cur_x + dx;
        dBot += ` L ${xScale(nxt_x)},${yScale(cur_y)}`; rBot += ` L ${xScale(nxt_x)},${yScale(cur_y)}`;
        dTop += ` L ${xScale(nxt_x)},${yScale(cur_y - nxt_x)}`; rTop += ` L ${xScale(nxt_x)},${yScale(cur_y - nxt_x)}`;
        cur_x = nxt_x; nxt_x = cur_x + dx;
        let nxt_y = cur_y - dy;
        dBot += ` Q ${xScale(cur_x + dx/2)},${yScale(cur_y)} ${xScale(nxt_x)},${yScale(nxt_y)}`;
        rBot += ` Q ${xScale(cur_x + dx/2)},${yScale(cur_y)} ${xScale(nxt_x)},${yScale(nxt_y)}`;
        dTop += ` Q ${xScale(cur_x + dx/2)},${yScale(cur_y - (cur_x + dx/2))} ${xScale(nxt_x)},${yScale(nxt_y - nxt_x)}`;
        rTop += ` Q ${xScale(cur_x + dx/2)},${yScale(cur_y - (cur_x + dx/2))} ${xScale(nxt_x)},${yScale(nxt_y - nxt_x)}`;
        cur_x = nxt_x; cur_y = nxt_y;
    }
    if (t >= mx) {
        dBot += ` L ${xScale(t)},${yScale(kx)}`; rBot += ` L ${xScale(t)},${yScale(kx)}`;
        dTop += ` L ${xScale(t)},${yScale(kx - t)}`; rTop += ` L ${xScale(t)},${yScale(kx - t)}`;
    }
    rBot += ` L ${xScale(t)},${yScale(CONFIG.domainMax)} Z`; rTop += ` L ${xScale(t)},${yScale(CONFIG.domainMax)} Z`;

    return { pathTop: dTop, pathBottom: dBot, regionTop: rTop, regionBottom: rBot };
}

function generateExpectedProfiles(t, kx, mxe, kxe) {
    let target_m = Math.max(t, mxe);
    let pathBot = `M ${xScale(t)},${yScale(kx)} Q ${xScale(t + (target_m - t)/2)},${yScale(kx)} ${xScale(target_m)},${yScale(kxe)} L ${xScale(CONFIG.domainMax)},${yScale(kxe)}`;
    let pathTop = `M ${xScale(t)},${yScale(kx - t)} Q ${xScale(t + (target_m - t)/2)},${yScale(kx - (t + (target_m - t)/2))} ${xScale(target_m)},${yScale(kxe - target_m)}`;
    pathTop += kxe < CONFIG.domainMax ? ` L ${xScale(kxe)},${yScale(0)}` : ` L ${xScale(CONFIG.domainMax)},${yScale(kxe - CONFIG.domainMax)}`;

    let regionTop = pathTop + (kxe < CONFIG.domainMax ? ` L ${xScale(CONFIG.domainMax)},${yScale(0)}` : "") + ` L ${xScale(CONFIG.domainMax)},${yScale(CONFIG.domainMax)} L ${xScale(t)},${yScale(CONFIG.domainMax)} Z`;
    let regionBot = pathBot + ` L ${xScale(CONFIG.domainMax)},${yScale(CONFIG.domainMax)} L ${xScale(t)},${yScale(CONFIG.domainMax)} Z`;

    return { pathTop, pathBottom: pathBot, regionTop, regionBot };
}

function generateDistPaths(t, kx, log_n_m, prior, type) {
    const steps = 80; const stepSize = (kx - t) / steps;
    const h = layoutL.chartHeight, clipH = layoutL.probClipHeight;

    if (prior === 'speed' && type === 'm') {
        return { fill: `M ${xScale(t)},${h} L ${xScale(t)},${h + clipH} L ${xScale(t)+2},${h + clipH} L ${xScale(t)+2},${h} Z`, stroke: `M ${xScale(t)},${h} L ${xScale(t)},${h + clipH}` };
    }

    let pts = [];
    for (let i = 0; i <= steps; i++) {
        let xVal = t + i * stepSize;
        let prob = prior === 'length' ? getProbabilityLength(xVal, kx, t, log_n_m, type) : (prior === 'speed' ? getProbabilitySpeed(xVal, kx, t, log_n_m, type) : getProbabilityAlgorithmic(xVal, kx, t, log_n_m, type));
        pts.push({ x: xScale(xVal), trueY: h + prob * 750, clippedY: h + Math.min(clipH, prob * 750) });
    }

    let fillPath = `M ${xScale(t)},${h}`;
    pts.forEach(p => fillPath += ` L ${p.x},${p.clippedY}`);
    fillPath += ` L ${xScale(kx)},${h} Z`;

    let strkPath = "";
    let inZone = p => p.trueY <= h + clipH;

    for(let i=0; i < pts.length - 1; i++) {
        if (inZone(pts[i]) && inZone(pts[i+1])) { strkPath += (strkPath===""?`M ${pts[i].x},${pts[i].trueY}`:"") + ` L ${pts[i+1].x},${pts[i+1].trueY}`; }
        else if (inZone(pts[i]) && !inZone(pts[i+1])) { strkPath += (strkPath===""?`M ${pts[i].x},${pts[i].trueY}`:"") + ` L ${pts[i].x + ((h + clipH) - pts[i].trueY)/(pts[i+1].trueY - pts[i].trueY)*(pts[i+1].x - pts[i].x)},${h + clipH}`; }
        else if (!inZone(pts[i]) && inZone(pts[i+1])) { strkPath += ` M ${pts[i].x + ((h + clipH) - pts[i].trueY)/(pts[i+1].trueY - pts[i].trueY)*(pts[i+1].x - pts[i].x)},${h + clipH} L ${pts[i+1].x},${pts[i+1].trueY}`; }
    }
    return { fill: fillPath, stroke: strkPath };
}

function generateDistPathsVertical(t, kx, log_n_m, prior, type) {
    const steps = 80; const stepSize = (kx - t) / steps;
    const clipH = layoutL.probClipHeight;

    let pts = [];
    for (let i = 0; i <= steps; i++) {
        let yVal = t + i * stepSize;
        let prob = prior === 'length' ? getProbabilityLength(yVal, kx, t, log_n_m, type) : (prior === 'speed' ? getProbabilitySpeed(yVal, kx, t, log_n_m, type) : getProbabilityAlgorithmic(yVal, kx, t, log_n_m, type));
        pts.push({ y: yScale(yVal), trueX: -prob * 750, clippedX: Math.max(-clipH, -prob * 750) });
    }

    let fillPath = `M 0,${yScale(t)}`;
    pts.forEach(p => fillPath += ` L ${p.clippedX},${p.y}`);
    fillPath += ` L 0,${yScale(kx)} Z`;

    let strkPath = "";
    let inZone = p => p.trueX >= -clipH;
    for(let i=0; i < pts.length - 1; i++) {
        if (inZone(pts[i]) && inZone(pts[i+1])) { strkPath += (strkPath===""?`M ${pts[i].trueX},${pts[i].y}`:"") + ` L ${pts[i+1].trueX},${pts[i+1].y}`; }
        else if (inZone(pts[i]) && !inZone(pts[i+1])) { strkPath += (strkPath===""?`M ${pts[i].trueX},${pts[i].y}`:"") + ` L ${-clipH},${pts[i].y + (-clipH - pts[i].trueX)/(pts[i+1].trueX - pts[i].trueX)*(pts[i+1].y - pts[i].y)}`; }
        else if (!inZone(pts[i]) && inZone(pts[i+1])) { strkPath += ` M ${-clipH},${pts[i].y + (-clipH - pts[i].trueX)/(pts[i+1].trueX - pts[i].trueX)*(pts[i+1].y - pts[i].y)} L ${pts[i+1].trueX},${pts[i+1].y}`; }
    }
    return { fill: fillPath, stroke: strkPath };
}

/**
 * ==========================================
 * 6. UI COMPONENTS & PLOT HELPERS
 * ==========================================
 */
function createPlot(containerNode, svgW, svgH, xLabel, yLabel, w, h, m) {
    const svg = containerNode.append("svg").attr("width", svgW).attr("height", svgH)
        .append("g").attr("transform", `translate(${m.left},${m.top})`);

    const layers = {
        bg: svg.append("g").attr("class", "layer-bg"),
        data: svg.append("g").attr("class", "layer-data"),
        axes: svg.append("g").attr("class", "layer-axes"),
        labels: svg.append("g").attr("class", "layer-labels"),
        points: svg.append("g").attr("class", "layer-points")
    };

    layers.axes.append("line").attr("class", "axis-line x-axis-line").attr("marker-end", "url(#arrow)")
        .attr("x1", 0).attr("y1", h).attr("x2", w).attr("y2", h);
    layers.axes.append("line").attr("class", "axis-line y-axis-line").attr("marker-end", "url(#arrow)")
        .attr("x1", 0).attr("y1", h).attr("x2", 0).attr("y2", 0);

    return layers;
}

function addMathLabel(group, name, x, y, colorHex, align = "middle") {
    const latex = latexMap[name] || name;
    if (!labelCache[name]) {
        if(window.MathJax && MathJax.tex2svg) {
            const node = MathJax.tex2svg(latex);
            const svgNode = node.querySelector('svg');
            if(svgNode) labelCache[name] = svgNode.cloneNode(true);
        }
    }
    if (labelCache[name]) {
        const clone = labelCache[name].cloneNode(true);
        clone.style.color = colorHex || CONFIG.colors.dark;

        const g = group.append("g").attr("class", "mjx-container").node();
        g.appendChild(clone);

        const scale = 0.35;
        const bbox = g.getBBox();
        let dx = align === "middle" ? -bbox.width * scale / 2 : (align === "end" ? -bbox.width * scale : 0);
        let dy = bbox.height * scale / 2;
        d3.select(g).attr("transform", `translate(${x + dx}, ${y - dy}) scale(${scale})`);
    } else {
        group.append("text").attr("x", x).attr("y", y).text(name).attr("fill", "red").style("font-size", "12px");
    }
}

const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

function updateSymbolUI() {
    let symbol = state.prior === 'algorithmic' ? 'M' : state.prior === 'speed' ? 'S' : 'L';
    const display = document.getElementById('priorSymbolDisplay');
    display.innerHTML = `\\(x \\sim ${symbol}\\)`;
    if (window.MathJax && MathJax.typesetPromise) MathJax.typesetPromise([display]).catch(err => console.log(err));
}

// Initialize Plot SVG Layers
const topPlot = createPlot(colLeft, layoutL.widthTotal, layoutL.chartHeight + layoutL.margin.top + layoutL.offsetTopPlotY, "Complexity", "Log-Size", widthLeft, layoutL.chartHeight, layoutL.margin);
const bottomPlot = createPlot(colLeft, layoutL.widthTotal, layoutL.chartHeight + layoutL.margin.top + layoutL.offsetBotPlotY, "Runtime", "Complexity", widthLeft, layoutL.chartHeight, layoutL.margin);

const rightPlot1 = createPlot(colRight, layoutR.widthTotal, layoutR.chartHeightBase, "t - m_x", "Prob", widthRight, chartHeightRight, layoutR.margin);
const rightPlot2 = createPlot(colRight, layoutR.widthTotal, layoutR.chartHeightBase, "X", "Y", widthRight, chartHeightRight, layoutR.margin);
const rightPlot3 = createPlot(colRight, layoutR.widthTotal, layoutR.chartHeightBase, "X", "Y", widthRight, chartHeightRight, layoutR.margin);

rightPlot2.data.attr("clip-path", "url(#clip-right2)");
rightPlot2.points.attr("clip-path", "url(#clip-right2)");

/**
 * ==========================================
 * 7. INITIALIZATION & STATIC RENDER
 * ==========================================
 */
function initStaticLabels() {
    // Fix middle plot X-axis to standard 0 mapping
    rightPlot2.axes.select(".x-axis-line").attr("y1", yScaleRightDiff2(0)).attr("y2", yScaleRightDiff2(0));
    rightPlot2.axes.append("line").attr("class", "guide-expected")
        .attr("x1", xScaleRight(0)).attr("y1", yScaleRightDiff2(0))
        .attr("x2", xScaleRight(CONFIG.domainMax / 8)).attr("y2", yScaleRightDiff2(CONFIG.domainMax / 8))
        .style("stroke", CONFIG.colors.lightGray).style("stroke-width", "1.5px").style("stroke-dasharray", "none");

    addMathLabel(rightPlot2.axes, "delta_t", xScaleRight(CONFIG.domainMax / 8) + 5, yScaleRightDiff2(CONFIG.domainMax / 8) + 12, CONFIG.colors.gray, "start");

    // Titles - Elevated slightly relative to margin to avoid legend overlap
    rightPlot1.axes.append("text").attr("class", "plot-title").attr("x", -layoutR.margin.left).attr("y", -layoutR.margin.top + 15).attr("text-anchor", "start").text("Probability of future drop");
    rightPlot2.axes.append("text").attr("class", "plot-title").attr("x", -layoutR.margin.left).attr("y", -layoutR.margin.top + 15).attr("text-anchor", "start").text("Expected relative position of last drop");
    rightPlot3.axes.append("text").attr("class", "plot-title").attr("x", -layoutR.margin.left).attr("y", -layoutR.margin.top + 15).attr("text-anchor", "start").text("Expected future compression progress");

    topPlot.axes.append("text").attr("class", "axis-title").attr("x", widthLeft).attr("y", layoutL.chartHeight - 11).attr("text-anchor", "end").text("Complexity");
    topPlot.axes.append("text").attr("class", "axis-title").attr("x", 0).attr("y", -15).attr("text-anchor", "middle").text("Log-Size");
    bottomPlot.axes.append("text").attr("class", "axis-title").attr("x", widthLeft).attr("y", layoutL.chartHeight - 11).attr("text-anchor", "end").text("Runtime");
    bottomPlot.axes.append("text").attr("class", "axis-title").attr("x", 0).attr("y", -15).attr("text-anchor", "middle").text("Complexity");

    // Axis labels Right
    [rightPlot1, rightPlot3].forEach(plot => addMathLabel(plot.axes, "delta_t", widthRight, chartHeightRight - 20, CONFIG.colors.dark, "end"));
    addMathLabel(rightPlot2.axes, "delta_t", widthRight, yScaleRightDiff2(0) - 20, CONFIG.colors.dark, "end");

    // Transform EQ Box
    const bx = CONFIG.layout.box;
    const boxX = -0.5 * bx.width + bx.offsetX;
    const boxY = layoutL.chartHeight + bx.offsetY;

    // Adjusted arrow lengths/positioning for proper spacing around the box
    topPlot.axes.append("line").attr("x1", bx.offsetX).attr("y1", boxY - 20).attr("x2", bx.offsetX).attr("y2", boxY - 4)
        .attr("stroke", CONFIG.colors.grayNeutral).attr("stroke-width", 2).attr("marker-end", "url(#arrow-gray)");

    topPlot.axes.append("rect").attr("x", boxX).attr("y", boxY).attr("width", bx.width).attr("height", bx.height)
        .attr("rx", 8).attr("fill", CONFIG.colors.boxFill).attr("stroke", CONFIG.colors.grayNeutral).attr("stroke-width", 1.5);

    topPlot.axes.append("line").attr("x1", bx.offsetX).attr("y1", boxY + bx.height).attr("x2", bx.offsetX).attr("y2", boxY + bx.height + 16)
        .attr("stroke", CONFIG.colors.grayNeutral).attr("stroke-width", 2).attr("marker-end", "url(#arrow-gray)");

    addMathLabel(topPlot.axes, "transform_eq", boxX + bx.width/2, boxY + bx.height/2 + 2, CONFIG.colors.dark, "middle");
}

/**
 * ==========================================
 * 8. MAIN RENDER LOOP (UPDATE)
 * ==========================================
 */
function update() {
    let symbol = state.prior === 'algorithmic' ? 'M' : state.prior === 'speed' ? 'S' : 'L';
    let c = CONFIG.colors;

    // Generate Dynamic Labels
    Object.assign(latexMap, {
        'probLabelK': `p_${symbol}(k_x \\mid \\hat{P}, m_x \\ge t)`,
        'probLabelM': `p_${symbol}(m_x \\mid \\hat{P}, m_x \\ge t)`,
        'probLabelKBot': `p_${symbol}(k_x \\mid \\hat{P}, m_x \\ge t)`,
        'probLabelMBot': `p_${symbol}(\\text{BB}(m_x) \\mid \\hat{P}, m_x \\ge t)`,
        'prob_drop': `p_${symbol}(m_x \\ge t \\mid \\hat{P})`,
        'Em_diff': `\\mathbb{E}_{x \\sim ${symbol}}[m_x \\mid \\hat{P}] - \\hat{m}`,
        'Ek_diff': `\\hat{k} - \\mathbb{E}_{x \\sim ${symbol}}[k_x \\mid \\hat{P}]`,
        'prob_drop_horizon_title': `p_${symbol}(\\text{drop within } \\Delta c \\text{ after } t \\mid \\hat{P})`,
        'exp_prog_horizon_title': `\\text{Expected compression }`,
        'exp_prog_horizon_subtitle': `\\text{progress within } \\Delta c \\text{ after } t`,
        'delta_c_1': `\\Delta c = 1`,
        'delta_c_2': `\\Delta c = 2`,
        'delta_c_4': `\\Delta c = 4`
    });

    // Clear Dynamic Caches & DOM Layers
    ['probLabelK', 'probLabelM', 'probLabelKBot', 'probLabelMBot', 'prob_drop', 'Em_diff', 'Ek_diff', 'prob_drop_horizon_title', 'exp_prog_horizon_title', 'exp_prog_horizon_subtitle', 'delta_c_1', 'delta_c_2', 'delta_c_4'].forEach(k => delete labelCache[k]);

    [topPlot, bottomPlot, rightPlot1, rightPlot2, rightPlot3].forEach(plot => {
        plot.bg.selectAll("*").remove(); plot.data.selectAll("*").remove(); plot.labels.selectAll("*").remove(); plot.points.selectAll("*").remove();
    });

    // === Left Calculations ===
    const { mxe, kxe, log_n_m } = calculateExpected(state.kx, state.t, state.prior);
    let bx = Math.max(0, state.kx - state.mx);
    let max_h_m = getMaxProbHeight(state.kx, state.t, log_n_m, state.prior, 'm');
    let max_h_k = getMaxProbHeight(state.kx, state.t, log_n_m, state.prior, 'k');

    let min_val_k = state.kx;
    for (let i = 0; i <= 200; i++) {
        let val = state.t + i * ((state.kx - state.t) / 200);
        let prob = state.prior === 'length' ? getProbabilityLength(val, state.kx, state.t, log_n_m, 'k') : (state.prior === 'speed' ? getProbabilitySpeed(val, state.kx, state.t, log_n_m, 'k') : getProbabilityAlgorithmic(val, state.kx, state.t, log_n_m, 'k'));
        if (prob > 0.001) { min_val_k = val; break; }
    }

    const obsData = generateProfiles(state.nx, state.kx, state.mx, state.t);
    const expData = generateExpectedProfiles(state.t, state.kx, mxe, kxe);
    const distK = generateDistPaths(state.t, state.kx, log_n_m, state.prior, 'k');
    const distM = generateDistPaths(state.t, state.kx, log_n_m, state.prior, 'm');
    const distKBot = generateDistPathsVertical(state.t, state.kx, log_n_m, state.prior, 'k');

    // --- Render Left ---
    topPlot.data.append("path").attr("class", "shaded-region-expected").attr("d", expData.regionTop);
    bottomPlot.data.append("path").attr("class", "shaded-region-expected").attr("d", expData.regionBot);
    topPlot.data.append("path").attr("class", "shaded-region").attr("d", obsData.regionTop);
    bottomPlot.data.append("path").attr("class", "shaded-region").attr("d", obsData.regionBottom);

    [topPlot, bottomPlot].forEach(plot => { plot.data.append("path").attr("class", "dist-region-m").attr("d", distM.fill); plot.data.append("path").attr("class", "dist-curve-m").attr("d", distM.stroke); });
    topPlot.data.append("path").attr("class", "dist-region-k").attr("d", distK.fill); topPlot.data.append("path").attr("class", "dist-curve-k").attr("d", distK.stroke);
    bottomPlot.data.append("path").attr("class", "dist-region-k").attr("d", distKBot.fill); bottomPlot.data.append("path").attr("class", "dist-curve-k").attr("d", distKBot.stroke);

    topPlot.data.append("path").attr("class", "expected-profile").attr("d", expData.pathTop); bottomPlot.data.append("path").attr("class", "expected-profile").attr("d", expData.pathBottom);
    topPlot.data.append("path").attr("class", "observed-profile").attr("d", obsData.pathTop); bottomPlot.data.append("path").attr("class", "observed-profile").attr("d", obsData.pathBottom);

    let labelX = state.t / 2, labelExX = state.t + (CONFIG.domainMax - state.t) / 2, regionYPos = yScale(CONFIG.domainMax) + 17;

    topPlot.labels.append("text").attr("class", "region-label").attr("x", xScale(labelX)).attr("y", regionYPos).text("observed:");
    addMathLabel(topPlot.labels, "Px", xScale(labelX), regionYPos + 10, c.dark, "middle");
    topPlot.labels.append("text").attr("class", "region-label-expected").attr("x", xScale(labelExX)).attr("y", regionYPos).text("expected:");
    addMathLabel(topPlot.labels, "ePx", xScale(labelExX), regionYPos + 12, c.lightGray, "middle");

    bottomPlot.labels.append("text").attr("class", "region-label").attr("x", xScale(labelX)).attr("y", regionYPos).text("observed:");
    addMathLabel(bottomPlot.labels, "Dx", xScale(labelX), regionYPos + 10, c.dark, "middle");
    bottomPlot.labels.append("text").attr("class", "region-label-expected").attr("x", xScale(labelExX)).attr("y", regionYPos).text("expected:");
    addMathLabel(bottomPlot.labels, "eDx", xScale(labelExX), regionYPos + 12, c.lightGray, "middle");

    addMathLabel(topPlot.labels, "probLabelM", xScale(state.t) - 5, layoutL.chartHeight + max_h_m / 2, c.green, "end");
    addMathLabel(topPlot.labels, "probLabelK", xScale(state.kx) + 5, layoutL.chartHeight + max_h_k / 2, c.blue, "start");
    addMathLabel(bottomPlot.labels, "probLabelMBot", xScale(state.t) - 5, layoutL.chartHeight + max_h_m / 2, c.green, "end");
    addMathLabel(bottomPlot.labels, "probLabelKBot", -15, yScale(min_val_k) + 30, c.blue, "end");

    // Guides Top & Bottom
    topPlot.data.append("line").attr("class", "guide-expected").attr("x1", xScale(mxe)).attr("y1", layoutL.chartHeight).attr("x2", xScale(mxe)).attr("y2", yScale(kxe - mxe));
    topPlot.data.append("line").attr("class", "guide-expected").attr("x1", xScale(mxe)).attr("y1", yScale(kxe - mxe)).attr("x2", xScale(kxe)).attr("y2", layoutL.chartHeight);
    bottomPlot.data.append("line").attr("class", "guide-expected").attr("x1", xScale(mxe)).attr("y1", layoutL.chartHeight).attr("x2", xScale(mxe)).attr("y2", yScale(kxe));
    bottomPlot.data.append("line").attr("class", "guide-expected").attr("x1", 0).attr("y1", yScale(kxe)).attr("x2", xScale(mxe)).attr("y2", yScale(kxe));

    topPlot.data.append("line").attr("class", "guide-diagonal").attr("x1", xScale(0)).attr("y1", yScale(state.nx)).attr("x2", xScale(state.nx)).attr("y2", yScale(0));
    topPlot.data.append("line").attr("class", "guide-diagonal").attr("x1", xScale(0)).attr("y1", yScale(state.kx)).attr("x2", xScale(state.kx)).attr("y2", yScale(0));
    topPlot.data.append("line").attr("class", "guide-line").attr("x1", xScale(state.mx)).attr("y1", yScale(bx)).attr("x2", xScale(state.mx)).attr("y2", yScale(0));
    topPlot.data.append("line").attr("class", "guide-line").attr("x1", xScale(state.t)).attr("y1", yScale(CONFIG.domainMax)).attr("x2", xScale(state.t)).attr("y2", yScale(0));
    topPlot.data.append("line").attr("class", "guide-line").attr("x1", xScale(0)).attr("y1", yScale(bx)).attr("x2", xScale(state.mx)).attr("y2", yScale(bx));
    bottomPlot.data.append("line").attr("class", "guide-line").attr("x1", xScale(0)).attr("y1", yScale(state.nx)).attr("x2", widthLeft).attr("y2", yScale(state.nx));
    bottomPlot.data.append("line").attr("class", "guide-line").attr("x1", xScale(0)).attr("y1", yScale(state.kx)).attr("x2", widthLeft).attr("y2", yScale(state.kx));
    bottomPlot.data.append("line").attr("class", "guide-line").attr("x1", xScale(state.mx)).attr("y1", yScale(state.kx)).attr("x2", xScale(state.mx)).attr("y2", yScale(0));
    bottomPlot.data.append("line").attr("class", "guide-line").attr("x1", xScale(state.t)).attr("y1", yScale(CONFIG.domainMax)).attr("x2", xScale(state.t)).attr("y2", yScale(0));

    // Axis Value Extensions
    let m_h = getProbHeight(mxe, state.kx, state.t, log_n_m, state.prior, 'm');
    let k_h = getProbHeight(kxe, state.kx, state.t, log_n_m, state.prior, 'k');
    topPlot.data.append("line").attr("x1", xScale(mxe)).attr("y1", layoutL.chartHeight).attr("x2", xScale(mxe)).attr("y2", layoutL.chartHeight + m_h).attr("stroke", c.green).attr("stroke-width", CONFIG.strokes.guide).attr("stroke-dasharray", "4,4");
    addMathLabel(topPlot.labels, "mxe", xScale(mxe), layoutL.chartHeight + m_h + 15, c.green, "middle");
    topPlot.data.append("line").attr("x1", xScale(kxe)).attr("y1", layoutL.chartHeight).attr("x2", xScale(kxe)).attr("y2", layoutL.chartHeight + k_h).attr("stroke", c.blue).attr("stroke-width", CONFIG.strokes.guide).attr("stroke-dasharray", "4,4");
    addMathLabel(topPlot.labels, "kxe", xScale(kxe), layoutL.chartHeight + k_h + 15, c.blue, "middle");

    let m_h_bot = getProbHeight(mxe, state.kx, state.t, log_n_m, state.prior, 'm');
    let k_w_bot = getProbHeight(kxe, state.kx, state.t, log_n_m, state.prior, 'k');
    bottomPlot.data.append("line").attr("x1", xScale(mxe)).attr("y1", layoutL.chartHeight).attr("x2", xScale(mxe)).attr("y2", layoutL.chartHeight + m_h_bot).attr("stroke", c.green).attr("stroke-width", CONFIG.strokes.guide).attr("stroke-dasharray", "4,4");
    addMathLabel(bottomPlot.labels, "bbmxe", xScale(mxe), layoutL.chartHeight + m_h_bot + 15, c.green, "middle");
    bottomPlot.data.append("line").attr("x1", 0).attr("y1", yScale(kxe)).attr("x2", -k_w_bot).attr("y2", yScale(kxe)).attr("stroke", c.blue).attr("stroke-width", CONFIG.strokes.guide).attr("stroke-dasharray", "4,4");
    addMathLabel(bottomPlot.labels, "kxe", -k_w_bot - 15, yScale(kxe), c.blue, "end");

    // Scale Marker Labels
    let tL_X = [{name: 'mx', x: state.mx, y: layoutL.chartHeight + 20}, {name: 't', x: state.t, y: layoutL.chartHeight + 20}, {name: 'kx', x: state.kx, y: layoutL.chartHeight + 20}].sort((a,b) => a.x - b.x);
    for (let i = 1; i < tL_X.length; i++) if (xScale(tL_X[i].x) - xScale(tL_X[i-1].x) < 10) tL_X[i].y = tL_X[i-1].y === layoutL.chartHeight + 20 ? layoutL.chartHeight + 42 : layoutL.chartHeight + 20;
    tL_X.forEach(l => addMathLabel(topPlot.labels, l.name, xScale(l.x), l.y, c.dark, "middle"));

    let tL_Y = [{name: 'kx_minus_mx', y: yScale(bx)}, {name: 'nx', y: yScale(state.nx)}];
    if (Math.abs(tL_Y[1].y - tL_Y[0].y) < 20) { tL_Y[0].y += 10; tL_Y[1].y -= 10; }
    tL_Y.forEach(l => addMathLabel(topPlot.labels, l.name, -15, l.y - 4, c.dark, "end"));

    let bL_X = [{name: 'bbmx', x: state.mx, y: layoutL.chartHeight + 20}, {name: 'bbt', x: state.t, y: layoutL.chartHeight + 20}].sort((a,b) => a.x - b.x);
    for (let i = 1; i < bL_X.length; i++) if (xScale(bL_X[i].x) - xScale(bL_X[i-1].x) < 40) bL_X[i].y = bL_X[i-1].y === layoutL.chartHeight + 20 ? layoutL.chartHeight + 42 : layoutL.chartHeight + 20;
    bL_X.forEach(l => addMathLabel(bottomPlot.labels, l.name, xScale(l.x), l.y, c.dark, "middle"));

    let bL_Y = [{name: 'kx', y: yScale(state.kx)}, {name: 'nx', y: yScale(state.nx)}].sort((a,b) => b.y - a.y);
    for (let i = 1; i < bL_Y.length; i++) if (Math.abs(bL_Y[i].y - bL_Y[i-1].y) < 20) bL_Y[i].y = bL_Y[i-1].y - 20;
    bL_Y.forEach(l => addMathLabel(bottomPlot.labels, l.name, -15, l.y - 4, c.dark, "end"));

    // Interactive Point Overlay Left
    topPlot.points.append("circle").attr("class", "point-expected").attr("cx", xScale(mxe)).attr("cy", yScale(kxe - mxe)).attr("r", 4);
    bottomPlot.points.append("circle").attr("class", "point-expected").attr("cx", xScale(mxe)).attr("cy", yScale(kxe)).attr("r", 4);
    topPlot.points.append("circle").attr("class", "point").attr("cx", xScale(0)).attr("cy", yScale(state.nx)).attr("r", 5).call(dragNx_top);
    topPlot.points.append("circle").attr("class", "point").attr("cx", xScale(state.kx)).attr("cy", yScale(0)).attr("r", 5).call(dragKx_top);
    topPlot.points.append("circle").attr("class", "point").attr("cx", xScale(state.mx)).attr("cy", yScale(bx)).attr("r", 5).call(dragMx_top);
    topPlot.points.append("circle").attr("class", "point").attr("cx", xScale(state.t)).attr("cy", yScale(0)).attr("r", 5).call(dragT_top);

    bottomPlot.points.append("circle").attr("class", "point").attr("cx", xScale(0)).attr("cy", yScale(state.nx)).attr("r", 5).call(dragNx_bottom);
    bottomPlot.points.append("circle").attr("class", "point").attr("cx", xScale(0)).attr("cy", yScale(state.kx)).attr("r", 5).call(dragKx_bottom);
    bottomPlot.points.append("circle").attr("class", "point").attr("cx", xScale(state.mx)).attr("cy", yScale(state.kx)).attr("r", 5).call(dragMx_bottom);
    bottomPlot.points.append("circle").attr("class", "point").attr("cx", xScale(state.t)).attr("cy", yScale(0)).attr("r", 5).call(dragT_bottom);


    // === Right Calculations ===
    let dropPts = [], dropH1 = [], dropH2 = [], dropH3 = [];
    let crv2Pts = [], crv3Pts = [], crv3H1 = [], crv3H2 = [], crv3H3 = [];
    let { horizons: hr } = CONFIG;

    for(let x_val = 0; x_val <= CONFIG.domainMax; x_val += 0.5) {
        let t_sim = state.mx + x_val;
        let prob = 0;
        let h1_res = {prob_drop_horizon: 0, progress_horizon: 0};
        let h2_res = {prob_drop_horizon: 0, progress_horizon: 0};
        let h3_res = {prob_drop_horizon: 0, progress_horizon: 0};

        if (t_sim < state.kx) {
            if (state.prior === 'algorithmic') {
                prob = future_drop_prob_al(t_sim, state.kx, state.mx);
                h1_res = future_drop_prob_horizon_al(t_sim, state.kx, state.mx, hr[0]);
                h2_res = future_drop_prob_horizon_al(t_sim, state.kx, state.mx, hr[1]);
                h3_res = future_drop_prob_horizon_al(t_sim, state.kx, state.mx, hr[2]);
            } else if (state.prior === 'length') {
                prob = future_drop_prob_len(t_sim, state.kx, state.mx);
                h1_res = future_drop_prob_horizon_len(t_sim, state.kx, state.mx, hr[0]);
                h2_res = future_drop_prob_horizon_len(t_sim, state.kx, state.mx, hr[1]);
                h3_res = future_drop_prob_horizon_len(t_sim, state.kx, state.mx, hr[2]);
            }
        }

        prob = Math.max(0, Math.min(1, prob));
        dropPts.push({x: xScaleRight(x_val), y: yScaleRightProb(prob)});
        dropH1.push({x: xScaleRight(x_val), y: yScaleRightProb(Math.max(0, Math.min(1, h1_res.prob_drop_horizon)))});
        dropH2.push({x: xScaleRight(x_val), y: yScaleRightProb(Math.max(0, Math.min(1, h2_res.prob_drop_horizon)))});
        dropH3.push({x: xScaleRight(x_val), y: yScaleRightProb(Math.max(0, Math.min(1, h3_res.prob_drop_horizon)))});

        let exp_sim = calculateExpected(state.kx, Math.min(t_sim, state.kx), state.prior);
        let val2 = (1 - prob) * state.mx + prob * exp_sim.mxe - state.mx;
        let val3 = state.kx - ((1 - prob) * state.kx + prob * exp_sim.kxe);

        crv2Pts.push({x: xScaleRight(x_val), y: yScaleRightDiff2(val2)});
        crv3Pts.push({x: xScaleRight(x_val), y: yScaleRightDiff3(val3)});
        crv3H1.push({x: xScaleRight(x_val), y: yScaleRightDiff3(h1_res.progress_horizon)});
        crv3H2.push({x: xScaleRight(x_val), y: yScaleRightDiff3(h2_res.progress_horizon)});
        crv3H3.push({x: xScaleRight(x_val), y: yScaleRightDiff3(h3_res.progress_horizon)});
    }

    // --- Render Right ---
    let lineGen = d3.line().x(d => d.x).y(d => d.y);
    let opa = CONFIG.opacities.horizons;

    rightPlot1.data.append("path").attr("class", "curve-drop").attr("d", lineGen(dropH1)).style("opacity", opa[0]);
    rightPlot1.data.append("path").attr("class", "curve-drop").attr("d", lineGen(dropH2)).style("opacity", opa[1]);
    rightPlot1.data.append("path").attr("class", "curve-drop").attr("d", lineGen(dropH3)).style("opacity", opa[2]);
    rightPlot1.data.append("path").attr("class", "curve-drop").attr("d", lineGen(dropPts));

    rightPlot2.data.append("path").attr("class", "curve-drop").attr("d", lineGen(crv2Pts)).style("stroke", c.green);

    rightPlot3.data.append("path").attr("class", "curve-drop").attr("d", lineGen(crv3H1)).style("stroke", c.blue).style("opacity", opa[0]);
    rightPlot3.data.append("path").attr("class", "curve-drop").attr("d", lineGen(crv3H2)).style("stroke", c.blue).style("opacity", opa[1]);
    rightPlot3.data.append("path").attr("class", "curve-drop").attr("d", lineGen(crv3H3)).style("stroke", c.blue).style("opacity", opa[2]);
    rightPlot3.data.append("path").attr("class", "curve-drop").attr("d", lineGen(crv3Pts)).style("stroke", c.blue);

    // Active Point Logic Right
    let cur_diff = state.t - state.mx;
    let cur_prob = state.t >= state.kx ? 0 :
                   state.prior === 'algorithmic' ? future_drop_prob_al(state.t, state.kx, state.mx) :
                   state.prior === 'length' ? future_drop_prob_len(state.t, state.kx, state.mx) : 0;
    cur_prob = Math.max(0, Math.min(1, cur_prob));

    let exp_curr = calculateExpected(state.kx, state.t, state.prior);
    let val2_curr = (1 - cur_prob) * state.mx + cur_prob * exp_curr.mxe - state.mx;
    let val3_curr = state.kx - ((1 - cur_prob) * state.kx + cur_prob * exp_curr.kxe);

    let cx = xScaleRight(cur_diff);
    rightPlot1.data.append("line").attr("class", "guide-current-t").attr("x1", cx).attr("y1", yScaleRightProb(1.111)).attr("x2", cx).attr("y2", yScaleRightProb(0));
    rightPlot1.points.append("circle").attr("cx", cx).attr("cy", yScaleRightProb(cur_prob)).attr("r", 4).style("fill", c.orange).style("stroke", c.base).style("stroke-width", "1.5px");

    rightPlot2.data.append("line").attr("class", "guide-current-t").attr("x1", cx).attr("y1", yScaleRightDiff2(CONFIG.domainMax / 3)).attr("x2", cx).attr("y2", yScaleRightDiff2(-CONFIG.domainMax / 3));
    rightPlot2.points.append("circle").attr("cx", cx).attr("cy", yScaleRightDiff2(val2_curr)).attr("r", 4).style("fill", c.green).style("stroke", c.base).style("stroke-width", "1.5px");

    rightPlot3.data.append("line").attr("class", "guide-current-t").attr("x1", cx).attr("y1", yScaleRightDiff3(CONFIG.domainMax / 2)).attr("x2", cx).attr("y2", yScaleRightDiff3(0));
    rightPlot3.points.append("circle").attr("cx", cx).attr("cy", yScaleRightDiff3(val3_curr)).attr("r", 4).style("fill", c.blue).style("stroke", c.base).style("stroke-width", "1.5px");

    // Right Labels with corrected Y alignment bounds
    let legX = widthRight, startY = -20, endX = legX - 60, startX = endX - 20;

    addMathLabel(rightPlot1.labels, "prob_drop", -15, startY, c.orange, "start");
    addMathLabel(rightPlot2.labels, "Em_diff", -15, startY, c.green, "start");
    addMathLabel(rightPlot3.labels, "Ek_diff", -15, startY, c.blue, "start");

    addMathLabel(rightPlot1.labels, "prob_drop_horizon_title", legX, startY, c.gray, "end");
    addMathLabel(rightPlot1.labels, "delta_c_1", legX, startY + 22, c.gray, "end");
    addMathLabel(rightPlot1.labels, "delta_c_2", legX, startY + 42, c.gray, "end");
    addMathLabel(rightPlot1.labels, "delta_c_4", legX, startY + 62, c.gray, "end");

    rightPlot1.labels.append("line").attr("x1", startX).attr("y1", startY + 22).attr("x2", endX).attr("y2", startY + 22).style("stroke", c.orange).style("stroke-width", "2.5px").style("opacity", opa[0]);
    rightPlot1.labels.append("line").attr("x1", startX).attr("y1", startY + 42).attr("x2", endX).attr("y2", startY + 42).style("stroke", c.orange).style("stroke-width", "2.5px").style("opacity", opa[1]);
    rightPlot1.labels.append("line").attr("x1", startX).attr("y1", startY + 62).attr("x2", endX).attr("y2", startY + 62).style("stroke", c.orange).style("stroke-width", "2.5px").style("opacity", opa[2]);

    addMathLabel(rightPlot3.labels, "exp_prog_horizon_title", legX, startY - 10, c.gray, "end");
    addMathLabel(rightPlot3.labels, "exp_prog_horizon_subtitle", legX, startY + 8, c.gray, "end");
    addMathLabel(rightPlot3.labels, "delta_c_1", legX, startY + 30, c.gray, "end");
    addMathLabel(rightPlot3.labels, "delta_c_2", legX, startY + 50, c.gray, "end");
    addMathLabel(rightPlot3.labels, "delta_c_4", legX, startY + 70, c.gray, "end");

    rightPlot3.labels.append("line").attr("x1", startX).attr("y1", startY + 30).attr("x2", endX).attr("y2", startY + 30).style("stroke", c.blue).style("stroke-width", "2.5px").style("opacity", opa[0]);
    rightPlot3.labels.append("line").attr("x1", startX).attr("y1", startY + 50).attr("x2", endX).attr("y2", startY + 50).style("stroke", c.blue).style("stroke-width", "2.5px").style("opacity", opa[1]);
    rightPlot3.labels.append("line").attr("x1", startX).attr("y1", startY + 70).attr("x2", endX).attr("y2", startY + 70).style("stroke", c.blue).style("stroke-width", "2.5px").style("opacity", opa[2]);
}

/**
 * ==========================================
 * 9. DRAG INTERACTIONS & EVENT LISTENERS
 * ==========================================
 */
const updateState = () => update();

d3.select('#priorSelect').on('change', (e) => {
    state.prior = e.target.value;
    updateSymbolUI();
    update();
});

const dragMx_top = d3.drag().on("drag", (e) => {
    let n_kx = clamp(xScale.invert(e.x) + yScale.invert(e.y), state.t, state.nx);
    state.mx = clamp(xScale.invert(e.x), 0, n_kx); state.kx = n_kx;
    if (state.t < state.mx) state.t = state.mx; updateState();
});
const dragKx_top = d3.drag().on("drag", (e) => { state.kx = clamp(xScale.invert(e.x), Math.max(state.mx, state.t), state.nx); updateState(); });
const dragT_top = d3.drag().on("drag", (e) => { state.t = clamp(xScale.invert(e.x), state.mx, state.kx); updateState(); });
const dragNx_top = d3.drag().on("drag", (e) => { state.nx = clamp(yScale.invert(e.y), state.kx, CONFIG.domainMax); updateState(); });
const dragMx_bottom = d3.drag().on("drag", (e) => {
    state.kx = clamp(yScale.invert(e.y), state.t, state.nx); state.mx = clamp(xScale.invert(e.x), 0, state.kx);
    if (state.t < state.mx) state.t = state.mx; updateState();
});
const dragT_bottom = d3.drag().on("drag", (e) => { state.t = clamp(xScale.invert(e.x), state.mx, state.kx); updateState(); });
const dragKx_bottom = d3.drag().on("drag", (e) => { state.kx = clamp(yScale.invert(e.y), Math.max(state.mx, state.t), state.nx); updateState(); });
const dragNx_bottom = d3.drag().on("drag", (e) => { state.nx = clamp(yScale.invert(e.y), state.kx, CONFIG.domainMax); updateState(); });

window.addEventListener('load', () => {
     setTimeout(() => {
         initStaticLabels();
         updateSymbolUI();
         update();
     }, 500);
});