export class FourierDrawing {
  constructor(canvas, ctx, numVectors = 100, finishCallback = null) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.numVectors = numVectors;
    this.time = 0;
    this.path = [];
    this.vectors = [];
    this.finishCallback = finishCallback;
    this.hasFinished = false;
    this.minVectorsForCompletion = 30; // Minimum vectors needed to consider shape "formed"

    // Set canvas size
    this.canvas.width = 1440;
    this.canvas.height = 932;
  }

  // Extract points from SVG polygon
  extractPointsFromSVG(svgPoints) {
    // Parse the points string from SVG polygon
    // Format: "x1 y1 x2 y2 x3 y3 ..."
    const coords = svgPoints.trim().split(/\s+/).map(Number);
    const points = [];

    for (let i = 0; i < coords.length; i += 2) {
      points.push({
        x: coords[i],
        y: coords[i + 1],
      });
    }

    // Close the path by adding first point at end
    points.push(points[0]);

    return points;
  }

  // Interpolate between points to get smooth sampling
  interpolatePoints(points, numSamples = 1000) {
    const samples = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const segmentSamples = Math.floor(numSamples / (points.length - 1));

      for (let j = 0; j < segmentSamples; j++) {
        const t = j / segmentSamples;
        samples.push({
          x: p1.x + (p2.x - p1.x) * t,
          y: p1.y + (p2.y - p1.y) * t,
          time: (i * segmentSamples + j) / numSamples,
        });
      }
    }

    return samples;
  }

  // Calculate Fourier coefficients using Discrete Fourier Transform
  calculateFourierCoefficients(points) {
    const N = points.length;
    const coefficients = [];

    // Generate vector indices: 0, 1, -1, 2, -2, 3, -3, ...
    const indices = [0];
    for (let i = 1; i <= Math.floor(this.numVectors / 2); i++) {
      indices.push(i, -i);
    }

    for (let n of indices.slice(0, this.numVectors)) {
      let re = 0;
      let im = 0;

      for (let k = 0; k < N; k++) {
        const phi = (2 * Math.PI * n * k) / N;
        const x = points[k].x;
        const y = points[k].y;

        // Treat point as complex number: x + iy
        re += x * Math.cos(phi) + y * Math.sin(phi);
        im += y * Math.cos(phi) - x * Math.sin(phi);
      }

      re /= N;
      im /= N;

      const amplitude = Math.sqrt(re * re + im * im);
      const phase = Math.atan2(im, re);
      const frequency = n;

      coefficients.push({
        re,
        im,
        freq: frequency,
        amp: amplitude,
        phase,
      });
    }

    // Sort by amplitude (largest first) for better visualization
    coefficients.sort((a, b) => b.amp - a.amp);

    return coefficients;
  }

  // Calculate position at current time
  epicycles(x, y, rotation, vectors) {
    const positions = [];

    for (let i = 0; i < vectors.length; i++) {
      const v = vectors[i];
      const prevX = x;
      const prevY = y;

      const freq = v.freq;
      const radius = v.amp;
      const phase = v.phase;
      const angle = freq * rotation + phase;

      x += radius * Math.cos(angle);
      y += radius * Math.sin(angle);

      positions.push({
        x: prevX,
        y: prevY,
        radius,
        angle,
      });
    }

    return { x, y, positions };
  }

  // Draw the Fourier circles
  draw() {
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const dt = ((2 * Math.PI) / 1000) * 6; // Speed multiplier (3x faster)

    // Calculate epicycles starting from the center of the canvas
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const result = this.epicycles(centerX, centerY, this.time, this.vectors);

    // Draw circles only if we have more than 1 vector
    if (this.vectors.length > 1) {
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      this.ctx.lineWidth = 1;

      result.positions.forEach((pos) => {
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, pos.radius, 0, 2 * Math.PI);
        this.ctx.stroke();

        // Draw radius line
        this.ctx.beginPath();
        this.ctx.moveTo(pos.x, pos.y);
        this.ctx.lineTo(
          pos.x + pos.radius * Math.cos(pos.angle),
          pos.y + pos.radius * Math.sin(pos.angle)
        );
        this.ctx.stroke();
      });
    }

    // Add current point to path
    this.path.unshift({ x: result.x, y: result.y });

    // Draw the traced path
    this.ctx.beginPath();
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 2;

    // Only draw if we have enough points
    if (this.path.length > 2) {
      for (let i = 0; i < this.path.length; i++) {
        if (i === 0) {
          this.ctx.moveTo(this.path[i].x, this.path[i].y);
        } else {
          this.ctx.lineTo(this.path[i].x, this.path[i].y);
        }
      }
      this.ctx.stroke();
    }

    // Draw point at tip only if we have multiple vectors
    if (this.vectors.length > 1) {
      this.ctx.fillStyle = "#ff0000";
      this.ctx.beginPath();
      this.ctx.arc(result.x, result.y, 4, 0, 2 * Math.PI);
      this.ctx.fill();
    }

    this.time += dt;

    // Check if shape is fully formed (multiple complete cycles with enough vectors)
    // We need to complete enough cycles to draw the full path
    const cyclesNeeded = 2; // Number of complete rotations needed
    if (
      !this.hasFinished &&
      this.vectors.length >= this.minVectorsForCompletion &&
      this.time > cyclesNeeded * 2 * Math.PI
    ) {
      this.hasFinished = true;
      if (this.finishCallback) {
        this.finishCallback();
      }
    }

    // Reset when complete
    // if (this.time > 2 * Math.PI) {
    //   this.time = 0;
    //   this.path = [];
    // }
  }

  // Initialize with SVG points
  init(svgPointsString) {
    const points = this.extractPointsFromSVG(svgPointsString);
    const interpolated = this.interpolatePoints(points, 1000);

    // Calculate the centroid of the shape
    let sumX = 0,
      sumY = 0;
    interpolated.forEach((p) => {
      sumX += p.x;
      sumY += p.y;
    });
    const centroidX = sumX / interpolated.length;
    const centroidY = sumY / interpolated.length;

    // Center the shape around origin, then scale
    const scale = 1.5;
    const centeredPoints = interpolated.map((p) => ({
      x: (p.x - centroidX) * scale,
      y: (p.y - centroidY) * scale,
      time: p.time,
    }));

    this.vectors = this.calculateFourierCoefficients(centeredPoints);
    this.draw();
  }
}
