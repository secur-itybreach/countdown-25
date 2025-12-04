import { createEngine } from "../_shared/engine.js";
import { FourierDrawing } from "./fourierCalc.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;

// Usage
const svgPoints =
  "547.14 196.31 547.14 276.39 684.84 207.54 684.84 742.7 538.84 742.7 538.84 812.53 901.16 812.53 901.16 742.7 764.3 742.52 763.8 119.47 698.4 119.47 547.14 196.31";

let numVectors = 1;
const drawer = new FourierDrawing(canvas, ctx, numVectors, finish);
drawer.init(svgPoints);

// Track clicks to increase number of vectors
canvas.addEventListener("click", () => {
  numVectors++;
  drawer.numVectors = numVectors;
  drawer.hasFinished = false; // Reset finish flag when adding vectors
  // Don't reset time or path - just recalculate vectors
  drawer.init(svgPoints); // Reinitialize with new vector count
});

// Use the engine's animation loop
run(() => {
  drawer.draw();
});
