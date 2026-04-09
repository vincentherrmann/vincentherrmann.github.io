---
type: pages
layout: archive
author_profile: false
header:
  teaser: teaser/interestingness_position_paper_teaser.png
date: 2026-02-02
title: Position—Interestingness is an Inductive Heuristic for Future Compression Progress
excerpt: Interestingness is an essential ingredient for open-ended learning and artificial general intelligence. It can be described as a heuristic assessing the potential of future compression progress.
---

Under review.

[*Paper*](../../assets/pdfs/Position_Paper_about_Interestingness_preprint.pdf)

<div class="content-small" markdown="1">

# Theoretical Profiles, Probabilities, and Expectations
Propositions 4.1, 4.2, and 4.3 in the paper describe how observed past compression progress affects expected future compression progress. We have created interactive visualizations to make these theoretical results more intuitive.

Suppose we have an observed partial log-size vs. complexity profile $\hat{P}$, up to a complexity limit $t$. Beyond $t$, the profile could continue in several ways: it might plateau with no further drops, it could drop immediately, or it might experience multiple future drops at much higher complexities. We want to know how the shape of our observation $\hat{P}$ influences our expectation of this continuation.

### Interactive Elements & Layout 
- **Log-Size vs. Complexity (Top Left):** The observed partial profile $\hat{P}$ is characterized by three adjustable values: the minimum size at complexity 0 ($\hat{n}$), the complexity of the last observed drop ($\hat{m}$), and the current estimated complexity ($\hat{k}$). You can drag the red handles to freely adjust these values alongside the observation boundary $t$. The exact shape between 0 and $\hat{m}$ is irrelevant for our purposes; we only care about how $\hat{P}$'s macro-shape influences the expected continuation.</li>
- **Complexity vs. Runtime (Bottom Left):** Using the abstract time-scale transformation $(i, j) \mapsto (\text{BB}(i), i + j)$, the upper $\hat{P}$ and $P_x$ profiles map directly to equivalent complexity vs. runtime profiles ($\hat{D}$ and $D_x$).</li>
- **The Prior (Top Right):** We assume a distribution over all computable strings, selectable via a dropdown: the Length Prior $L$, Algorithmic Prior $M$, or Speed Prior $S$. $P_x$ is the full profile of a specific string $x$ sampled from this prior. Given our observation $\hat{P}$, what is the expected complexity of its last plot ($m_x$) and its minimum complexity at log-size 0 ($k_x$)?</li>
- **Probability of a Future Drop (<span class="orange-label">Top Right</span>):** The first key question is whether another drop occurs after $t$ (the condition $m_x \geq t$). This probability $\color{#e67e22} p(m_x \geq t \mid \hat{P})$ is plotted as a function of $t - \hat{m}$. For priors $L$ and $M$, this probability decays exponentially. The chart also visualizes the probability of <em>any</em> drop within a given distance $\Delta c$ after $t$.</li>
- **Expected Relative Position (<span class="green-label">Middle Right</span>):** Without conditioning on a future drop, this chart shows how many steps after $\hat{m}$ the expected last drop occurs ($\color{#228b22} \mathbb{E}[m_x \mid \hat{P}] - \hat{m}$). The expected last drop is to the right of $t$ only if this value exceeds the $t - \hat{m}$ boundary (the gray dashed line).</li>
- **Expected Future Compression Progress (<span class="blue-label">Bottom Right</span>):** This chart displays the expected total future compression progress, calculated as $\color{#4682b4} \hat{k} - \mathbb{E}[k_x \mid \hat{P}]$. It additionally shows the expected compression progress specifically within $\Delta c$ steps after $t$.</li>

### Conditioned Expectations (The Shaded Regions)
If we assume there <em>will</em> be a further drop after $t$ (i.e., conditioning on $m_x \geq t$), the left-hand plots visualize the expected continuation:
- The **<span class="green-label">shaded green area</span>** shows the probability distribution $p(m_x \mid \hat{P}, m_x \geq t)$ for specific drop values $m_x$. The dashed green line labeled $m_x$ marks the expected value $\mathbb{E}[m_x \mid \hat{P}, m_x \geq t]$.</li>
- The **<span class="blue-label">shaded blue area</span>** shows the distribution $p(k_x \mid \hat{P}, m_x \geq t)$ and the expected ultimate complexity $\mathbb{E}[k_x \mid \hat{P}, m_x \geq t]$ (dashed line labeled $k_x$).</li>

### How the Priors Affect Expectations
- **Length Prior ($L$):** Both $p_L(m_x \mid \hat{P}, m_x \geq t)$ and $p_L(k_x \mid \hat{P}, m_x \geq t)$ decay quickly as the distance from $t$ and $\hat{k}$ increases. The overall probability of a future drop $p_L(m_x \geq t \mid \hat{P})$ immediately decays exponentially as a function of $t - \hat{m}$.</li>
- **Algorithmic Prior ($M$):** The drop position distribution $p_M(m_x \mid \hat{P}, m_x \geq t)$ behaves similarly to the Length Prior. However, the ultimate complexity distribution $p_M(k_x \mid \hat{P}, m_x \geq t)$ is much more uniform across the interval $[t, \hat{k}]$, leading to a larger expected drop. The future drop probability still decays exponentially, but slower than under $L$.</li>
- **Speed Prior ($S$):** Because it heavily penalizes runtime, conditioning on $m_x \geq t$ leads to an immediate expected drop in the limit of the large runtimes considered here. However, the unconditioned probability $p_S(m_x \geq t \mid \hat{P})$ is essentially zero.</li>

**Interact with the visualization:** Drag the red handles to adjust the shape of the observed profiles ($\hat{P}$ or $\hat{D}$), select a prior from the dropdown, and observe how these variables alter the expected continuation.

<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<script defer src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
<script defer src="https://documentcloud.adobe.com/view-sdk/main.js"></script>

<script defer src="{{site.basurl}}/scripts/diagrams.js"></script>
<script defer src="{{site.basurl}}/scripts/visualizer.js"></script>
<script defer src="{{site.basurl}}/scripts/simulators.js"></script>
<script defer src="{{site.basurl}}/scripts/empirical_main.js"></script>

<script src="https://d3js.org/d3.v7.min.js"></script>
<script>
    window.MathJax = {
        tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
        svg: { fontCache: 'global' }
    };
</script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>

<div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px; width: 100%; overflow-x: auto;">
  <div class="viz-container">
    <div class="viz-col" id="col-left"></div>
    <div class="viz-col" id="col-right">
      <div class="controls">
        <label for="priorSelect">Prior:</label>
        <select id="priorSelect">
          <option value="length">Length</option>
          <option value="algorithmic">Algorithmic</option>
          <option value="speed">Speed</option>
        </select>
        <span id="priorSymbolDisplay"></span>
      </div>
    </div>
  </div>
</div>

# Empirical Results
Our theoretical results hold for the busy beaver regime, which involves runtimes that are not physically realizable.
While they provide insight into the fundamental algorithmic properties of objects and their time-bounded compressibility, it is not immediately obvious how relevant these results are to real-world scenarios.
To address this, we conduct empirical experiments that mirror our theoretical results.
We choose three fundamentally different, yet still universal and practical, computational paradigms that represent a wide variety of possible universal computers:
<a href="https://en.wikipedia.org/wiki/Tag_system">2-Tag Systems</a>, elementary cellular automata with <a href="https://en.wikipedia.org/wiki/Rule_110">Rule 110</a>, and the <a href="https://en.wikipedia.org/wiki/Brainfuck">Brainfuck</a> (BF) language.

In each of these systems, we run all programs up to a certain length with generous runtime limits.
This allows us to construct real-world complexity vs. runtime profiles for all objects (i.e., output strings $x$) computed by multiple different programs.
From these profiles, we can compute the relationship between steps since the last observed progress and the empirically achieved further compression progress.
Using importance sampling, we can estimate the expected future compression progress under the different priors.
These are the empirical equivalents of the theoretical expectations shown above.

We observe that in all three computational paradigms, the fundamental trends clearly hold:
Recent compression progress implies further compression progress in the future, especially under the assumption of the Algorithmic Prior $M$.
The most significant difference from the theoretical results is with respect to the Speed Prior:
in the heavily constrained empirical setting, the logarithmic bias against long runtimes is less pronounced.
This is especially the case for Rule 110 cellular automata, for which—due to their construction—no programs with very short runtimes exist.
The exact experimental setups for the three systems are detailed below.

## Tag Machines

In this system, we run 2-tag systems with the alphabet $\{a, b, c, H\}$, where $H$ is the halting symbol.
These kinds of systems have been shown to be Turing complete.
We enumerate all possible production rules up to a combined length of 13, with $H$ appearing only at the end of a single rule.
The starting word is always '$aaa$'.
This leads to approximately 120 million programs which we run for up to 100k steps.
If no output is produced within this limit, we consider the program non-halting.


<div id="tag-vis" class="vis-module">
    <div class="emp-container">
        <div class="emp-charts">
            <div class="chart-wrapper chart-container"><canvas class="plot-canvas"></canvas><svg class="plot-svg"></svg></div>
            <div class="chart-wrapper progress-container"><canvas class="prog-canvas"></canvas><svg class="prog-svg"></svg></div>
        </div>
        <div class="emp-sidebar">
            <div class="emp-controls">
                <label>Prior:</label>
                <select class="prior-select">
                    <option value="uniform">Uniform</option>
                    <option value="length">Length</option>
                    <option value="algorithmic">Algorithmic</option>
                    <option value="speed">Speed</option>
                </select>
                <span class="prior-symbol-display"></span>
            </div>
            <div class="list-title output-title"></div>
            <div class="list-box output-list-content"></div>
            <div class="list-title list-title-flex program-title"></div>
            <div class="list-box program-list-content"></div>
        </div>
    </div>

    <div class="machine-section">
        <h4 class="title is-6">2-Tag Machine Execution (Initial: aaa)</h4>
        <div class="machine-controls">
            <label>a: <input type="text" id="rule-a" placeholder="e.g. ab"></label>
            <label>b: <input type="text" id="rule-b" placeholder="e.g. bcH"></label>
            <label>c: <input type="text" id="rule-c" placeholder="e.g. ac"></label>
            <button class="button is-small is-dark" id="btn-run-tag">Run</button>
        </div>
        <pre id="tag-output" class="console-output"></pre>
    </div>
</div>

---

## Rule 110 Cellular Automata

Rule 110 is a Turing-complete elementary cellular automaton.
We use a state of size 512 with a cyclic boundary condition (we do this purely for practical reasons and are aware that this technically reduces the automaton to a finite state machine).
The programs are defined as the leftmost bits of the tape, up to the last value of 1.
We enumerate all programs up to length 25, resulting in approximately 34 million simulations.
A program halts as soon as any particular state appears for a second time; this state is then the output of the program.
If no state repeats within 100k steps, we consider the program non-halting.

<div id="rule110-vis" class="vis-module">
    <div class="emp-container">
        <div class="emp-charts">
            <div class="chart-wrapper chart-container"><canvas class="plot-canvas"></canvas><svg class="plot-svg"></svg></div>
            <div class="chart-wrapper progress-container"><canvas class="prog-canvas"></canvas><svg class="prog-svg"></svg></div>
        </div>
        <div class="emp-sidebar">
            <div class="emp-controls">
                <label>Prior:</label>
                <select class="prior-select">
                    <option value="uniform">Uniform</option>
                    <option value="length">Length</option>
                    <option value="algorithmic">Algorithmic</option>
                    <option value="speed">Speed</option>
                </select>
                <span class="prior-symbol-display"></span>
            </div>
            <div class="list-title output-title"></div>
            <div class="list-box output-list-content"></div>
            <div class="list-title list-title-flex program-title"></div>
            <div class="list-box program-list-content"></div>
        </div>
    </div>

    <div class="machine-section">
        <h4 class="title is-6">Rule 110 Cellular Automaton (Tape: 512 bits)</h4>
        <div class="machine-controls">
            <label>Tape: <input type="text" id="ca-program" placeholder="e.g. 100101"></label>
            <button class="button is-small is-dark" id="btn-run-ca">Run (Max 20k steps)</button>
            <span id="ca-status"></span>
        </div>
        <div id="ca-viewport">
            <canvas id="ca-canvas"></canvas>
        </div>
        <pre id="ca-final-output"></pre>
    </div>
</div>

--- 

## Brainfuck

<a href="https://en.wikipedia.org/wiki/Brainfuck">BF</a> is a highly compact Turing-complete programming language.
Since we are not providing any external inputs, we do not use the <i>read</i> instruction '<code>,</code>'.
We enumerate all programs up to length 11 consisting of the remaining 7 instructions, leading to approximately 2.3 billion different programs, which we run for up to 100k steps.

---

<div id="bf-vis" class="vis-module">

    <div class="emp-container">
        <div class="emp-charts">
            <div class="chart-wrapper chart-container"><canvas class="plot-canvas"></canvas><svg class="plot-svg"></svg></div>
            <div class="chart-wrapper progress-container"><canvas class="prog-canvas"></canvas><svg class="prog-svg"></svg></div>
        </div>
        <div class="emp-sidebar">
            <div class="emp-controls">
                <label>Prior:</label>
                <select class="prior-select">
                    <option value="uniform">Uniform</option>
                    <option value="length">Length</option>
                    <option value="algorithmic">Algorithmic</option>
                    <option value="speed">Speed</option>
                </select>
                <span class="prior-symbol-display"></span>
            </div>
            <div class="list-title output-title"></div>
            <div class="list-box output-list-content"></div>
            <div class="list-title list-title-flex program-title"></div>
            <div class="list-box program-list-content"></div>
        </div>
    </div>

    <div class="machine-section">
        <h4 class="title is-6">Brainfuck Execution</h4>
        <div class="machine-controls">
            <input type="text" id="bf-code" placeholder="e.g. +[+.+.+.]" class="bf-input">
            <button class="button is-small is-dark" id="btn-run-bf">Run</button>
        </div>
        <div class="console-output bf-display">
            <div><span class="bf-label">Code:</span> <span id="bf-code-display" class="bf-content"></span></div>
            <div><span class="bf-label">Tape:</span> <span id="bf-tape-display" class="bf-content"></span></div>
            <div><span class="bf-label">Output:</span> <span id="bf-output-display" class="bf-content bf-output-display"></span></div>
        </div>
    </div>
</div>

</div>