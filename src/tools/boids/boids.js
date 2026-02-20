// ============================================================
// Boid Physics - BOIDS
// ============================================================

// ============================================================
// Vector2D
// ============================================================

class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(v)         { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v)         { return new Vec2(this.x - v.x, this.y - v.y); }
  scale(s)       { return new Vec2(this.x * s,   this.y * s); }
  mag()          { return Math.sqrt(this.x * this.x + this.y * this.y); }
  magSq()        { return this.x * this.x + this.y * this.y; }
  normalize()    { const m = this.mag(); return m > 0 ? this.scale(1 / m) : new Vec2(0, 0); }
  limit(max)     { return this.mag() > max ? this.normalize().scale(max) : new Vec2(this.x, this.y); }
  heading()      { return Math.atan2(this.y, this.x); }
  addSelf(v)     { this.x += v.x; this.y += v.y; return this; }

  static random() {
    const a = Math.random() * Math.PI * 2;
    return new Vec2(Math.cos(a), Math.sin(a));
  }
}

// ============================================================
// Boid
// ============================================================

export class Boid {
  constructor(x, y) {
    this.pos = new Vec2(x, y);
    this.vel = Vec2.random().scale(1.5 + Math.random() * 2);
    this.acc = new Vec2(0, 0);
    this.index = 0; // set by Flock for palette coloring
  }

  // --------------------------------------------------------
  // Steering rules
  // --------------------------------------------------------

  /** Steer away from nearby boids to avoid crowding. */
  separation(neighbors, radius, maxSpeed, maxForce) {
    let steer = new Vec2(0, 0);
    let count = 0;

    for (const other of neighbors) {
      const diff = this.pos.sub(other.pos);
      const dSq = diff.magSq();
      if (dSq > 0 && dSq < radius * radius) {
        // Weight inversely by distance
        steer = steer.add(diff.normalize().scale(1 / Math.sqrt(dSq)));
        count++;
      }
    }

    if (count === 0) return new Vec2(0, 0);

    steer = steer.scale(1 / count).normalize().scale(maxSpeed);
    return steer.sub(this.vel).limit(maxForce);
  }

  /** Steer toward the average heading of nearby boids. */
  alignment(neighbors, radius, maxSpeed, maxForce) {
    let sum = new Vec2(0, 0);
    let count = 0;

    for (const other of neighbors) {
      const dSq = this.pos.sub(other.pos).magSq();
      if (dSq < radius * radius) {
        sum = sum.add(other.vel);
        count++;
      }
    }

    if (count === 0) return new Vec2(0, 0);

    sum = sum.scale(1 / count).normalize().scale(maxSpeed);
    return sum.sub(this.vel).limit(maxForce);
  }

  /** Steer toward the average position (center of mass) of nearby boids. */
  cohesion(neighbors, radius, maxSpeed, maxForce) {
    let sum = new Vec2(0, 0);
    let count = 0;

    for (const other of neighbors) {
      const dSq = this.pos.sub(other.pos).magSq();
      if (dSq < radius * radius) {
        sum = sum.add(other.pos);
        count++;
      }
    }

    if (count === 0) return new Vec2(0, 0);

    const target = sum.scale(1 / count);
    const desired = target.sub(this.pos).normalize().scale(maxSpeed);
    return desired.sub(this.vel).limit(maxForce);
  }

  // --------------------------------------------------------
  // Update
  // --------------------------------------------------------

  update(neighbors, params) {
    const { separationRadius, alignmentRadius, cohesionRadius,
            separationWeight, alignmentWeight, cohesionWeight,
            maxSpeed, minSpeed, maxForce } = params;

    const sep = this.separation(neighbors, separationRadius, maxSpeed, maxForce).scale(separationWeight);
    const ali = this.alignment(neighbors, alignmentRadius, maxSpeed, maxForce).scale(alignmentWeight);
    const coh = this.cohesion(neighbors, cohesionRadius, maxSpeed, maxForce).scale(cohesionWeight);

    this.acc = sep.add(ali).add(coh);
    this.vel = this.vel.add(this.acc).limit(maxSpeed);

    // Enforce minimum speed so boids never stall
    if (this.vel.mag() < minSpeed) {
      this.vel = this.vel.normalize().scale(minSpeed);
    }

    this.pos = this.pos.add(this.vel);
  }

