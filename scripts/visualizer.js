class StairCurveVisualizer {
    constructor(containerSelector, dataUrl, options = {}) {
        this.container = document.querySelector(containerSelector);
        this.dataUrl = dataUrl;
        this.onProgramSelect = options.onProgramSelect || (() => {});
        this.keyProcessor = options.keyProcessor || (k => k);
        this.horizons = options.horizons || [10, 50, 100];

        this.width = 560;       // Was 800
        this.height = 350;      // Was 500
        this.progHeight = 180;  // Was 250
        this.progMarginBottom = 30;
        this.margin = { top: 40, right: 40, bottom: 35, left: 45 }; // Was 60, 60, 50, 60
        this.selectionRadius = 5; // Was 6

        this.max_runtime = 0;
        this.max_length = 0;
        this.currentPrior = "uniform";
        this.activeHitIndices = new Set();
        this.prevHitIndices = new Set();
        this.selectedCurveIndex = null;
        this.selectedProgramIndex = null;

        this.curvesData = [];
        this.screenCurves = [];
        this.uniquePoints = [];
        this.pointToCurves = new Map();

        this.gapProfiles = {};
        this.dynamicGapProfiles = { inf: [], h1: [], h2: [], h3: [] };
        this.backwardGapProfile = [];
        this.maxGapPlot = 0;

        this.labelCache = {};
        this.latexMap = {
            'M_x': '\\hat{M}',
            'M_y': '\\hat{K}',
            'T_x': 'T',
            'delta_T_M': 'T - \\hat{M}'
        };

        this.initDOM();
        this.initTheme(); // Extract styles from CSS
        this.loadData();
    }

    initTheme() {
        const root = document.documentElement;
        const getVar = (name, fallback) => getComputedStyle(root).getPropertyValue(name).trim() || fallback;

        this.theme = {
            axis: getVar('--color-axis', '#222'),
            textMain: getVar('--text-main', '#444'),
            textMuted: getVar('--text-muted', '#666'),
            guide: getVar('--color-guide', '#bbb'),
            grid: getVar('--color-grid', 'rgba(150, 150, 150, 0.6)'),
            curveInactive: getVar('--curve-inactive', 'rgba(70, 130, 180, 0.3)'),
            curveActive: getVar('--curve-active', '#444444'),
            curveSelected: getVar('--curve-selected', '#ff8c00'),
            shadeLeft: getVar('--shade-left', 'rgba(216, 216, 216, 0.8)'),
            shadeRight: getVar('--shade-right', 'rgba(241, 236, 224, 0.6)'),
            horizons: [
                getVar('--horizon-1', 'rgba(70, 130, 180, 0.4)'),
                getVar('--horizon-2', 'rgba(70, 130, 180, 0.7)'),
                getVar('--horizon-3', '#4682b4')
            ],
            horizonInf: getVar('--horizon-inf', '#315b7e'),
            dynHorizons: [
                getVar('--dyn-horizon-1', '#f4f0e6'),
                getVar('--dyn-horizon-2', '#e3e0da'),
                getVar('--dyn-horizon-3', '#cfcdca')
            ],
            dynHorizonInf: getVar('--dyn-horizon-inf', '#bbb')
        };
    }

    initDOM() {
        // 1. Get the screen's pixel density (usually 2 on a Mac)
        const ratio = window.devicePixelRatio || 1;

        // 2. Setup Main Plot Canvas for High DPI
        this.canvas = this.container.querySelector(".plot-canvas");
        this.canvas.width = this.width * ratio;         // Double the internal pixels
        this.canvas.height = this.height * ratio;
        this.canvas.style.width = this.width + "px";    // Keep the CSS size the same
        this.canvas.style.height = this.height + "px";
        this.ctx = this.canvas.getContext("2d");
        this.ctx.scale(ratio, ratio);                   // Scale the drawing context

        // 3. Setup SVG Layer (SVGs handle retina automatically)
        this.svg = d3.select(this.container).select(".plot-svg")
            .attr("width", this.width).attr("height", this.height);

        // 4. Setup Progress Canvas for High DPI
        this.progCanvas = this.container.querySelector(".prog-canvas");
        this.progCanvas.width = this.width * ratio;
        this.progCanvas.height = this.progHeight * ratio;
        this.progCanvas.style.width = this.width + "px";
        this.progCanvas.style.height = this.progHeight + "px";
        this.progCtx = this.progCanvas.getContext("2d");
        this.progCtx.scale(ratio, ratio);

        this.progSvg = d3.select(this.container).select(".prog-svg")
            .attr("width", this.width).attr("height", this.progHeight);

        this.outList = this.container.querySelector(".output-list-content");
        this.progList = this.container.querySelector(".program-list-content");

        const defs = this.svg.append("defs");
        defs.append("marker").attr("id", "arrow").attr("viewBox", "0 0 10 10").attr("refX", 6).attr("refY", 5)
            .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
            .append("path").attr("d", "M 0 0 L 10 5 L 0 10 z").style("fill", "var(--color-axis)");

        this.container.querySelector(".prior-select").addEventListener("change", (e) => {
            this.currentPrior = e.target.value;
            this.updateSymbolUI();
            this.updateProgressData();
            this.updateUI();
        });

        this.guideLayer = this.svg.append("g");
        this.guideMx = this.guideLayer.append("line").attr("class", "guide-line-dash");
        this.guideMy = this.guideLayer.append("line").attr("class", "guide-line-dash");
        this.guideT = this.guideLayer.append("line").attr("class", "guide-line-dash").attr("y1", this.margin.top).attr("y2", this.height - this.margin.bottom);

        this.labelLayer = this.svg.append("g");

        this.pointT = this.svg.append("circle").attr("class", "point draggable-t").attr("r", 6);
        this.pointM = this.svg.append("circle").attr("class", "point draggable-m").attr("r", 6);

        if (window.MathJax?.startup) {
            window.MathJax.startup.promise.then(() => this.updateSymbolUI());
        } else {
            window.addEventListener('load', () => setTimeout(() => this.updateSymbolUI(), 100), { once: true });
        }
    }

    getX(r) { return this.xScale(Math.max(1, r)); }

    addMathLabel(group, name, x, y, align = "middle") {
        const latex = this.latexMap[name] || name;
        if (!this.labelCache[name]) {
            if(window.MathJax && MathJax.tex2svg) {
                const node = MathJax.tex2svg(latex);
                const svgNode = node.querySelector('svg');
                if(svgNode) this.labelCache[name] = svgNode.cloneNode(true);
            }
        }

        group.selectAll(`.${name}-label`).remove();

        if (this.labelCache[name]) {
            const clone = this.labelCache[name].cloneNode(true);
            clone.style.color = this.theme.textMain;

            const g = group.append("g").attr("class", `mjx-container ${name}-label`).node();
            g.appendChild(clone);

            const scale = 0.35;
            const bbox = g.getBBox();
            let dx = align === "middle" ? -bbox.width * scale / 2 : (align === "end" ? -bbox.width * scale : 0);
            let dy = bbox.height * scale / 2;
            d3.select(g).attr("transform", `translate(${x + dx}, ${y - dy}) scale(${scale})`);
        }
    }

    updateSymbolUI() {
        let symbol = this.currentPrior === 'algorithmic' ? 'M' :
                     this.currentPrior === 'speed' ? 'S' :
                     this.currentPrior === 'length' ? 'L' : 'U';

        const display = this.container.querySelector('.prior-symbol-display');
        const outTitle = this.container.querySelector('.output-title');
        const progTitle = this.container.querySelector('.program-title');

        if (window.MathJax && MathJax.tex2svg) {
            const fixSVG = (texString, yOffset = '0px') => {
                const node = MathJax.tex2svg(texString, {display: false});
                node.className = '';
                node.style.display = 'inline-block';

                const svg = node.querySelector('svg');
                if (svg) {
                    let w = svg.getAttribute('width');
                    let h = svg.getAttribute('height');
                    svg.setAttribute('style', '');

                    if (w && w.endsWith('ex')) svg.style.width = (parseFloat(w) * 0.5) + 'em';
                    if (h && h.endsWith('ex')) svg.style.height = (parseFloat(h) * 0.5) + 'em';

                    svg.style.position = 'relative';
                    svg.style.top = yOffset;
                    svg.style.margin = '0 2px';
                }
                return node;
            };

            if (display) {
                display.innerHTML = '';
                display.appendChild(fixSVG(`x \\sim ${symbol}`, '-1px'));
            }

            if (outTitle) {
                outTitle.innerHTML = 'Outputs ';
                outTitle.appendChild(fixSVG(`x`, '0px'));
            }

            if (progTitle) {
                progTitle.innerHTML = '';
                let span1 = document.createElement('span');
                span1.textContent = 'Programs computing ';
                span1.appendChild(fixSVG(`x`, '0px'));
                progTitle.appendChild(span1);

                let span2 = document.createElement('span');
                span2.className = 'runtime-label';
                span2.textContent = 'Runtime';
                progTitle.appendChild(span2);
            }
        } else {
            if (display) display.innerHTML = `x ~ ${symbol}`;
            if (outTitle) outTitle.innerHTML = `Outputs x`;
            if (progTitle) progTitle.innerHTML = `<span>Program computing x</span><span class="runtime-label">Runtime</span>`;
        }
    }

    loadData() {
        d3.json(this.dataUrl).then(data => {
            let allRuntimes = [];
            let allLengths = [];

            for (let rawKey in data) {
                let runtimes = data[rawKey].runtimes;
                let lengths = data[rawKey].lengths;
                let programs = data[rawKey].programs || [];
                let key = this.keyProcessor(rawKey);

                let logW_length = -lengths[0];
                let logW_algo = -d3.min(lengths);

                let min_speed = Infinity;
                for (let j = 0; j < runtimes.length; j++) {
                    let r = Math.max(1e-10, runtimes[j]);
                    let s = lengths[j] + Math.log2(r);
                    if (s < min_speed) min_speed = s;
                }

                this.curvesData.push({
                    runtimes, lengths, programs, key,
                    logWeights: { uniform: 0, length: logW_length, algorithmic: logW_algo, speed: -min_speed }
                });
                allRuntimes.push(...runtimes);
                allLengths.push(...lengths);
            }

            this.max_runtime = d3.max(allRuntimes) * 1.05;
            this.max_length = d3.max(allLengths);

            this.calculateStaticGapProfile();

            this.xScale = d3.scaleLog().domain([Math.max(1, d3.min(allRuntimes)), this.max_runtime]).range([this.margin.left, this.width - this.margin.right]);
            this.yScale = d3.scaleLinear().domain([d3.min(allLengths), this.max_length]).range([this.height - this.margin.bottom, this.margin.top]);
            this.xScaleProg = d3.scaleLinear().domain([0, this.maxGapPlot]).range([this.margin.left, this.width - this.margin.right]);
            this.yScaleProg = d3.scaleLinear().domain([0, 1]).range([this.progHeight - this.progMarginBottom, this.margin.top]);

            this.screenCurves = this.curvesData.map(curve => {
                let r = curve.runtimes, l = curve.lengths, vertices = [[this.getX(r[0]), this.yScale(l[0])]];
                for (let i = 1; i < r.length; i++) {
                    vertices.push([this.getX(r[i]), this.yScale(l[i-1])]);
                    vertices.push([this.getX(r[i]), this.yScale(l[i])]);
                }
                vertices.push([this.getX(this.max_runtime), this.yScale(l[l.length - 1])]);
                return vertices;
            });

            this.curvesData.forEach((curve, c_idx) => {
                for(let i = 0; i < curve.runtimes.length; i++) {
                    let r = curve.runtimes[i], l = curve.lengths[i];
                    let nextR = (i + 1 < curve.runtimes.length) ? curve.runtimes[i+1] : this.max_runtime;
                    let keyStr = `${r},${l}`;

                    if (!this.pointToCurves.has(keyStr)) {
                        this.pointToCurves.set(keyStr, []);
                        this.uniquePoints.push({ r, l, cx: this.getX(r), cy: this.yScale(l), key: keyStr });
                    }
                    this.pointToCurves.get(keyStr).push({ curveIndex: c_idx, nextRuntime: nextR });
                }
            });

            this.quadtree = d3.quadtree().x(d => d.cx).y(d => d.cy).addAll(this.uniquePoints);

            // --- Top Plot Axes ---
            let xAxis = this.svg.append("g").attr("transform", `translate(0,${this.height - this.margin.bottom})`).call(d3.axisBottom(this.xScale).ticks(10, "~s"));
            xAxis.select(".domain").style("opacity", 0);

            let yAxis = this.svg.append("g").attr("transform", `translate(${this.margin.left},0)`).call(d3.axisLeft(this.yScale));
            yAxis.select(".domain").style("opacity", 0);

            this.svg.append("line").attr("class", "axis-line").attr("marker-end", "url(#arrow)")
                .attr("x1", this.margin.left).attr("y1", this.height - this.margin.bottom)
                .attr("x2", this.width - this.margin.right + 20).attr("y2", this.height - this.margin.bottom)
                .style("stroke", this.theme.axis).style("stroke-width", "2px").style("fill", "none");

            this.svg.append("line").attr("class", "axis-line").attr("marker-end", "url(#arrow)")
                .attr("x1", this.margin.left).attr("y1", this.height - this.margin.bottom)
                .attr("x2", this.margin.left).attr("y2", this.margin.top - 20)
                .style("stroke", this.theme.axis).style("stroke-width", "2px").style("fill", "none");

            this.svg.append("text").attr("class", "axis-title").attr("x", this.width - this.margin.right + 25).attr("y", this.height - this.margin.bottom - 10).attr("text-anchor", "end").style("font-size", "12px").style("fill", this.theme.textMain).style("font-weight", "bold").text("Runtime");
            this.svg.append("text").attr("class", "axis-title").attr("x", this.margin.left).attr("y", this.margin.top - 30).attr("text-anchor", "middle").style("font-size", "12px").style("fill", this.theme.textMain).style("font-weight", "bold").text("Complexity");

            // --- Bottom Plot Axes ---
            let progXAxis = this.progSvg.append("g").attr("transform", `translate(0,${this.progHeight - this.progMarginBottom})`).call(d3.axisBottom(this.xScaleProg).ticks(10, "~s"));
            progXAxis.select(".domain").style("opacity", 0);

            this.progYAxisGroup = this.progSvg.append("g").attr("transform", `translate(${this.margin.left},0)`).call(d3.axisLeft(this.yScaleProg).ticks(5));
            this.progYAxisGroup.select(".domain").style("opacity", 0);

            this.progSvg.append("line").attr("class", "axis-line").attr("marker-end", "url(#arrow)")
                .attr("x1", this.margin.left).attr("y1", this.progHeight - this.progMarginBottom)
                .attr("x2", this.width - this.margin.right + 20).attr("y2", this.progHeight - this.progMarginBottom)
                .style("stroke", this.theme.axis).style("stroke-width", "2px").style("fill", "none");

            this.progSvg.append("line").attr("class", "axis-line").attr("marker-end", "url(#arrow)")
                .attr("x1", this.margin.left).attr("y1", this.progHeight - this.progMarginBottom)
                .attr("x2", this.margin.left).attr("y2", this.margin.top - 20)
                .style("stroke", this.theme.axis).style("stroke-width", "2px").style("fill", "none");

            this.addMathLabel(this.progSvg, 'delta_T_M', this.width - this.margin.right + 25, this.progHeight - this.progMarginBottom - 20, "end");
            this.progSvg.append("text").attr("class", "axis-title").attr("x", this.margin.left - 45).attr("y", this.margin.top - 30).attr("text-anchor", "start").style("font-size", "12px").style("fill", this.theme.textMain).style("font-weight", "bold").text("Future compression progress");

            // --- Legend ---
            let [h1, h2, h3] = this.horizons;
            let legendGroup = this.progSvg.append("g").attr("class", "legend");

            let legendX1 = this.width - this.margin.right - 240;
            let legendX2 = this.width - this.margin.right - 100;
            let baseTY = this.margin.top - 30;
            let lineLen = 16;
            let textOffset = 18;
            let rowH = 15;

            legendGroup.append("text").attr("x", legendX1).attr("y", baseTY).attr("fill", this.theme.textMain).style("font-size", "11px").style("font-weight", "bold").text("Global");
            legendGroup.append("text").attr("x", legendX2).attr("y", baseTY).attr("fill", this.theme.textMain).style("font-size", "11px").style("font-weight", "bold").text("Selected");

            let legendItems = [
                { label: "indefinite",        gColor: this.theme.horizonInf, gWidth: 2.5, sColor: this.theme.dynHorizonInf, sWidth: 2.5 },
                { label: `within ${h3} steps`, gColor: this.theme.horizons[2], gWidth: 1.5, sColor: this.theme.dynHorizons[2], sWidth: 1.5 },
                { label: `within ${h2} steps`, gColor: this.theme.horizons[1], gWidth: 1.5, sColor: this.theme.dynHorizons[1], sWidth: 1.5 },
                { label: `within ${h1} steps`, gColor: this.theme.horizons[0], gWidth: 1.5, sColor: this.theme.dynHorizons[0], sWidth: 1.5 }
            ];

            legendItems.forEach((item, i) => {
                let y = baseTY + 22 + (i * rowH);

                legendGroup.append("line")
                    .attr("x1", legendX1).attr("x2", legendX1 + lineLen)
                    .attr("y1", y - 4).attr("y2", y - 4)
                    .attr("stroke", item.gColor).attr("stroke-width", item.gWidth);
                legendGroup.append("text").attr("x", legendX1 + textOffset).attr("y", y).attr("fill", this.theme.textMain).style("font-size", "11px").text(item.label);

                legendGroup.append("line")
                    .attr("x1", legendX2).attr("x2", legendX2 + lineLen)
                    .attr("y1", y - 4).attr("y2", y - 4)
                    .attr("stroke", item.sColor).attr("stroke-width", item.sWidth);
                legendGroup.append("text").attr("x", legendX2 + textOffset).attr("y", y).attr("fill", this.theme.textMain).style("font-size", "11px").text(item.label);
            });

            this.currentM = this.uniquePoints[Math.floor(this.uniquePoints.length / 2)];
            this.currentTx = Math.min(this.currentM.cx + 50, this.width - this.margin.right);

            this.setupInteractions();
            this.updateProgressData();

            setTimeout(() => {
                this.updateSymbolUI();
                this.updateUI();
            }, 500);
        });
    }

    calculateStaticGapProfile() {
        let maxDropGap = 0;
        let segments = [];

        let maxLogW = { uniform: -Infinity, length: -Infinity, algorithmic: -Infinity, speed: -Infinity };
        this.curvesData.forEach(c => {
            maxLogW.uniform = Math.max(maxLogW.uniform, c.logWeights.uniform);
            maxLogW.length = Math.max(maxLogW.length, c.logWeights.length);
            maxLogW.algorithmic = Math.max(maxLogW.algorithmic, c.logWeights.algorithmic);
            maxLogW.speed = Math.max(maxLogW.speed, c.logWeights.speed);
        });

        this.curvesData.forEach(curve => {
            let r = curve.runtimes;
            let l = curve.lengths;
            let finalL = l[l.length - 1];

            for (let i = 0; i < r.length; i++) {
                let currentR = r[i];
                let currentL = l[i];
                let nextR = (i + 1 < r.length) ? r[i + 1] : this.max_runtime;
                let gapLen = nextR - currentR;

                if (gapLen > 0) {
                    let dropSize = currentL > finalL ? currentL - finalL : 0;
                    if (dropSize > 0 && gapLen > maxDropGap) maxDropGap = gapLen;

                    segments.push({
                        gapLen: gapLen,
                        dropSize: dropSize,
                        weights: {
                            uniform: Math.pow(2, curve.logWeights.uniform - maxLogW.uniform),
                            length: Math.pow(2, curve.logWeights.length - maxLogW.length),
                            algorithmic: Math.pow(2, curve.logWeights.algorithmic - maxLogW.algorithmic),
                            speed: Math.pow(2, curve.logWeights.speed - maxLogW.speed)
                        }
                    });
                }
            }
        });

        this.maxGapPlot = Math.min(Math.ceil(maxDropGap), this.max_runtime);
        if (this.maxGapPlot <= 0) this.maxGapPlot = 1;

        ['uniform', 'length', 'algorithmic', 'speed'].forEach(prior => {
            let expireTotal = new Float64Array(this.maxGapPlot + 2);
            let expireExpectedDrop = new Float64Array(this.maxGapPlot + 2);
            let initialTotal = 0;
            let initialDrop = 0;

            segments.forEach(seg => {
                let w = seg.weights[prior];
                initialTotal += w;
                initialDrop += w * seg.dropSize;

                let expIdx = Math.ceil(seg.gapLen);
                if (expIdx <= this.maxGapPlot) {
                    expireTotal[expIdx] += w;
                    expireExpectedDrop[expIdx] += w * seg.dropSize;
                }
            });

            let S_w = new Float64Array(this.maxGapPlot + 2);
            let S_drop = new Float64Array(this.maxGapPlot + 2);

            let currentTotal = initialTotal;
            let currentDrop = initialDrop;

            for (let t = 0; t <= this.maxGapPlot; t++) {
                currentTotal -= expireTotal[t];
                currentDrop -= expireExpectedDrop[t];
                S_w[t] = currentTotal;
                S_drop[t] = currentDrop;
            }

            let [H1, H2, H3] = this.horizons;

            let profiles = { inf: [], h1: [], h2: [], h3: [] };
            let step = Math.max(1, Math.floor(this.maxGapPlot / 800));

            for (let t = 0; t <= this.maxGapPlot; t++) {
                if (t % step === 0 || t === this.maxGapPlot) {
                    if (S_w[t] > 1e-12) {
                        profiles.inf.push([t, S_drop[t] / S_w[t]]);
                        let drop_h1 = S_drop[t] - (t + H1 <= this.maxGapPlot ? S_drop[t + H1] : 0);
                        profiles.h1.push([t, drop_h1 / S_w[t]]);
                        let drop_h2 = S_drop[t] - (t + H2 <= this.maxGapPlot ? S_drop[t + H2] : 0);
                        profiles.h2.push([t, drop_h2 / S_w[t]]);
                        let drop_h3 = S_drop[t] - (t + H3 <= this.maxGapPlot ? S_drop[t + H3] : 0);
                        profiles.h3.push([t, drop_h3 / S_w[t]]);
                    } else {
                        profiles.inf.push([t, null]);
                        profiles.h1.push([t, null]);
                        profiles.h2.push([t, null]);
                        profiles.h3.push([t, null]);
                    }
                }
            }
            this.gapProfiles[prior] = profiles;
        });
    }

    updateProgressData() {
        if (!this.uniquePoints || this.uniquePoints.length === 0) return;

        let step = Math.max(1, Math.floor(this.maxGapPlot / 800));

        let expireTotalF = new Float64Array(this.maxGapPlot + 2);
        let expireExpectedDropF = new Float64Array(this.maxGapPlot + 2);
        let initialTotalF = 0;
        let initialExpectedDropF = 0;
        let maxLogWF = -Infinity;
        let activeCurvesInfoF = [];

        this.uniquePoints.forEach(p => {
            let dx = p.cx - this.currentM.cx, dy = p.cy - this.currentM.cy;
            if (Math.sqrt(dx * dx + dy * dy) <= this.selectionRadius) {
                (this.pointToCurves.get(p.key) || []).forEach(info => {
                    let c = this.curvesData[info.curveIndex];
                    maxLogWF = Math.max(maxLogWF, c.logWeights[this.currentPrior]);
                    activeCurvesInfoF.push({
                        nextR: info.nextRuntime,
                        finalL: c.lengths[c.lengths.length - 1],
                        currentL: p.l,
                        currentR: p.r,
                        cIndex: info.curveIndex
                    });
                });
            }
        });

        activeCurvesInfoF.forEach(info => {
            let w = Math.pow(2, this.curvesData[info.cIndex].logWeights[this.currentPrior] - maxLogWF);
            let gapLen = info.nextR - info.currentR;
            let dropSize = info.currentL > info.finalL ? info.currentL - info.finalL : 0;

            initialTotalF += w;
            initialExpectedDropF += w * dropSize;

            let expIdx = Math.ceil(gapLen);
            if (expIdx <= this.maxGapPlot) {
                expireTotalF[expIdx] += w;
                expireExpectedDropF[expIdx] += w * dropSize;
            }
        });

        let S_w_F = new Float64Array(this.maxGapPlot + 2);
        let S_drop_F = new Float64Array(this.maxGapPlot + 2);

        let currentTotalF = initialTotalF;
        let currentDropF = initialExpectedDropF;

        for (let t = 0; t <= this.maxGapPlot; t++) {
            currentTotalF -= expireTotalF[t];
            currentDropF -= expireExpectedDropF[t];
            S_w_F[t] = currentTotalF;
            S_drop_F[t] = currentDropF;
        }

        let [H1, H2, H3] = this.horizons;
        let dynamicProfiles = { inf: [], h1: [], h2: [], h3: [] };

        for (let t = 0; t <= this.maxGapPlot; t++) {
            if (t % step === 0 || t === this.maxGapPlot) {
                if (S_w_F[t] > 1e-12) {
                    dynamicProfiles.inf.push([t, S_drop_F[t] / S_w_F[t]]);
                    let drop_h1 = S_drop_F[t] - (t + H1 <= this.maxGapPlot ? S_drop_F[t + H1] : 0);
                    dynamicProfiles.h1.push([t, drop_h1 / S_w_F[t]]);
                    let drop_h2 = S_drop_F[t] - (t + H2 <= this.maxGapPlot ? S_drop_F[t + H2] : 0);
                    dynamicProfiles.h2.push([t, drop_h2 / S_w_F[t]]);
                    let drop_h3 = S_drop_F[t] - (t + H3 <= this.maxGapPlot ? S_drop_F[t + H3] : 0);
                    dynamicProfiles.h3.push([t, drop_h3 / S_w_F[t]]);
                } else {
                    dynamicProfiles.inf.push([t, null]);
                    dynamicProfiles.h1.push([t, null]);
                    dynamicProfiles.h2.push([t, null]);
                    dynamicProfiles.h3.push([t, null]);
                }
            }
        }

        this.dynamicGapProfiles = dynamicProfiles;
    }

    setupInteractions() {
        d3.select(this.canvas).on("click", (event) => {
            let [x, y] = d3.pointer(event);
            let closestIndex = null, minDist = 15;

            this.activeHitIndices.forEach(idx => {
                let r = this.curvesData[idx].runtimes, l = this.curvesData[idx].lengths;
                let localMinDist = Math.hypot(this.getX(r[0]) - x, this.yScale(l[0]) - y);

                for(let i=1; i<r.length; i++) {
                    let x1 = this.getX(r[i-1]), x2 = this.getX(r[i]), y0 = this.yScale(l[i-1]);
                    if (x >= x1 && x <= x2) localMinDist = Math.min(localMinDist, Math.abs(y0 - y));
                    else localMinDist = Math.min(localMinDist, Math.hypot(x1-x, y0-y), Math.hypot(x2-x, y0-y));

                    let y1 = this.yScale(l[i-1]), y2 = this.yScale(l[i]), x0 = this.getX(r[i]);
                    let minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
                    if (y >= minY && y <= maxY) localMinDist = Math.min(localMinDist, Math.abs(x0 - x));
                    else localMinDist = Math.min(localMinDist, Math.hypot(x0-x, y1-y), Math.hypot(x0-x, y2-y));
                }

                let xLast = this.getX(r[r.length-1]), xEnd = this.getX(this.max_runtime), yLast = this.yScale(l[l.length-1]);
                if (x >= xLast && x <= xEnd) localMinDist = Math.min(localMinDist, Math.abs(yLast - y));
                else localMinDist = Math.min(localMinDist, Math.hypot(xLast-x, yLast-y), Math.hypot(xEnd-x, yLast-y));

                if (localMinDist < minDist) { minDist = localMinDist; closestIndex = idx; }
            });

            if (closestIndex !== null) this.selectCurve(closestIndex);
        });

        this.pointM.call(d3.drag().on("drag", (event) => {
            let closest = this.quadtree.find(event.x, event.y);
            if (closest) {
                this.currentM = closest;
                if (this.currentTx < this.currentM.cx) this.currentTx = this.currentM.cx;
                this.updateProgressData();
                this.updateUI();
            }
        }));

        this.pointT.call(d3.drag().on("drag", (event) => {
            this.currentTx = Math.max(this.currentM.cx, Math.min(this.width - this.margin.right, event.x));
            this.updateProgressData();
            this.updateUI();
        }));
    }

    getHighlightedCurves() {
        let hits = new Set();
        let T_data_x = this.xScale.invert(this.currentTx);
        this.uniquePoints.forEach(p => {
            let dx = p.cx - this.currentM.cx, dy = p.cy - this.currentM.cy;
            if (Math.sqrt(dx * dx + dy * dy) <= this.selectionRadius) {
                let curvesAtP = this.pointToCurves.get(p.key) || [];
                curvesAtP.forEach(info => { if (info.nextRuntime >= T_data_x) hits.add(info.curveIndex); });
            }
        });
        return hits;
    }

    getNormalizedWeightsMap(hitIndices) {
        let map = new Map();
        if (hitIndices.size === 0) return map;
        let maxLogW = -Infinity;
        for (let idx of hitIndices) maxLogW = Math.max(maxLogW, this.curvesData[idx].logWeights[this.currentPrior]);
        let sumW = 0;
        for (let idx of hitIndices) {
            let w = Math.pow(2, this.curvesData[idx].logWeights[this.currentPrior] - maxLogW);
            map.set(idx, w); sumW += w;
        }
        for (let [idx, w] of map.entries()) map.set(idx, w / sumW);
        return map;
    }

    draw(hitIndices) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        const drawPath = (vertices) => {
            this.ctx.moveTo(vertices[0][0], vertices[0][1]);
            for(let i = 1; i < vertices.length; i++) this.ctx.lineTo(vertices[i][0], vertices[i][1]);
        };

        this.ctx.beginPath();
        for (let c = 0; c < this.screenCurves.length; c++) {
            if (!hitIndices.has(c)) drawPath(this.screenCurves[c]);
        }
        this.ctx.strokeStyle = this.theme.curveInactive;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        let tDataX = this.xScale.invert(this.currentTx);
        let [h1, h2, h3] = this.horizons;

        this.ctx.save();
        this.ctx.setLineDash([4, 4]);
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = this.theme.grid;

        [h1, h2, h3].forEach(h => {
            let hX = this.getX(tDataX + h);
            if (hX <= this.width - this.margin.right) {
                this.ctx.beginPath();
                this.ctx.moveTo(hX, this.margin.top);
                this.ctx.lineTo(hX, this.height - this.margin.bottom);
                this.ctx.stroke();
            }
        });
        this.ctx.restore();

        if (hitIndices.size > 0) {
            let weightsMap = this.getNormalizedWeightsMap(hitIndices);
            let events = new Set();
            for (let idx of hitIndices) {
                let c = this.curvesData[idx];
                for (let r of c.runtimes) {
                    if (r >= tDataX) events.add(r);
                }
            }
            let sortedEvents = Array.from(events).sort((a, b) => a - b);

            let stepPoints = [];
            let currentY = this.currentM.l;

            stepPoints.push([this.currentM.r, currentY]);
            stepPoints.push([tDataX, currentY]);

            for (let x of sortedEvents) {
                let newY = 0;
                for (let idx of hitIndices) {
                    let w = weightsMap.get(idx);
                    let c = this.curvesData[idx];
                    let lAtX = c.lengths[0];
                    for (let i = 0; i < c.runtimes.length; i++) {
                        if (c.runtimes[i] <= x) lAtX = c.lengths[i];
                        else break;
                    }
                    newY += w * lAtX;
                }
                stepPoints.push([x, currentY]);
                stepPoints.push([x, newY]);
                currentY = newY;
            }
            stepPoints.push([this.max_runtime, currentY]);

            let critX = new Set();
            for (let idx of hitIndices) {
                for (let r of this.curvesData[idx].runtimes) {
                    if (r <= tDataX) critX.add(r);
                }
            }
            critX.add(tDataX);
            let sortedCritX = Array.from(critX).sort((a,b) => a-b);

            let getMinActiveLengthAtX = (x) => {
                let minL = Infinity;
                let active = false;
                for (let idx of hitIndices) {
                    let c = this.curvesData[idx];
                    if (c.runtimes[0] > x) continue;
                    active = true;
                    let lAtX = c.lengths[0];
                    for (let i=0; i<c.runtimes.length; i++) {
                        if (c.runtimes[i] <= x) lAtX = c.lengths[i];
                        else break;
                    }
                    if (lAtX < minL) minL = lAtX;
                }
                return active ? minL : null;
            };

            let leftShadePoints = [];
            let started = false;
            let prevY = null;
            for (let x of sortedCritX) {
                let minL = getMinActiveLengthAtX(x);
                if (minL !== null) {
                    let py = this.yScale(minL);
                    if (!started) {
                        leftShadePoints.push([x, this.margin.top]);
                        leftShadePoints.push([x, py]);
                        started = true;
                    } else {
                        leftShadePoints.push([x, prevY]);
                        leftShadePoints.push([x, py]);
                    }
                    prevY = py;
                }
            }

            if (started) {
                leftShadePoints.push([tDataX, prevY]);
                leftShadePoints.push([tDataX, this.margin.top]);

                this.ctx.beginPath();
                this.ctx.moveTo(this.getX(leftShadePoints[0][0]), leftShadePoints[0][1]);
                for(let i=1; i<leftShadePoints.length; i++) {
                    this.ctx.lineTo(this.getX(leftShadePoints[i][0]), leftShadePoints[i][1]);
                }
                this.ctx.closePath();
                this.ctx.fillStyle = this.theme.shadeLeft;
                this.ctx.fill();
            }

            this.ctx.beginPath();
            this.ctx.moveTo(this.getX(tDataX), this.margin.top);
            this.ctx.lineTo(this.getX(this.max_runtime), this.margin.top);

            let aggPointsRight = stepPoints.filter(pt => pt[0] >= tDataX);
            for (let i = aggPointsRight.length - 1; i >= 0; i--) {
                this.ctx.lineTo(this.getX(aggPointsRight[i][0]), this.yScale(aggPointsRight[i][1]));
            }
            this.ctx.closePath();
            this.ctx.fillStyle = this.theme.shadeRight;
            this.ctx.fill();

            this.ctx.beginPath();
            for (let index of hitIndices) {
                if (index !== this.selectedCurveIndex) {
                    this.ctx.moveTo(this.screenCurves[index][0][0], this.screenCurves[index][0][1]);
                    for(let i = 1; i < this.screenCurves[index].length; i++) {
                        this.ctx.lineTo(this.screenCurves[index][i][0], this.screenCurves[index][i][1]);
                    }
                }
            }
            this.ctx.strokeStyle = this.theme.curveActive;
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            let dynColors = this.theme.dynHorizons;
            let intersectionPoints = [];

            [h1, h2, h3].forEach((h, index) => {
                let hX_data = tDataX + h;
                let hX_px = this.getX(hX_data);

                if (hX_px <= this.width - this.margin.right) {
                    let yData = 0;
                    for (let idx of hitIndices) {
                        let w = weightsMap.get(idx);
                        let c = this.curvesData[idx];
                        let lAtX = c.lengths[0];
                        for (let i = 0; i < c.runtimes.length; i++) {
                            if (c.runtimes[i] <= hX_data) {
                                lAtX = c.lengths[i];
                            } else {
                                break;
                            }
                        }
                        yData += w * lAtX;
                    }
                    let yPx = this.yScale(yData);

                    this.ctx.beginPath();
                    this.ctx.moveTo(hX_px, yPx);
                    this.ctx.lineTo(this.getX(this.max_runtime), yPx);
                    this.ctx.strokeStyle = dynColors[index];
                    this.ctx.lineWidth = 4;
                    this.ctx.stroke();

                    intersectionPoints.push({ x: hX_px, y: yPx, color: dynColors[index] });
                }
            });

            let mX_px = this.currentM.cx;
            let mY_px = this.currentM.cy;
            this.ctx.beginPath();
            this.ctx.moveTo(mX_px, mY_px);
            for (let pt of stepPoints) {
                this.ctx.lineTo(this.getX(pt[0]), this.yScale(pt[1]));
            }
            this.ctx.strokeStyle = this.theme.guide;
            this.ctx.lineWidth = 4;
            this.ctx.stroke();

            let endX_px = this.getX(this.max_runtime);
            let endY_px = this.yScale(currentY);
            this.ctx.beginPath();
            this.ctx.arc(endX_px, endY_px, 5, 0, 2 * Math.PI);
            this.ctx.fillStyle = this.theme.dynHorizonInf;
            this.ctx.fill();
            this.ctx.strokeStyle = "white";
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();

            intersectionPoints.forEach(pt => {
                this.ctx.beginPath();
                this.ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
                this.ctx.fillStyle = pt.color;
                this.ctx.fill();
                this.ctx.strokeStyle = "white";
                this.ctx.lineWidth = 1.5;
                this.ctx.stroke();
            });
        }

        if (this.selectedCurveIndex !== null && hitIndices.has(this.selectedCurveIndex)) {
            this.ctx.beginPath();
            drawPath(this.screenCurves[this.selectedCurveIndex]);
            this.ctx.strokeStyle = this.theme.curveSelected;
            this.ctx.lineWidth = 4;
            this.ctx.stroke();

            if (this.selectedProgramIndex !== null) {
                let c = this.curvesData[this.selectedCurveIndex];
                if (c.programs && c.programs[this.selectedProgramIndex] !== undefined) {
                    this.ctx.beginPath();
                    this.ctx.arc(this.getX(c.runtimes[this.selectedProgramIndex]), this.yScale(c.lengths[this.selectedProgramIndex]), 6, 0, 2 * Math.PI);
                    this.ctx.fillStyle = this.theme.curveSelected;
                    this.ctx.fill();
                    this.ctx.strokeStyle = "white";
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                }
            }
        }
    }

    drawProgress() {
        let profiles = this.gapProfiles[this.currentPrior];
        let dynProfiles = this.dynamicGapProfiles;

        let maxStatic = profiles ? (d3.max(profiles.inf || [], d => d[1]) || 0) : 0;
        let maxDynamic = dynProfiles ? (d3.max(dynProfiles.inf || [], d => d[1]) || 0) : 0;
        let maxY = Math.max(maxStatic, maxDynamic);

        this.yScaleProg.domain([0, maxY * 1.05 || 1]);
        if (this.progYAxisGroup) {
            this.progYAxisGroup.call(d3.axisLeft(this.yScaleProg).ticks(5));
        }

        this.progCtx.clearRect(0, 0, this.width, this.progHeight);

        const plotProfile = (profile, color, lineWidth = 2.5, isStep = false) => {
            if (!profile || profile.length === 0) return;

            this.progCtx.strokeStyle = color;
            this.progCtx.lineWidth = lineWidth;
            this.progCtx.beginPath();

            let isDrawing = false;
            let prevY = null;

            for (let i = 0; i < profile.length; i++) {
                if (profile[i][1] === null) {
                    if (isDrawing) this.progCtx.stroke();
                    isDrawing = false;
                    this.progCtx.beginPath();
                    prevY = null;
                } else {
                    let px = this.xScaleProg(profile[i][0]);
                    let py = this.yScaleProg(profile[i][1]);
                    if (!isDrawing) {
                        this.progCtx.moveTo(px, py);
                        isDrawing = true;
                    } else {
                        if (isStep && prevY !== null) {
                            this.progCtx.lineTo(px, prevY);
                        }
                        this.progCtx.lineTo(px, py);
                    }
                    prevY = py;
                }
            }
            if (isDrawing) {
                this.progCtx.stroke();
            }
        };

        if (profiles) {
            plotProfile(profiles.h1, this.theme.horizons[0], 1.5, false);
            plotProfile(profiles.h2, this.theme.horizons[1], 1.5, false);
            plotProfile(profiles.h3, this.theme.horizons[2], 1.5, false);
            plotProfile(profiles.inf, this.theme.horizonInf, 2.5, false);
        }

        if (dynProfiles) {
            plotProfile(dynProfiles.h1, this.theme.dynHorizons[0], 1.5, true);
            plotProfile(dynProfiles.h2, this.theme.dynHorizons[1], 1.5, true);
            plotProfile(dynProfiles.h3, this.theme.dynHorizons[2], 1.5, true);
            plotProfile(dynProfiles.inf, this.theme.dynHorizonInf, 2.5, true);
        }

        if (this.progYAxisGroup) {
            this.progYAxisGroup.call(d3.axisLeft(this.yScaleProg).ticks(5));
            this.progYAxisGroup.select(".domain").style("opacity", 0);
        }

        let tDataX = this.xScale.invert(this.currentTx);
        let deltaT = Math.max(0, tDataX - this.currentM.r);

        if (deltaT <= this.maxGapPlot) {
            let px = this.xScaleProg(deltaT);
            this.progCtx.beginPath();
            this.progCtx.moveTo(px, this.margin.top);
            this.progCtx.lineTo(px, this.progHeight - this.progMarginBottom);
            this.progCtx.strokeStyle = this.theme.textMuted;
            this.progCtx.lineWidth = 1.5;
            this.progCtx.setLineDash([4, 4]);
            this.progCtx.stroke();
            this.progCtx.setLineDash([]);
        }
    }

    selectCurve(index) {
        if (this.selectedCurveIndex === index) return;
        this.selectedCurveIndex = index;
        this.selectedProgramIndex = null;
        this.updateLists();
        this.draw(this.activeHitIndices);
    }

    updateLists() {
        this.outList.innerHTML = "";
        Array.from(this.activeHitIndices).forEach(idx => {
            let div = document.createElement("div");
            div.className = "list-item" + (idx === this.selectedCurveIndex ? " active" : "");
            let keyStr = String(this.curvesData[idx].key);
            div.textContent = keyStr.length > 64 ? keyStr.substring(0, 64) + "..." : keyStr;
            div.onclick = () => this.selectCurve(idx);
            this.outList.appendChild(div);
        });

        this.progList.innerHTML = "";
        if (this.selectedCurveIndex !== null && this.activeHitIndices.has(this.selectedCurveIndex)) {
            let curve = this.curvesData[this.selectedCurveIndex];
            (curve.programs || []).forEach((p, i) => {
                let div = document.createElement("div");
                div.className = "list-item program-item" + (i === this.selectedProgramIndex ? " active" : "");
                let pStr = Array.isArray(p) ? p.join('') : p;

                let strSpan = document.createElement("span");
                strSpan.className = "prog-str";
                strSpan.textContent = pStr || 'N/A';
                strSpan.title = pStr || 'N/A';

                let rtSpan = document.createElement("span");
                rtSpan.className = "prog-rt";
                rtSpan.textContent = curve.runtimes[i];

                div.appendChild(strSpan);
                div.appendChild(rtSpan);

                div.onclick = () => {
                    this.selectedProgramIndex = i;
                    this.updateLists();
                    this.draw(this.activeHitIndices);
                    if (pStr) this.onProgramSelect(pStr);
                };
                this.progList.appendChild(div);
            });
        }
    }

    updateUI() {
        this.pointM.attr("cx", this.currentM.cx).attr("cy", this.currentM.cy);
        this.pointT.attr("cx", this.currentTx).attr("cy", this.height - this.margin.bottom);

        this.guideMx.attr("x1", this.currentM.cx).attr("y1", this.currentM.cy).attr("x2", this.currentM.cx).attr("y2", this.height - this.margin.bottom);
        this.guideMy.attr("x1", this.margin.left).attr("y1", this.currentM.cy).attr("x2", this.width - this.margin.right).attr("y2", this.currentM.cy);
        this.guideT.attr("x1", this.currentTx).attr("x2", this.currentTx);

        this.addMathLabel(this.labelLayer, 'M_x', this.currentM.cx, this.height - this.margin.bottom + 26);
        this.addMathLabel(this.labelLayer, 'M_y', this.margin.left - 30, this.currentM.cy - 4, "end");
        this.addMathLabel(this.labelLayer, 'T_x', this.currentTx, this.height - this.margin.bottom + 30);

        this.pointM.raise();
        this.pointT.raise();

        this.activeHitIndices = this.getHighlightedCurves();

        let setsAreEqual = (a, b) => a.size === b.size && Array.from(a).every(val => b.has(val));
        if (!setsAreEqual(this.activeHitIndices, this.prevHitIndices)) {
            if (this.selectedCurveIndex !== null && !this.activeHitIndices.has(this.selectedCurveIndex)) {
                this.selectedCurveIndex = null; this.selectedProgramIndex = null;
            }
            this.updateLists();
            this.prevHitIndices = this.activeHitIndices;
        }

        this.draw(this.activeHitIndices);
        this.drawProgress();
    }
}