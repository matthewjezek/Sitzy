import { useEffect } from 'react'
import gsap from 'gsap'

interface SplashScreenProps {
  onComplete?: () => void
  duration?: number
}

export default function SplashScreen({ onComplete, duration = 2000 }: SplashScreenProps) {
  useEffect(() => {
    gsap.set('svg', { transformOrigin: '50% 50%' })

    const tl = gsap.timeline({ delay: 0.3, onComplete: onComplete })

    // Morph Z
    tl.to('#morph-z', {
      attr: { d: 'M 225 48 L 211 88 L 176 78 L 186 113' },
      stroke: '#6345d6',
      duration: 1.2,
      ease: 'power2.inOut',
    }, 'morph')

    // Dot animation
    tl.to(
      '#dot',
      {
        x: 152.5,
        fill: '#6345d6',
        duration: 1.2,
        ease: 'power1.inOut',
      },
      'morph'
    )
      .to(
        '#dot',
        {
          y: -40,
          duration: 0.6,
          ease: 'sine.out',
        },
        'morph'
      )
      .to(
        '#dot',
        {
          y: 23,
          duration: 0.6,
          ease: 'sine.in',
        },
        'morph+=0.6'
      )

    // Fade out letters
    tl.to(
      '#letters-sit',
      { x: -50, opacity: 0, duration: 0.8, ease: 'power2.inOut' },
      'morph+=0.4'
    ).to(
      '#letter-y',
      { x: 50, opacity: 0, duration: 0.8, ease: 'power2.inOut' },
      'morph+=0.4'
    )

    // Zoom and pan
    tl.to(
      'svg',
      {
        xPercent: -15,
        yPercent: -10,
        scale: 1.5,
        duration: 1.2,
        ease: 'power2.inOut',
      },
      '+=0.2'
    )

    // Auto-dismiss after duration
    const timeout = setTimeout(() => {
      onComplete?.()
    }, duration)

    return () => {
      clearTimeout(timeout)
      tl.kill()
    }
  }, [duration, onComplete])

  return (
    <div className="relative w-full flex items-center justify-center">
      <svg viewBox="0 0 325 122" overflow="visible" className="w-full max-w-md px-8">
        {/* 'SIT' letters */}
        <path
          id="letters-sit"
          d="M31.6 98.4C25.8667 98.4 20.3333 97.7 15 96.3C9.73333 94.8333 5.43333 92.9667 2.1 90.7L8.6 76.1C11.7333 78.1 15.3333 79.7667 19.4 81.1C23.5333 82.3667 27.6333 83 31.7 83C34.4333 83 36.6333 82.7667 38.3 82.3C39.9667 81.7667 41.1667 81.1 41.9 80.3C42.7 79.4333 43.1 78.4333 43.1 77.3C43.1 75.7 42.3667 74.4333 40.9 73.5C39.4333 72.5667 37.5333 71.8 35.2 71.2C32.8667 70.6 30.2667 70 27.4 69.4C24.6 68.8 21.7667 68.0333 18.9 67.1C16.1 66.1667 13.5333 64.9667 11.2 63.5C8.86667 61.9667 6.96667 60 5.5 57.6C4.03333 55.1333 3.3 52.0333 3.3 48.3C3.3 44.1 4.43333 40.3 6.7 36.9C9.03333 33.5 12.5 30.7667 17.1 28.7C21.7 26.6333 27.4333 25.6 34.3 25.6C38.9 25.6 43.4 26.1333 47.8 27.2C52.2667 28.2 56.2333 29.7 59.7 31.7L53.6 46.4C50.2667 44.6 46.9667 43.2667 43.7 42.4C40.4333 41.4667 37.2667 41 34.2 41C31.4667 41 29.2667 41.3 27.6 41.9C25.9333 42.4333 24.7333 43.1667 24 44.1C23.2667 45.0333 22.9 46.1 22.9 47.3C22.9 48.8333 23.6 50.0667 25 51C26.4667 51.8667 28.3667 52.6 30.7 53.2C33.1 53.7333 35.7 54.3 38.5 54.9C41.3667 55.5 44.2 56.2667 47 57.2C49.8667 58.0667 52.4667 59.2667 54.8 60.8C57.1333 62.2667 59 64.2333 60.4 66.7C61.8667 69.1 62.6 72.1333 62.6 75.8C62.6 79.8667 61.4333 83.6333 59.1 87.1C56.8333 90.5 53.4 93.2333 48.8 95.3C44.2667 97.3667 38.5333 98.4 31.6 98.4ZM71.7461 97V27H91.5461V97H71.7461ZM120.533 97V42.7H99.0328V27H161.733V42.7H140.333V97H120.533Z"
          fill="white"
        />

        {/* Morphing 'Z' */}
        <g transform="translate(4, 0)">
          <path
            id="morph-z"
            d="M 167.75 35.25 L 225 35.25 L 176 88.75 L 233.25 88.75"
            stroke="white"
            strokeWidth="16"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* 'Y' letter */}
        <path
          id="letter-y"
          d="M270.7 97V67.4L275.3 79.3L244 27H264.9L287.5 64.9H275.4L298.1 27H317.3L286.1 79.3L290.5 67.4V97H270.7Z"
          fill="white"
        />

        {/* Animated dot (part of Z) */}
        <circle id="dot" cx="81.5" cy="12" r="9" fill="white" />
      </svg>
    </div>
  )
}