  // --------------------------------------------------------
  // Boundary
  // --------------------------------------------------------

  handleBoundary(w, h, mode) {
    if (mode === 'wrap') {
      if (this.pos.x > w) this.pos.x = 0;
      if (this.pos.x < 0) this.pos.x = w;
      if (this.pos.y > h) this.pos.y = 0;
      if (this.pos.y < 0) this.pos.y = h;
    } else if (mode === 'bounce') {
      if (this.pos.x <= 0 || this.pos.x >= w) {
        this.vel = new Vec2(-this.vel.x, this.vel.y);
        this.pos.x = Math.max(0, Math.min(w, this.pos.x));
      }
      if (this.pos.y <= 0 || this.pos.y >= h) {
        this.vel = new Vec2(this.vel.x, -this.vel.y);
        this.pos.y = Math.max(0, Math.min(h, this.pos.y));
      }
    } else if (mode === 'avoid') {
      const margin = 60;
      const turn   = 0.4;
      if (this.pos.x < margin)     this.vel.x += turn;
      if (this.pos.x > w - margin) this.vel.x -= turn;
      if (this.pos.y < margin)     this.vel.y += turn;
      if (this.pos.y > h - margin) this.vel.y -= turn;
    }
  }

  // --------------------------------------------------------
  // Draw
  // --------------------------------------------------------

  /** Draw this boid to the p5 instance using the provided color string. */
  draw(p, color, size, shape, opacity) {
    const angle = this.vel.heading();
    const c = p.color(color);
    c.setAlpha(opacity * 255);

    p.push();
    p.translate(this.pos.x, this.pos.y);
    p.rotate(angle + Math.PI / 2);

    if (shape === 'triangle') {
      p.fill(c);
      p.noStroke();
      p.triangle(0, -size, -size * 0.5, size * 0.6, size * 0.5, size * 0.6);
    } else if (shape === 'circle') {
      p.fill(c);
      p.noStroke();
      p.ellipse(0, 0, size, size);
    } else if (shape === 'line') {
      p.stroke(c);
      p.strokeWeight(1.5);
      p.noFill();
      p.line(0, -size, 0, size * 0.6);
    }

    p.pop();
  }
}

// ============================================================
// Flock
// ============================================================

export class Flock {
  constructor(count, w, h) {
    this.boids = [];
    this.resize(count, w, h);
  }

  resize(count, w, h) {
    const current = this.boids.length;

    if (count > current) {
      // Add new boids at random positions
      for (let i = current; i < count; i++) {
        const b = new Boid(Math.random() * w, Math.random() * h);
        b.index = i;
        this.boids.push(b);
      }
    } else if (count < current) {
      this.boids.length = count;
    }

    // Re-index
    this.boids.forEach((b, i) => { b.index = i; });
  }

  /** Scatter all boids across the canvas (used when canvas size changes). */
  scatter(w, h) {
    for (const b of this.boids) {
      b.pos.x = Math.random() * w;
      b.pos.y = Math.random() * h;
    }
  }

  update(params, w, h) {
    for (const boid of this.boids) {
      boid.update(this.boids, params);
      boid.handleBoundary(w, h, params.boundary);
    }
  }

  draw(p, getBoidColor, visualParams) {
    const { boidSize, shape, opacity } = visualParams;
    const total = this.boids.length;

    for (const boid of this.boids) {
      const speed   = boid.vel.mag();
      const heading = boid.vel.heading();
      const color   = getBoidColor(speed, heading, boid.index, total);
      boid.draw(p, color, boidSize, shape, opacity);
    }
  }
}
