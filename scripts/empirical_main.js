document.addEventListener("DOMContentLoaded", () => {

    // 1. Tag Machine Init
    new StairCurveVisualizer("#tag-vis", "/../../assets/data/tag_curves.json", {
        horizons: [2, 5, 10],
        onProgramSelect: (pStr) => {
            let parts = pStr.trim().split(/\s+/);
            if (parts.length >= 3) {
                document.getElementById("rule-a").value = parts[0];
                document.getElementById("rule-b").value = parts[1];
                document.getElementById("rule-c").value = parts[2];
                runTagMachine();
            }
        }
    });

    // 2. Rule 110 Init
    new StairCurveVisualizer("#rule110-vis", "/../../assets/data/rule110_curves.json", {
        keyProcessor: hexToBin512, // Provided via simulators.js
        horizons: [500, 1000, 2000],
        onProgramSelect: (pStr) => {
            document.getElementById("ca-program").value = pStr;
            runCA();
        }
    });

    // 3. Brainfuck Init
    new StairCurveVisualizer("#bf-vis", "/../../assets/data/bf_curves.json", {
        horizons: [50, 100, 200],
        onProgramSelect: (pStr) => {
            document.getElementById("bf-code").value = pStr.trim();
            runBfMachine();
        }
    });

});