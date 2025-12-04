import { createEngine } from "../_shared/engine.js";
import { Spring } from "../_shared/spring.js";

const { renderer, input, math, run, finish } = createEngine();
const { ctx, canvas } = renderer;

let width = canvas.width;
let height = canvas.height;

// Mouse tracking
let mouseX = 0;
let mouseY = 0;
let numSets = 6; // Start with 6 sets

// Store all point sets
let pointSets = [];

// Function to generate point sets based on number of sets
function generatePointSets(numSets) {
  pointSets = [];
  const spacing = width / (numSets - 1);

  for (let i = 0; i < numSets + 1; i++) {
    const a = {
      x: spacing * (i - 1),
      y: height / 3,
    };

    const b = {
      x: spacing * i,
      y: 0,
    };

    const c = {
      x: spacing * i,
      y: height,
    };

    // Store this set of points
    pointSets.push({ a, b, c, index: i });
  }
}

// Generate initial point sets
generatePointSets(numSets);

// Track mouse position
canvas.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (mouseX < 50 && mouseY > height - 50) {
    finish();
  }
  // Map mouse X position (0 to width) to number of sets (6 to 14)
  numSets = Math.round(6 + (mouseX / width) * (14 - 6));

  // Map mouse Y position (0 to height) to amplitude (250 to 1)
  // Y=0 (top) -> amplitude=250, Y=height (bottom) -> amplitude=1
  waveParams.amplitude = 250 - (mouseY / height) * (250 - 1);

  // Regenerate points with new spacing
  generatePointSets(numSets);
});

// Log the points to console
console.log("Generated point sets:", pointSets);

// Animation variables
let time = 0;

// Wave parameters - adjust these to customize the animation
const waveParams = {
  segments: 300, // Number of segments in each wave line (higher = smoother)
  amplitude: 200, // How far the wave curves from the line
  frequencyAB: 4, // Wave frequency for A-B lines
  frequencyBC: 9, // Wave frequency for B-C lines
  timeSpeed: 0.2, // Animation speed
};

// Function to draw a wavy line between two points
function drawWavyLine(
  startX,
  startY,
  endX,
  endY,
  color,
  phaseOffset,
  frequency
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 50;
  ctx.beginPath();

  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Start at the first point
  ctx.moveTo(startX, startY);

  // Draw wavy line with multiple segments
  for (let i = 1; i <= waveParams.segments; i++) {
    const t = i / waveParams.segments;

    // Linear interpolation between start and end
    const x = startX + dx * t;
    const y = startY + dy * t;

    // Calculate perpendicular offset for wave effect
    const perpX = -dy / length;
    const perpY = dx / length;

    // Calculate wave offset
    const waveOffset =
      Math.sin(t * frequency * Math.PI * 2 + time + phaseOffset) *
      waveParams.amplitude;

    // Apply wave offset perpendicular to the line
    const waveX = x + perpX * waveOffset;
    const waveY = y + perpY * waveOffset;

    ctx.lineTo(waveX, waveY);
  }

  ctx.stroke();
}

// Animation loop
function animate() {
  // Clear canvas
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, width, height);

  // Draw wavy lines for each point set
  pointSets.forEach((set, idx) => {
    const color = "white";

    // Draw wavy line from A to B
    drawWavyLine(
      set.a.x,
      set.a.y,
      set.b.x,
      set.b.y,
      color,
      idx * 0.5,
      waveParams.frequencyAB
    );

    // Draw wavy line from B to C
    drawWavyLine(
      set.b.x,
      set.b.y,
      set.c.x,
      set.c.y,
      color,
      idx * 0.5 + Math.PI,
      waveParams.frequencyBC
    );

    // Draw points
    ctx.fillStyle = color;

    // Draw point A
    ctx.beginPath();
    ctx.arc(set.a.x, set.a.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw point B
    ctx.beginPath();
    ctx.arc(set.b.x, set.b.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw point C
    ctx.beginPath();
    ctx.arc(set.c.x, set.c.y, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // Update time for animation
  time += waveParams.timeSpeed;

  requestAnimationFrame(animate);
}

// Start animation
animate();

// Handle window resize
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  width = canvas.width;
  height = canvas.height;
  // Regenerate points with current number of sets
  generatePointSets(numSets);
});
