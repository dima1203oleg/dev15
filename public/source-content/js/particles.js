/* ============================================================
   SirenUA.online — Canvas Radar & Particle Effect
   Hero section background with radar sweep and threat dots
   ============================================================ */

class RadarParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.radarAngle = 0;
    this.blips = [];
    this.gridLines = [];
    this.running = true;

    this.resize();
    this.init();

    window.addEventListener('resize', () => this.resize());

    // Respect reduced motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.animate();
    } else {
      this.drawStatic();
    }
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.maxRadius = Math.min(this.width, this.height) * 0.35;
  }

  init() {
    // Create floating particles
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    // Create radar blips (simulated threat detections)
    const threatColors = [
      { r: 239, g: 68, b: 68 },    // red - ballistic
      { r: 245, g: 158, b: 11 },   // amber - cruise
      { r: 59, g: 130, b: 246 },   // blue - aviation
      { r: 0, g: 229, b: 255 },    // cyan - tracking
    ];

    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * this.maxRadius * 0.8 + this.maxRadius * 0.15;
      const color = threatColors[Math.floor(Math.random() * threatColors.length)];
      this.blips.push({
        angle,
        dist,
        color,
        opacity: 0,
        maxOpacity: Math.random() * 0.6 + 0.3,
        fadeSpeed: Math.random() * 0.008 + 0.003,
        size: Math.random() * 3 + 2
      });
    }
  }

  drawStatic() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawGrid();
    this.drawRadarRings();
  }

  animate() {
    if (!this.running) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawGrid();
    this.drawRadarRings();
    this.drawRadarSweep();
    this.updateBlips();
    this.drawBlips();
    this.updateParticles();
    this.drawParticles();
    this.drawConnections();

    this.radarAngle += 0.008;
    if (this.radarAngle > Math.PI * 2) this.radarAngle -= Math.PI * 2;

    requestAnimationFrame(() => this.animate());
  }

  drawGrid() {
    this.ctx.strokeStyle = 'rgba(34, 211, 238, 0.03)';
    this.ctx.lineWidth = 0.5;

    const gridSize = 80;
    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  drawRadarRings() {
    const rings = [0.25, 0.5, 0.75, 1.0];

    rings.forEach(scale => {
      const radius = this.maxRadius * scale;
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(34, 211, 238, ${0.06 - scale * 0.03})`;
      this.ctx.lineWidth = 0.5;
      this.ctx.stroke();
    });

    // Cross lines
    this.ctx.strokeStyle = 'rgba(34, 211, 238, 0.04)';
    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX - this.maxRadius, this.centerY);
    this.ctx.lineTo(this.centerX + this.maxRadius, this.centerY);
    this.ctx.moveTo(this.centerX, this.centerY - this.maxRadius);
    this.ctx.lineTo(this.centerX, this.centerY + this.maxRadius);
    this.ctx.stroke();

    // Center dot
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, 3, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
    this.ctx.fill();
  }

  drawRadarSweep() {
    const sweepLength = Math.PI * 0.4;

    const gradient = this.ctx.createConicGradient(
      this.radarAngle - sweepLength,
      this.centerX,
      this.centerY
    );

    gradient.addColorStop(0, 'rgba(34, 211, 238, 0)');
    gradient.addColorStop(0.7, 'rgba(34, 211, 238, 0.03)');
    gradient.addColorStop(1, 'rgba(34, 211, 238, 0.08)');

    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX, this.centerY);
    this.ctx.arc(this.centerX, this.centerY, this.maxRadius, this.radarAngle - sweepLength, this.radarAngle);
    this.ctx.closePath();
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // Sweep line
    const lineX = this.centerX + Math.cos(this.radarAngle) * this.maxRadius;
    const lineY = this.centerY + Math.sin(this.radarAngle) * this.maxRadius;

    const lineGradient = this.ctx.createLinearGradient(this.centerX, this.centerY, lineX, lineY);
    lineGradient.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
    lineGradient.addColorStop(1, 'rgba(34, 211, 238, 0)');

    this.ctx.beginPath();
    this.ctx.moveTo(this.centerX, this.centerY);
    this.ctx.lineTo(lineX, lineY);
    this.ctx.strokeStyle = lineGradient;
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  updateBlips() {
    this.blips.forEach(blip => {
      // Calculate angle difference between sweep and blip
      let angleDiff = this.radarAngle - blip.angle;
      while (angleDiff < 0) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI * 2) angleDiff -= Math.PI * 2;

      // Activate blip when sweep passes over it
      if (angleDiff < 0.15 && angleDiff > 0) {
        blip.opacity = blip.maxOpacity;
      } else {
        blip.opacity = Math.max(0, blip.opacity - blip.fadeSpeed);
      }
    });
  }

  drawBlips() {
    this.blips.forEach(blip => {
      if (blip.opacity <= 0) return;

      const x = this.centerX + Math.cos(blip.angle) * blip.dist;
      const y = this.centerY + Math.sin(blip.angle) * blip.dist;

      // Glow
      const glow = this.ctx.createRadialGradient(x, y, 0, x, y, blip.size * 4);
      glow.addColorStop(0, `rgba(${blip.color.r}, ${blip.color.g}, ${blip.color.b}, ${blip.opacity * 0.5})`);
      glow.addColorStop(1, 'rgba(0,0,0,0)');

      this.ctx.beginPath();
      this.ctx.arc(x, y, blip.size * 4, 0, Math.PI * 2);
      this.ctx.fillStyle = glow;
      this.ctx.fill();

      // Core dot
      this.ctx.beginPath();
      this.ctx.arc(x, y, blip.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${blip.color.r}, ${blip.color.g}, ${blip.color.b}, ${blip.opacity})`;
      this.ctx.fill();
    });
  }

  updateParticles() {
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      p.pulsePhase += p.pulseSpeed;
    });
  }

  drawParticles() {
    this.particles.forEach(p => {
      const pulse = Math.sin(p.pulsePhase) * 0.3 + 0.7;
      const opacity = p.opacity * pulse;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(34, 211, 238, ${opacity})`;
      this.ctx.fill();
    });
  }

  drawConnections() {
    const maxDist = 120;

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.08;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.strokeStyle = `rgba(34, 211, 238, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }

  destroy() {
    this.running = false;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('hero-canvas');
  if (canvas) {
    new RadarParticleSystem('hero-canvas');
  }
});
