'use client'

import { useEffect, useState } from 'react'

interface ChestTransitionProps {
  onComplete: () => void
}

export default function ChestTransition({ onComplete }: ChestTransitionProps) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100)   // 상자 등장 (쿵!)
    const t2 = setTimeout(() => setPhase(2), 800)   // 상자 흔들림
    const t3 = setTimeout(() => setPhase(3), 1400)  // 활짝! 빛 + 보석
    const t4 = setTimeout(() => onComplete(), 2200) // 결과 화면 이동
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(40, 25, 10, 0.9)', backdropFilter: 'blur(3px)' }}
    >
      <div className="relative flex flex-col items-center">
        {/* 빛 폭발 (열릴 때) */}
        {phase >= 3 && (
          <div
            className="absolute rounded-full"
            style={{
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.7) 0%, rgba(251, 191, 36, 0.2) 40%, transparent 70%)',
              animation: 'chest-burst 0.8s ease-out',
            }}
          />
        )}

        {/* 튀어나오는 보석들 */}
        {phase >= 3 && (
          <>
            <span className="absolute text-3xl" style={{ animation: 'gem-fly-1 0.8s ease-out forwards' }}>💎</span>
            <span className="absolute text-2xl" style={{ animation: 'gem-fly-2 0.8s ease-out forwards' }}>🪙</span>
            <span className="absolute text-3xl" style={{ animation: 'gem-fly-3 0.8s ease-out forwards' }}>👑</span>
            <span className="absolute text-2xl" style={{ animation: 'gem-fly-4 0.8s ease-out forwards' }}>💰</span>
            <span className="absolute text-2xl" style={{ animation: 'gem-fly-5 0.8s ease-out forwards' }}>✨</span>
          </>
        )}

        {/* 보물상자 */}
        <div
          className="text-8xl relative z-10"
          style={{
            transform: phase >= 1 ? 'scale(1)' : 'scale(0)',
            transition: 'transform 0.5s cubic-bezier(0.34, 1.8, 0.64, 1)',
            animation: phase === 2 ? 'chest-shake 0.5s ease-in-out infinite' : 'none',
          }}
        >
          {phase >= 3 ? '🏆' : '🧰'}
        </div>

        {/* 텍스트 */}
        <div
          className="mt-4 text-yellow-200 font-black text-xl z-10"
          style={{
            opacity: phase >= 3 ? 1 : 0,
            transform: phase >= 3 ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.4s ease-out',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          ⚓ 전리품을 확인하라! ⚓
        </div>

        {/* 흔들릴 때 텍스트 */}
        {phase === 2 && (
          <div className="mt-4 text-amber-200 font-bold text-sm z-10 animate-pulse">
            상자 안에 뭐가 들었을까...?
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes chest-shake {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.05) rotate(-5deg); }
          75% { transform: scale(1.05) rotate(5deg); }
        }
        @keyframes chest-burst {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0.6; }
        }
        @keyframes gem-fly-1 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(-80px, -90px) scale(1); opacity: 0.9; }
        }
        @keyframes gem-fly-2 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(70px, -100px) scale(1); opacity: 0.9; }
        }
        @keyframes gem-fly-3 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(0, -120px) scale(1); opacity: 0.9; }
        }
        @keyframes gem-fly-4 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(-100px, -40px) scale(1); opacity: 0.9; }
        }
        @keyframes gem-fly-5 {
          0% { transform: translate(0, 0) scale(0); opacity: 1; }
          100% { transform: translate(100px, -50px) scale(1); opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}