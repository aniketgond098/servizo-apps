import React, { useEffect, useRef } from 'react';

interface Props {
  variant?: 'desktop' | 'mobile';
}

export default function HeroToolsAnimation({ variant = 'desktop' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isMobile = variant === 'mobile';

  const W = isMobile ? 340 : 620;
  const H = isMobile ? 200 : 360;
  const cx = W / 2;
  const cy = H / 2;
  const a = isMobile ? 108 : 215;

  function lemniscate(t: number): [number, number] {
    const s = Math.sin(t);
    const denom = 1 + s * s;
    return [cx + (a * Math.cos(t)) / denom, cy + (a * s * Math.cos(t)) / denom];
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PATH_STEPS = 1200;
    const pathX = new Float32Array(PATH_STEPS);
    const pathY = new Float32Array(PATH_STEPS);
    const pathAngle = new Float32Array(PATH_STEPS);

    for (let i = 0; i < PATH_STEPS; i++) {
      const t = (i / PATH_STEPS) * 2 * Math.PI;
      const [x, y] = lemniscate(t);
      pathX[i] = x;
      pathY[i] = y;
    }
    for (let i = 0; i < PATH_STEPS; i++) {
      const next = (i + 1) % PATH_STEPS;
      pathAngle[i] = Math.atan2(pathY[next] - pathY[i], pathX[next] - pathX[i]);
    }

      const SEGMENTS = isMobile ? 26 : 42;
      const SEG_SPACING = 0.016;
      const SPEED = 0.00042;

    function segRadius(i: number): number {
      if (i === 0) return isMobile ? 7 : 12;
      const t = i / (SEGMENTS - 1);
      const base = isMobile ? 5 : 8;
      const tip = isMobile ? 1 : 1.5;
      const bulge = Math.sin(t * Math.PI) * (isMobile ? 1 : 1.5);
      return Math.max(tip, base - t * (base - tip) + bulge);
    }

    // Main body color: deep royal blue
    function segColor(i: number, light = false): string {
      const t = i / (SEGMENTS - 1);
      if (light) {
        const r = Math.round(100 + t * 30);
        const g = Math.round(180 - t * 60);
        const b = 255;
        return `rgb(${r},${g},${b})`;
      }
      const r = Math.round(20 + t * 15);
      const g = Math.round(80 - t * 40);
      const b = Math.round(220 - t * 50);
      return `rgb(${r},${g},${b})`;
    }

    function getPosAt(fraction: number) {
      const f = ((fraction % 1) + 1) % 1;
      const idx = Math.floor(f * PATH_STEPS) % PATH_STEPS;
      return { x: pathX[idx], y: pathY[idx], angle: pathAngle[idx] };
    }

    // Draw a single fish-scale arc on a body segment
    function drawScale(
      sx: number, sy: number, segAngle: number,
      r: number, col: string, highlightCol: string,
      side: number // +1 or -1
    ) {
      const perp = segAngle + Math.PI / 2;
      const scaleR = r * 0.72;
      const bx = sx + Math.cos(perp) * side * r * 0.55;
      const by = sy + Math.sin(perp) * side * r * 0.55;

      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(segAngle + (side > 0 ? -0.3 : 0.3));

      // Scale body (teardrop shape)
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        -scaleR * 0.6, -scaleR * 0.8,
        scaleR * 0.6, -scaleR * 0.8,
        0, 0
      );
      ctx.bezierCurveTo(
        scaleR * 0.8, scaleR * 0.5,
        -scaleR * 0.8, scaleR * 0.5,
        0, 0
      );
      ctx.fillStyle = col;
      ctx.fill();

      // Scale highlight
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        -scaleR * 0.3, -scaleR * 0.5,
        scaleR * 0.3, -scaleR * 0.5,
        0, 0
      );
      ctx.fillStyle = highlightCol;
      ctx.fill();

      // Scale outline
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        -scaleR * 0.6, -scaleR * 0.8,
        scaleR * 0.6, -scaleR * 0.8,
        0, 0
      );
      ctx.bezierCurveTo(
        scaleR * 0.8, scaleR * 0.5,
        -scaleR * 0.8, scaleR * 0.5,
        0, 0
      );
      ctx.strokeStyle = 'rgba(147,197,253,0.4)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    }

    // Draw a dorsal spine
    function drawSpine(sx: number, sy: number, segAngle: number, r: number, big: boolean) {
      const spineLen = r * (big ? (isMobile ? 2.2 : 2.8) : (isMobile ? 1.4 : 1.9));
      const spineAng = segAngle - Math.PI / 2;

      ctx.save();
      ctx.translate(sx, sy);

      // Spine base-to-tip shape
      ctx.beginPath();
      ctx.moveTo(-r * 0.25, 0);
      ctx.lineTo(r * 0.25, 0);
      ctx.lineTo(Math.cos(spineAng - segAngle) * r * 0.12, -spineLen);
      ctx.closePath();

      const spineGrad = ctx.createLinearGradient(0, 0, Math.cos(spineAng - segAngle) * r * 0.12, -spineLen);
      spineGrad.addColorStop(0, '#1565c0');
      spineGrad.addColorStop(1, '#90caf9');
      ctx.fillStyle = spineGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(144,202,249,0.5)';
      ctx.lineWidth = 0.5;
      ctx.stroke();

      ctx.restore();
    }

    // Wing-like fin
    function drawFin(sx: number, sy: number, segAngle: number, r: number, side: number) {
      const finLen = r * (isMobile ? 2.5 : 3.5);
      const perp = segAngle + (side > 0 ? Math.PI / 2 : -Math.PI / 2);

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(segAngle);

      const fx = Math.cos(perp - segAngle) * finLen;
      const fy = Math.sin(perp - segAngle) * finLen;

      ctx.beginPath();
      ctx.moveTo(-r * 0.4, 0);
      ctx.quadraticCurveTo(fx * 0.3, fy * 0.8, fx, fy);
      ctx.quadraticCurveTo(fx * 0.7, fy * 0.4, r * 0.4, 0);
      ctx.closePath();

      const finGrad = ctx.createLinearGradient(0, 0, fx, fy);
      finGrad.addColorStop(0, 'rgba(21,101,192,0.8)');
      finGrad.addColorStop(1, 'rgba(144,202,249,0.15)');
      ctx.fillStyle = finGrad;
      ctx.fill();
      ctx.strokeStyle = 'rgba(144,202,249,0.3)';
      ctx.lineWidth = 0.7;
      ctx.stroke();

      // Claw-like tips on fin
      for (let c = 0; c < 3; c++) {
        const t = (c + 1) / 4;
        const clawX = fx * t + (r * 0.4) * (1 - t) + (-r * 0.4) * 0;
        const clawY = fy * t;
        const clawLen = r * 0.45;
        const clawAng = perp - segAngle + (c - 1) * 0.25;
        ctx.beginPath();
        ctx.moveTo(clawX, clawY);
        ctx.lineTo(
          clawX + Math.cos(clawAng) * clawLen,
          clawY + Math.sin(clawAng) * clawLen
        );
        ctx.strokeStyle = '#90caf9';
        ctx.lineWidth = isMobile ? 0.8 : 1.2;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      ctx.restore();
    }

    // Entire head drawn in local coordinates (facing right = 0)
    function drawHead(hx: number, hy: number, headAngle: number, hr: number, timestamp: number) {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(headAngle);

      // Head glow
      const glowR = hr * 4;
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
      glow.addColorStop(0, 'rgba(59,130,246,0.35)');
      glow.addColorStop(1, 'rgba(29,78,216,0)');
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // ---- LOWER JAW ----
      const jawOpen = 0.28 + Math.sin(timestamp / 500) * 0.12; // breathing jaw motion
      ctx.save();
      ctx.rotate(jawOpen);
      ctx.beginPath();
      ctx.moveTo(-hr * 0.3, 0);
      ctx.bezierCurveTo(hr * 0.4, hr * 0.1, hr * 1.0, hr * 0.55, hr * 1.7, hr * 0.3);
      ctx.bezierCurveTo(hr * 1.3, hr * 0.75, hr * 0.5, hr * 0.9, -hr * 0.3, hr * 0.5);
      ctx.closePath();
      ctx.fillStyle = '#0d47a1';
      ctx.fill();
      ctx.strokeStyle = '#1565c0';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Lower teeth
      const lowerTeeth = isMobile ? 4 : 6;
      for (let t = 0; t < lowerTeeth; t++) {
        const tx = hr * 0.2 + (t / (lowerTeeth - 1)) * hr * 1.3;
        const ty = hr * 0.38 + Math.sin((t / lowerTeeth) * Math.PI) * hr * 0.15;
        const th = hr * (t % 2 === 0 ? 0.45 : 0.3);
        ctx.beginPath();
        ctx.moveTo(tx - hr * 0.1, ty);
        ctx.lineTo(tx, ty - th);
        ctx.lineTo(tx + hr * 0.1, ty);
        ctx.closePath();
        ctx.fillStyle = '#e3f2fd';
        ctx.strokeStyle = 'rgba(144,202,249,0.5)';
        ctx.lineWidth = 0.5;
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore(); // jaw

      // ---- UPPER HEAD ----
      // Main skull shape
      ctx.beginPath();
      ctx.moveTo(-hr * 0.4, -hr * 0.7);
      ctx.bezierCurveTo(hr * 0.2, -hr * 1.1, hr * 1.0, -hr * 0.9, hr * 1.8, -hr * 0.15);
      ctx.bezierCurveTo(hr * 2.0, hr * 0.05, hr * 1.95, hr * 0.2, hr * 1.7, hr * 0.25);
      ctx.bezierCurveTo(hr * 1.1, hr * 0.15, hr * 0.3, hr * 0.0, -hr * 0.3, hr * 0.0);
      ctx.bezierCurveTo(-hr * 0.5, hr * 0.0, -hr * 0.6, -hr * 0.35, -hr * 0.4, -hr * 0.7);
      ctx.closePath();
      const headGrad = ctx.createLinearGradient(-hr * 0.4, -hr, hr * 2, 0);
      headGrad.addColorStop(0, '#1565c0');
      headGrad.addColorStop(0.5, '#1e88e5');
      headGrad.addColorStop(1, '#42a5f5');
      ctx.fillStyle = headGrad;
      ctx.fill();
      ctx.strokeStyle = '#90caf9';
      ctx.lineWidth = isMobile ? 0.8 : 1.1;
      ctx.stroke();

      // Snout brow ridge
      ctx.beginPath();
      ctx.moveTo(hr * 0.6, -hr * 0.85);
      ctx.bezierCurveTo(hr * 1.0, -hr * 1.05, hr * 1.4, -hr * 0.85, hr * 1.7, -hr * 0.4);
      ctx.strokeStyle = '#64b5f6';
      ctx.lineWidth = isMobile ? 1 : 1.5;
      ctx.stroke();

      // Scales on head
      for (let s = 0; s < (isMobile ? 4 : 6); s++) {
        const sx = -hr * 0.1 + s * hr * 0.33;
        const sy = -hr * (0.55 - Math.sin((s / 5) * Math.PI) * 0.2);
        const sr = hr * 0.22;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, Math.PI, 0);
        ctx.strokeStyle = 'rgba(144,202,249,0.45)';
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }

      // Nostril slits
      ctx.save();
      ctx.translate(hr * 1.55, -hr * 0.18);
      ctx.rotate(-0.3);
      ctx.beginPath();
      ctx.ellipse(0, -hr * 0.1, hr * 0.07, hr * 0.16, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0a2472';
      ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.translate(hr * 1.55, hr * 0.02);
      ctx.rotate(0.3);
      ctx.beginPath();
      ctx.ellipse(0, hr * 0.1, hr * 0.07, hr * 0.16, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#0a2472';
      ctx.fill();
      ctx.restore();

      // Upper teeth (behind lip)
      const upperTeeth = isMobile ? 4 : 6;
      for (let t = 0; t < upperTeeth; t++) {
        const tx = hr * 0.3 + (t / (upperTeeth - 1)) * hr * 1.2;
        const ty = hr * 0.08;
        const th = hr * (t % 2 === 0 ? 0.5 : 0.35);
        ctx.beginPath();
        ctx.moveTo(tx - hr * 0.1, ty);
        ctx.lineTo(tx, ty + th);
        ctx.lineTo(tx + hr * 0.1, ty);
        ctx.closePath();
        ctx.fillStyle = '#e3f2fd';
        ctx.strokeStyle = 'rgba(144,202,249,0.5)';
        ctx.lineWidth = 0.5;
        ctx.fill();
        ctx.stroke();
      }

      // BIG fang on upper jaw
      ctx.beginPath();
      ctx.moveTo(hr * 0.45, hr * 0.08);
      ctx.lineTo(hr * 0.5, hr * 0.68);
      ctx.lineTo(hr * 0.62, hr * 0.08);
      ctx.closePath();
      ctx.fillStyle = '#f0f9ff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(144,202,249,0.7)';
      ctx.lineWidth = 0.6;
      ctx.stroke();

      // Second big fang
      ctx.beginPath();
      ctx.moveTo(hr * 0.9, hr * 0.08);
      ctx.lineTo(hr * 0.96, hr * 0.58);
      ctx.lineTo(hr * 1.07, hr * 0.08);
      ctx.closePath();
      ctx.fillStyle = '#f0f9ff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(144,202,249,0.7)';
      ctx.lineWidth = 0.6;
      ctx.stroke();

      // ---- HORNS ----
      // Primary large curved horn (top)
      ctx.beginPath();
      ctx.moveTo(hr * 0.1, -hr * 0.65);
      ctx.bezierCurveTo(-hr * 0.3, -hr * 1.6, hr * 0.5, -hr * 2.4, hr * 0.9, -hr * 2.1);
      ctx.bezierCurveTo(hr * 1.1, -hr * 1.9, hr * 0.7, -hr * 1.5, hr * 0.5, -hr * 1.1);
      ctx.strokeStyle = '#90caf9';
      ctx.lineWidth = isMobile ? 2 : 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(hr * 0.1, hr * 0.65);
      ctx.bezierCurveTo(-hr * 0.3, hr * 1.6, hr * 0.5, hr * 2.4, hr * 0.9, hr * 2.1);
      ctx.bezierCurveTo(hr * 1.1, hr * 1.9, hr * 0.7, hr * 1.5, hr * 0.5, hr * 1.1);
      ctx.strokeStyle = '#90caf9';
      ctx.lineWidth = isMobile ? 2 : 3;
      ctx.stroke();

      // Small secondary horn
      ctx.beginPath();
      ctx.moveTo(hr * 0.55, -hr * 0.82);
      ctx.lineTo(hr * 0.4, -hr * 1.45);
      ctx.lineTo(hr * 0.72, -hr * 0.9);
      ctx.closePath();
      ctx.fillStyle = '#64b5f6';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(hr * 0.55, hr * 0.82);
      ctx.lineTo(hr * 0.4, hr * 1.45);
      ctx.lineTo(hr * 0.72, hr * 0.9);
      ctx.closePath();
      ctx.fillStyle = '#64b5f6';
      ctx.fill();

      // ---- EYES ----
      const eyeX = hr * 0.55;
      const eyeR = isMobile ? hr * 0.38 : hr * 0.42;

      [-1, 1].forEach((side) => {
        const ey = side * hr * 0.52;

        // Eye socket dark
        ctx.beginPath();
        ctx.arc(eyeX, ey, eyeR * 1.25, 0, Math.PI * 2);
        ctx.fillStyle = '#0a1628';
        ctx.fill();

        // Iris — glowing amber/gold for fearsome look
        const irisGrad = ctx.createRadialGradient(eyeX, ey, 0, eyeX, ey, eyeR);
        irisGrad.addColorStop(0, '#ffd54f');
        irisGrad.addColorStop(0.5, '#ff8f00');
        irisGrad.addColorStop(1, '#e65100');
        ctx.beginPath();
        ctx.arc(eyeX, ey, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = irisGrad;
        ctx.fill();

        // Vertical slit pupil
        ctx.save();
        ctx.translate(eyeX, ey);
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeR * 0.22, eyeR * 0.82, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.restore();

        // Eye glow
        const eg = ctx.createRadialGradient(eyeX, ey, 0, eyeX, ey, eyeR * 2.2);
        eg.addColorStop(0, 'rgba(255,200,0,0.4)');
        eg.addColorStop(1, 'rgba(255,140,0,0)');
        ctx.beginPath();
        ctx.arc(eyeX, ey, eyeR * 2.2, 0, Math.PI * 2);
        ctx.fillStyle = eg;
        ctx.fill();

        // Glint
        ctx.beginPath();
        ctx.arc(eyeX - eyeR * 0.25, ey - eyeR * 0.3, eyeR * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
      });

      // Brow ridges (menacing)
      [-1, 1].forEach((side) => {
        const ey = side * hr * 0.52;
        ctx.beginPath();
        ctx.moveTo(eyeX - eyeR * 0.6, ey - side * eyeR * 0.95);
        ctx.lineTo(eyeX + eyeR * 0.9, ey - side * eyeR * 0.7);
        ctx.strokeStyle = '#1565c0';
        ctx.lineWidth = isMobile ? 1.5 : 2.2;
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      // ---- WHISKERS ----
      const whiskerPhase = timestamp / 1200;
      [[-hr * 0.2, -hr * 0.15], [-hr * 0.2, hr * 0.15]].forEach(([wy], wi) => {
        const wSide = wi === 0 ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(hr * 1.5, wSide * hr * 0.15);
        ctx.bezierCurveTo(
          hr * 2.1 + Math.sin(whiskerPhase) * hr * 0.15, wSide * hr * 0.5,
          hr * 2.6 + Math.cos(whiskerPhase) * hr * 0.1, wSide * hr * 0.2,
          hr * 3.1 + Math.sin(whiskerPhase + 1) * hr * 0.2, wSide * hr * 0.55
        );
        ctx.strokeStyle = '#90caf9';
        ctx.lineWidth = isMobile ? 0.9 : 1.3;
        ctx.lineCap = 'round';
        ctx.stroke();
        // Whisker tip ball
        ctx.beginPath();
        ctx.arc(
          hr * 3.1 + Math.sin(whiskerPhase + 1) * hr * 0.2,
          wSide * hr * 0.55,
          isMobile ? 1.5 : 2.2, 0, Math.PI * 2
        );
        ctx.fillStyle = '#bfdbfe';
        ctx.fill();
      });

       ctx.restore();
    }

    let phase = 0;
    let animId: number;
    let lastTime = 0;

    function drawFrame(timestamp: number) {
      const dt = lastTime ? Math.min(timestamp - lastTime, 50) : 16;
      lastTime = timestamp;
      phase = (phase + SPEED * dt) % 1;

      ctx.clearRect(0, 0, W, H);

      // Faint ∞ track
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = isMobile ? 1.5 : 2.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#3b82f6';
      ctx.beginPath();
      for (let i = 0; i < PATH_STEPS; i++) {
        if (i === 0) ctx.moveTo(pathX[i], pathY[i]);
        else ctx.lineTo(pathX[i], pathY[i]);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Compute segment positions
      const segs: { x: number; y: number; angle: number; r: number }[] = [];
      for (let i = 0; i < SEGMENTS; i++) {
        const f = phase - i * SEG_SPACING;
        const pos = getPosAt(f);
        segs.push({ ...pos, r: segRadius(i) });
      }

      // Body glow
      for (let i = SEGMENTS - 1; i >= 2; i--) {
        const s = segs[i];
        const alpha = (1 - i / SEGMENTS) * 0.14;
        const gr = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 2.8);
        gr.addColorStop(0, `rgba(30,100,220,${alpha})`);
        gr.addColorStop(1, 'rgba(30,100,220,0)');
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * 2.8, 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();
      }

      // Draw body from tail to head
      for (let i = SEGMENTS - 1; i >= 1; i--) {
        const s = segs[i];
        const next = segs[i - 1];
        const angle = Math.atan2(next.y - s.y, next.x - s.x);
        const perp = angle + Math.PI / 2;
        const rC = s.r;
        const rN = next.r;

        // Trapezoid connector
        const x1 = s.x + Math.cos(perp) * rC;
        const y1 = s.y + Math.sin(perp) * rC;
        const x2 = s.x - Math.cos(perp) * rC;
        const y2 = s.y - Math.sin(perp) * rC;
        const x3 = next.x - Math.cos(perp) * rN;
        const y3 = next.y - Math.sin(perp) * rN;
        const x4 = next.x + Math.cos(perp) * rN;
        const y4 = next.y + Math.sin(perp) * rN;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x4, y4);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fillStyle = segColor(i);
        ctx.fill();

        // Belly plate
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x4, y4);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fillStyle = `rgba(147,197,253,0.12)`;
        ctx.fill();

        // Segment circle
        ctx.beginPath();
        ctx.arc(s.x, s.y, rC, 0, Math.PI * 2);
        ctx.fillStyle = segColor(i);
        ctx.fill();

        // Belly ellipse
        if (i < SEGMENTS - 3 && rC > 3) {
          ctx.save();
          ctx.translate(s.x, s.y);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.ellipse(0, 0, rC * 0.42, rC * 0.65, 0, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(147,197,253,0.18)';
          ctx.fill();
          ctx.restore();
        }

        // Scales on both sides — every segment
        if (rC > 3.5) {
          const scaleCol = segColor(i);
          const highlightCol = segColor(i, true);
          drawScale(s.x, s.y, angle, rC, scaleCol, highlightCol, 1);
          drawScale(s.x, s.y, angle, rC, scaleCol, highlightCol, -1);
        }

        // Dorsal spines — every 2nd segment
        if (i % 2 === 0 && i < SEGMENTS - 4 && i > 1 && rC > 4) {
          const big = i % 6 === 0;
          drawSpine(s.x, s.y, angle, rC, big);
        }

        // Fins — at ~1/4 and ~1/2 of body
        const finPositions = isMobile ? [6, 14] : [8, 20];
        if (finPositions.includes(i)) {
          drawFin(s.x, s.y, angle, rC, 1);
          drawFin(s.x, s.y, angle, rC, -1);
        }
      }

      // Tail tip
      const tail = segs[SEGMENTS - 1];
      const preTail = segs[SEGMENTS - 2];
      const tailAngle = Math.atan2(tail.y - preTail.y, tail.x - preTail.x);
      ctx.beginPath();
      ctx.moveTo(tail.x + Math.cos(tailAngle + Math.PI / 2) * tail.r * 0.6, tail.y + Math.sin(tailAngle + Math.PI / 2) * tail.r * 0.6);
      ctx.lineTo(tail.x + Math.cos(tailAngle) * tail.r * 2, tail.y + Math.sin(tailAngle) * tail.r * 2);
      ctx.lineTo(tail.x - Math.cos(tailAngle + Math.PI / 2) * tail.r * 0.6, tail.y - Math.sin(tailAngle + Math.PI / 2) * tail.r * 0.6);
      ctx.closePath();
      ctx.fillStyle = segColor(SEGMENTS - 1);
      ctx.fill();

      // HEAD
      const head = segs[0];
      const neck = segs[1];
      const headAngle = Math.atan2(head.y - neck.y, head.x - neck.x);
      drawHead(head.x, head.y, headAngle, head.r, timestamp);

      // Dragon pearl
      const pearlOffset = head.r * 4.2;
      const pearlX = head.x + Math.cos(headAngle) * pearlOffset;
      const pearlY = head.y + Math.sin(headAngle) * pearlOffset;
      const pr = isMobile ? 4 : 6;
      const pulse = 0.65 + Math.sin(timestamp / 350) * 0.35;

      const pearlGrad = ctx.createRadialGradient(pearlX - pr * 0.3, pearlY - pr * 0.3, 0, pearlX, pearlY, pr);
      pearlGrad.addColorStop(0, 'rgba(255,255,255,0.98)');
      pearlGrad.addColorStop(0.4, 'rgba(186,230,253,0.9)');
      pearlGrad.addColorStop(1, 'rgba(59,130,246,0.5)');

      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.shadowBlur = isMobile ? 10 : 18;
      ctx.shadowColor = '#93c5fd';
      ctx.beginPath();
      ctx.arc(pearlX, pearlY, pr, 0, Math.PI * 2);
      ctx.fillStyle = pearlGrad;
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(drawFrame);
    }

    animId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(animId);
  }, [isMobile, W, H, cx, cy, a]);

  return (
    <div
      className="w-full h-full pointer-events-none select-none flex items-center justify-center"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ display: 'block' }}
      />
    </div>
  );
}
