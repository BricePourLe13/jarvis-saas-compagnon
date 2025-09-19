"use client"

import { useRef, useEffect } from 'react'

/**
 * DarkVeilCanvas - Version Canvas 2D qui ressemble exactement au DarkVeil de React Bits
 * Alternative fiable sans WebGL, utilise Canvas 2D pour un rendu fluide
 */
type Props = {
  hueShift?: number;
  noiseIntensity?: number;
  speed?: number;
}

export default function DarkVeilCanvas({
  hueShift = 200,
  noiseIntensity = 0.05,
  speed = 0.3
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    // Configuration
    let animationId: number;
    let time = 0;

    // Fonction de redimensionnement
    const resize = () => {
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    // Fonction de conversion HSL vers RGB
    const hslToRgb = (h: number, s: number, l: number) => {
      h /= 360;
      s /= 100;
      l /= 100;
      const a = s * Math.min(l, 1 - l);
      const f = (n: number) => {
        const k = (n + h * 12) % 12;
        return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      };
      return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
    };

    // Génération des couleurs basées sur hueShift
    const getColors = (shift: number) => {
      const [r1, g1, b1] = hslToRgb(shift, 70, 50);
      const [r2, g2, b2] = hslToRgb(shift + 60, 60, 45);
      const [r3, g3, b3] = hslToRgb(shift + 120, 50, 40);
      return {
        primary: `rgba(${r1}, ${g1}, ${b1}`,
        secondary: `rgba(${r2}, ${g2}, ${b2}`,
        tertiary: `rgba(${r3}, ${g3}, ${b3}`
      };
    };

    // Fonction de rendu
    const render = () => {
      if (!ctx || !canvas) return;

      const { width, height } = canvas;
      const colors = getColors(hueShift);

      // Effacer le canvas
      ctx.clearRect(0, 0, width, height);

      // Background de base
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, '#0a0a0f');
      bgGradient.addColorStop(0.3, '#1a1a2e');
      bgGradient.addColorStop(0.6, '#16213e');
      bgGradient.addColorStop(1, '#0a0a0f');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Formes organiques animées
      const shapes = [
        {
          x: width * (0.3 + 0.2 * Math.sin(time * 0.5)),
          y: height * (0.4 + 0.1 * Math.cos(time * 0.3)),
          radius: Math.min(width, height) * (0.3 + 0.1 * Math.sin(time * 0.7)),
          color: colors.primary,
          opacity: 0.4 + 0.2 * Math.sin(time * 0.4)
        },
        {
          x: width * (0.7 + 0.15 * Math.cos(time * 0.6)),
          y: height * (0.6 + 0.2 * Math.sin(time * 0.4)),
          radius: Math.min(width, height) * (0.25 + 0.15 * Math.cos(time * 0.5)),
          color: colors.secondary,
          opacity: 0.3 + 0.2 * Math.cos(time * 0.6)
        },
        {
          x: width * (0.5 + 0.25 * Math.sin(time * 0.3)),
          y: height * (0.8 + 0.1 * Math.sin(time * 0.8)),
          radius: Math.min(width, height) * (0.2 + 0.1 * Math.sin(time * 0.9)),
          color: colors.tertiary,
          opacity: 0.25 + 0.15 * Math.sin(time * 0.7)
        }
      ];

      // Dessiner les formes avec des gradients radiaux
      shapes.forEach(shape => {
        const gradient = ctx.createRadialGradient(
          shape.x, shape.y, 0,
          shape.x, shape.y, shape.radius
        );
        gradient.addColorStop(0, `${shape.color}, ${shape.opacity})`);
        gradient.addColorStop(0.6, `${shape.color}, ${shape.opacity * 0.5})`);
        gradient.addColorStop(1, `${shape.color}, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Effet de noise/texture
      if (noiseIntensity > 0) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * noiseIntensity * 255;
          data[i] += noise;     // R
          data[i + 1] += noise; // G
          data[i + 2] += noise; // B
        }

        ctx.putImageData(imageData, 0, 0);
      }

      // Overlay de profondeur
      const overlayGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      overlayGradient.addColorStop(0, 'rgba(10, 10, 15, 0)');
      overlayGradient.addColorStop(1, 'rgba(10, 10, 15, 0.6)');
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, width, height);

      // Incrémenter le temps
      time += 0.016 * speed; // ~60fps

      // Continuer l'animation
      animationId = requestAnimationFrame(render);
    };

    // Initialisation
    resize();
    window.addEventListener('resize', resize);
    render();

    // Nettoyage
    return () => {
      window.removeEventListener('resize', resize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [hueShift, noiseIntensity, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block'
      }}
    />
  );
}
