import React, { useRef, useEffect } from 'react';
import ToneLab from './components/ToneLab'

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Create a context to share audio state between components
  const [audioState, setAudioState] = React.useState({
    freq1: 440,
    freq2: 880,
    volume1: 0.5,
    volume2: 0.5,
    isPlaying1: false,
    isPlaying2: false,
    isMixPlaying: false
  });

  // Sine wave visualizer for full page background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full viewport size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let time = 0;
    const animate = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Clear canvas with pure black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Only animate if any oscillator is actually playing
      if (audioState.isPlaying1 || audioState.isPlaying2) {
        // Draw individual waves at 25% opacity when only one is playing
        if (audioState.isPlaying1 && !audioState.isPlaying2) {
          ctx.lineWidth = 4;
          ctx.strokeStyle = `rgba(59, 130, 246, 0.25)`; // blue-500 at 25% opacity
          
          ctx.beginPath();
          for (let x = 0; x < width; x++) {
            const y = height / 2 + Math.sin((x * 0.003 + time * 0.01) * (audioState.freq1 / 100)) * (height / 8) * audioState.volume1;
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

        if (audioState.isPlaying2 && !audioState.isPlaying1) {
          ctx.lineWidth = 4;
          ctx.strokeStyle = `rgba(236, 72, 153, 0.25)`; // pink-500 at 25% opacity
          
          ctx.beginPath();
          for (let x = 0; x < width; x++) {
            const y = height / 2 + Math.sin((x * 0.003 + time * 0.01) * (audioState.freq2 / 100)) * (height / 8) * audioState.volume2;
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

        // Draw combined wave when both are playing
        if (audioState.isPlaying1 && audioState.isPlaying2) {
          ctx.lineWidth = 4;
          ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(audioState.volume1, audioState.volume2) * 0.8})`; // white with opacity
          
          ctx.beginPath();
          for (let x = 0; x < width; x++) {
            const wave1 = Math.sin((x * 0.003 + time * 0.01) * (audioState.freq1 / 100)) * audioState.volume1;
            const wave2 = Math.sin((x * 0.003 + time * 0.01) * (audioState.freq2 / 100)) * audioState.volume2;
            const combined = (wave1 + wave2) / 2;
            const y = height / 2 + combined * (height / 8);
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();

          // Add a subtle glow effect for the combined wave
          ctx.shadowColor = '#FFFFFF';
          ctx.shadowBlur = 20;
          ctx.lineWidth = 2;
          ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(audioState.volume1, audioState.volume2) * 0.4})`;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // Only advance time when audio is playing
      if (audioState.isPlaying1 || audioState.isPlaying2) {
        time += 0.5; // Slower animation
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioState]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Full page background canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />
      
      {/* Content - centered with padding */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <ToneLab onAudioStateChange={setAudioState} />
      </div>
    </div>
  )
}

export default App 