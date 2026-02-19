import React, { useEffect, useRef } from 'react';

export default function SnakeAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const W = 620;
  const H = 360;
  const cx = W / 2;
  const cy = H / 2;
  const a = 215;

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

    const SEGMENTS = 42;
    const SEG_SPACING = 0.016;
    const SPEED = 0.00042;

    function segRadius(i: number): number {
      if (i === 0) return 12;
      const t = i / (SEGMENTS - 1);
      const base = 8;
      const tip = 1.5;
      const bulge = Math.sin(t * Math.PI) * 1.5;
      return Math.max(tip, base - t * (base - tip) + bulge);
    }

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

    // Simple snake head
    function drawHead(hx: number, hy: number, headAngle: number, hr: number, timestamp: number) {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(headAngle);

      // Head glow
      const glowR = hr * 4;
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
      glow.addColorStop(0, 'rgba(59,130,246,0.3)');
      glow.addColorStop(1, 'rgba(29,78,216,0)');
      ctx.beginPath();
      ctx.arc(0, 0, glowR, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Head oval — wider at front, tapers to neck
      ctx.beginPath();
      ctx.moveTo(-hr * 0.5, -hr * 0.75);
      ctx.bezierCurveTo(hr * 0.4, -hr * 1.0, hr * 1.6, -hr * 0.7, hr * 2.0, 0);
      ctx.bezierCurveTo(hr * 1.6, hr * 0.7, hr * 0.4, hr * 1.0, -hr * 0.5, hr * 0.75);
      ctx.bezierCurveTo(-hr * 0.8, hr * 0.4, -hr * 0.8, -hr * 0.4, -hr * 0.5, -hr * 0.75);
      ctx.closePath();
      const headGrad = ctx.createLinearGradient(-hr * 0.5, -hr, hr * 2, 0);
      headGrad.addColorStop(0, '#1565c0');
      headGrad.addColorStop(0.5, '#1e88e5');
      headGrad.addColorStop(1, '#42a5f5');
      ctx.fillStyle = headGrad;
      ctx.fill();
      ctx.strokeStyle = '#90caf9';
      ctx.lineWidth = 1.1;
      ctx.stroke();

      // Snout tip highlight
      const tipGrad = ctx.createRadialGradient(hr * 1.7, 0, 0, hr * 1.7, 0, hr * 0.6);
      tipGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
      tipGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.ellipse(hr * 1.7, 0, hr * 0.5, hr * 0.4, 0, 0, Math.PI * 2);
      ctx.fillStyle = tipGrad;
      ctx.fill();

      // Nostrils
      [-1, 1].forEach(side => {
        ctx.save();
        ctx.translate(hr * 1.6, side * hr * 0.22);
        ctx.beginPath();
        ctx.ellipse(0, 0, hr * 0.1, hr * 0.07, side * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#0a2472';
        ctx.fill();
        ctx.restore();
      });

      // Eyes
      [-1, 1].forEach(side => {
        const ey = side * hr * 0.5;
        const ex = hr * 0.55;
        const eyeR = hr * 0.4;

        // Socket
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = '#0a1628';
        ctx.fill();

        // Iris
        const irisGrad = ctx.createRadialGradient(ex, ey, 0, ex, ey, eyeR);
        irisGrad.addColorStop(0, '#ffd54f');
        irisGrad.addColorStop(0.5, '#ff8f00');
        irisGrad.addColorStop(1, '#e65100');
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = irisGrad;
        ctx.fill();

        // Slit pupil
        ctx.save();
        ctx.translate(ex, ey);
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeR * 0.2, eyeR * 0.78, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.restore();

        // Glint
        ctx.beginPath();
        ctx.arc(ex - eyeR * 0.22, ey - eyeR * 0.28, eyeR * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fill();
      });

      // Forked tongue
      const tonguePhase = Math.sin(timestamp / 300);
      const tongueOut = 0.5 + tonguePhase * 0.5; // flicks in and out
      if (tongueOut > 0.15) {
        const tLen = hr * 1.6 * tongueOut;
        const forkLen = hr * 0.7 * tongueOut;
        const forkSpread = hr * 0.35 * tongueOut;
        ctx.save();
        ctx.globalAlpha = Math.min(1, tongueOut * 1.5);
        // Tongue base line
        ctx.beginPath();
        ctx.moveTo(hr * 1.9, 0);
        ctx.lineTo(hr * 1.9 + tLen, 0);
        // Fork top
        ctx.moveTo(hr * 1.9 + tLen, 0);
        ctx.lineTo(hr * 1.9 + tLen + forkLen, -forkSpread);
        // Fork bottom
        ctx.moveTo(hr * 1.9 + tLen, 0);
        ctx.lineTo(hr * 1.9 + tLen + forkLen, forkSpread);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = hr * 0.12;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }

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
      ctx.lineWidth = 2.5;
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

      // Draw body tail→head
      for (let i = SEGMENTS - 1; i >= 1; i--) {
        const s = segs[i];
        const next = segs[i - 1];
        const angle = Math.atan2(next.y - s.y, next.x - s.x);
        const perp = angle + Math.PI / 2;
        const rC = s.r;
        const rN = next.r;

        const x1 = s.x + Math.cos(perp) * rC;
        const y1 = s.y + Math.sin(perp) * rC;
        const x2 = s.x - Math.cos(perp) * rC;
        const y2 = s.y - Math.sin(perp) * rC;
        const x3 = next.x - Math.cos(perp) * rN;
        const y3 = next.y - Math.sin(perp) * rN;
        const x4 = next.x + Math.cos(perp) * rN;
        const y4 = next.y + Math.sin(perp) * rN;

        // Trapezoid connector
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x4, y4);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x2, y2);
        ctx.closePath();
        ctx.fillStyle = segColor(i);
        ctx.fill();

        // Segment circle
        ctx.beginPath();
        ctx.arc(s.x, s.y, rC, 0, Math.PI * 2);
        ctx.fillStyle = segColor(i);
        ctx.fill();

        // Belly stripe
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

        // Scale arcs on each segment
        if (rC > 3.5) {
          const numScales = Math.max(2, Math.floor(rC / 2.5));
          for (let sc = 0; sc < numScales; sc++) {
            const scAngle = angle + (sc / numScales) * Math.PI * 2;
            const scR = rC * 0.7;
            const scX = s.x + Math.cos(scAngle) * rC * 0.3;
            const scY = s.y + Math.sin(scAngle) * rC * 0.3;
            ctx.beginPath();
            ctx.arc(scX, scY, scR, scAngle + 0.3, scAngle + Math.PI - 0.3);
            ctx.strokeStyle = 'rgba(144,202,249,0.35)';
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
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

      // Head
      const head = segs[0];
      const neck = segs[1];
      const headAngle = Math.atan2(head.y - neck.y, head.x - neck.x);
      drawHead(head.x, head.y, headAngle, head.r, timestamp);

      animId = requestAnimationFrame(drawFrame);
    }

    animId = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="w-full h-full pointer-events-none select-none flex items-center justify-center" aria-hidden="true">
      <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block' }} />
    </div>
  );
}
