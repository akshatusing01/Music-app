import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../services/audioEngine';

interface AudioVisualizerProps {
  isPlaying: boolean;
  theme: string;
  height?: number;
  barCount?: number;
  type?: 'bars' | 'wave' | 'circle';
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  theme,
  height = 48,
  barCount = 32,
  type = 'bars',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    canvas.height = height;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          width = canvas.width = entry.contentRect.width;
          canvas.height = height;
        }
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const freqData = audioEngine.getFrequencyData();
      const waveData = audioEngine.getWaveformData();

      // Theme-based gradients
      let color1 = '#f43f5e'; // rose
      let color2 = '#8b5cf6'; // purple
      if (theme === 'focus-emerald') {
        color1 = '#10b981';
        color2 = '#06b6d4';
      } else if (theme === 'sapphire-gym') {
        color1 = '#3b82f6';
        color2 = '#ec4899';
      } else if (theme === 'bollywood-ruby') {
        color1 = '#e11d48';
        color2 = '#fb923c';
      } else if (theme === 'glass-light') {
        color1 = '#db2777';
        color2 = '#4f46e5';
      }

      if (type === 'bars') {
        const gap = 3;
        const totalGaps = (barCount - 1) * gap;
        const barWidth = Math.max(2, (width - totalGaps) / barCount);

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * freqData.length);
          let value = isPlaying ? freqData[dataIndex] || 0 : 4;
          if (!isPlaying) {
            value = 6 + Math.sin(Date.now() * 0.003 + i * 0.4) * 4;
          }

          const percent = value / 255;
          const barHeight = Math.max(4, percent * height * 0.95);
          const x = i * (barWidth + gap);
          const y = height - barHeight;

          ctx.fillStyle = gradient;
          // Rounded top bar
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
          ctx.fill();
        }
      } else if (type === 'wave') {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = color1;
        ctx.shadowColor = color1;
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const sliceWidth = width / waveData.length;
        let x = 0;

        for (let i = 0; i < waveData.length; i++) {
          const v = isPlaying ? waveData[i] / 128.0 : 1.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
      }

      animFrameIdRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
    };
  }, [isPlaying, theme, height, barCount, type]);

  return (
    <canvas
      ref={canvasRef}
      id={`audio-visualizer-${type}`}
      className={`w-full block pointer-events-none ${className}`}
      style={{ height: `${height}px` }}
    />
  );
};
