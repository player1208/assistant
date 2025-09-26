import { useEffect, useMemo, useState } from 'react'
import { Particles, initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

// Interactive background for Schedule page: static gradient + particles
export default function InteractiveBackground() {
  const [init, setInit] = useState(false)

  // Initialize tsParticles engine with new API
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setInit(true)
    })
  }, [])

  // Static gradient colors
  const palette = useMemo(() => ['#ff6ec4', '#4ade80', '#7873f5'], [])

  // tsParticles options - static colors, no dynamic changes
  const options = useMemo(() => ({
    fullScreen: { enable: false },
    background: { color: { value: 'transparent' } },
    fpsLimit: 30,
    detectRetina: false,
    particles: {
      number: { value: 40, density: { enable: true, area: 800 } },
      color: { value: '#ff6ec4' }, // Fixed color, no changes
      links: { enable: false },
      move: {
        enable: true,
        speed: 1.5,
        direction: 'none' as const,
        random: false,
        straight: false,
        outModes: { default: 'out' as const }
      },
      size: { value: { min: 2, max: 5 } },
      opacity: { value: 0.6 },
      shape: { type: 'circle' },
    },
    interactivity: {
      detectsOn: 'window' as const,
      events: {
        onHover: { enable: true, mode: 'attract' },
        onClick: { enable: true, mode: 'push' },
        resize: { enable: true },
      },
      modes: {
        attract: { distance: 150, duration: 0.6, factor: 0.8 },
        push: { quantity: 2 },
      },
    },
  }), [])

  const particlesLoaded = async (container?: any) => {
    console.log('Particles loaded successfully:', container)
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Static gradient background - no motion, no scroll effects */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${palette[0]}22, ${palette[1]}22, ${palette[2]}22)`
        }}
      />
      {/* Only render particles after engine is initialized */}
      {init && (
        <div className="absolute inset-0">
          <Particles
            id="schedule-bg-particles"
            options={options}
            particlesLoaded={particlesLoaded}
          />
        </div>
      )}
    </div>
  )
}

