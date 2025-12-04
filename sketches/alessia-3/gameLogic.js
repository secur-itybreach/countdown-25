import {
  getLineSignature,
  isProtectedPoint,
  isProhibitedConnection,
  isSpecificPathDrawn,
  isSpecialConnection,
} from "./utils.js";

export class GameLogic {
  constructor(gameState, points, finish) {
    this.gameState = gameState;
    this.points = points;
    this.finish = finish;
  }

  updatePoints(points) {
    this.points = points;
  }

  triggerPathCompletion() {
    if (this.gameState.pathCompleted) return;

    this.gameState.pathCompleted = true;
    console.log("FIN ???");

    // Make all non-protected points fall
    for (const p of this.points) {
      if (!isProtectedPoint(p) && !p.isFalling && !p.hasLanded) {
        p.isFalling = true;
        p.velocityX = (Math.random() - 0.5) * 8;
        p.velocityY = 0;
      }
    }
    this.finish();
  }

  addLine(p1, p2) {
    if (!p1 || !p2 || p1 === p2) return;

    // Check for duplicates using the Set
    const signature = getLineSignature(p1, p2);
    if (this.gameState.drawnLines.has(signature)) {
      return;
    }

    // Check if this is a prohibited connection
    if (isProhibitedConnection(p1, p2)) {
      // Create a falling line (red, disconnected from points)
      this.gameState.fallingLines.push({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
        velocityY: 0,
        hasLanded: false,
        bounceCount: 0,
      });
      return;
    }

    const special = isSpecialConnection(p1, p2);
    this.gameState.lines.push({ start: p1, end: p2, special });
    this.gameState.drawnLines.add(signature);

    // Check if the specific path is now complete
    if (isSpecificPathDrawn(this.gameState.drawnLines)) {
      console.log("🎉 Complete path has been drawn!");
      this.triggerPathCompletion();
    }

    // If this is NOT a special line, check if points should fall
    if (!special) {
      // Only make p1 fall if it's not a protected point
      if (!isProtectedPoint(p1) && !p1.isFalling) {
        p1.isFalling = true;
        p1.velocityX = (Math.random() - 0.5) * 5;
        p1.velocityY = 0;
      }

      // Only make p2 fall if it's not a protected point
      if (!isProtectedPoint(p2) && !p2.isFalling) {
        p2.isFalling = true;
        p2.velocityX = (Math.random() - 0.5) * 5;
        p2.velocityY = 0;
      }
    }
  }
}
