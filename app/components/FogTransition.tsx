'use client'

import { useEffect, useState } from 'react'

type FogTransitionProps = {
  isActive: boolean
  onComplete?: () => void
}

export default function FogTransition({ isActive, onComplete }: FogTransitionProps) {
  const [stage, setStage] = useState<'idle' | 'fadeIn' | 'hold'>('idle')

  useEffect(() => {
    if (!isActive) {
      setStage('idle')
      return
    }

    setStage('fadeIn')
    
    // 1.5초: 안개 완전히 덮음 → 닻 표시
    const t1 = setTimeout(() => setStage('hold'), 1500)
    
    // 2.0초: 닻 0.5초 보여준 후 → 페이지 이동
    // 이 시점에 화면은 완전히 어두운 상태
    const t2 = setTimeout(() => {
      onComplete?.()
    }, 2000)
    
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [isActive, onComplete])

  if (stage === 'idle') return null

  return (
    <>
      {/* 안개 레이어 */}
      <div
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{
          background: 'rgba(15, 8, 3, 0.98)',
          animation: 'fog-fadein 1.5s ease-in-out forwards',
        }}
      />

      {/* 닻 + 텍스트 */}
      <div
        className="fixed inset-0 z-[10000] pointer-events-none flex flex-col items-center justify-center"
        style={{
          animation: 'anchor-fadein 0.6s ease-in 1.4s forwards',
          opacity: 0,
        }}
      >
        <div 
          className="text-7xl"
          style={{ 
            animation: 'anchor-pulse 1.5s ease-in-out infinite',
            filter: 'drop-shadow(0 0 30px rgba(255, 200, 100, 0.8))',
          }}
        >
          ⚓
        </div>
        <p 
          className="text-amber-100 text-base font-bold mt-4 tracking-widest"
          style={{ textShadow: '0 0 15px rgba(255, 200, 100, 0.6)' }}
        >
          섬으로 상륙 중...
        </p>
      </div>

      <style jsx global>{`
        @keyframes fog-fadein {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes anchor-fadein {
          0% { opacity: 0; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes anchor-pulse {
          0%, 100% { 
            filter: drop-shadow(0 0 20px rgba(255, 200, 100, 0.6));
          }
          50% { 
            filter: drop-shadow(0 0 45px rgba(255, 220, 120, 1));
          }
        }
      `}</style>
    </>
  )
}