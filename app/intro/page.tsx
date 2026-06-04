'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function IntroPage() {
  const router = useRouter()
  const [showShip, setShowShip] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)
    }
    checkAuth()

    const t1 = setTimeout(() => setShowShip(true), 800)
    const t2 = setTimeout(() => setShowTitle(true), 1800)
    const t3 = setTimeout(() => setShowButton(true), 3000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  function handleStart() {
    if (isLoggedIn) {
      router.push('/map')
    } else {
      router.push('/login')
    }
  }

  return (
    <div 
      className="fixed inset-0 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #5c3a17 0%, #3d2817 40%, #1a4a5c 100%)',
      }}
    >
      {/* 별이 반짝이는 하늘 */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: 5, left: 12, size: 10, delay: 0.3, duration: 2.5 },
          { top: 8, left: 35, size: 8, delay: 1.2, duration: 2.0 },
          { top: 12, left: 78, size: 12, delay: 0.7, duration: 3.0 },
          { top: 15, left: 55, size: 7, delay: 1.5, duration: 2.2 },
          { top: 18, left: 88, size: 9, delay: 0.4, duration: 2.8 },
          { top: 22, left: 20, size: 11, delay: 1.8, duration: 1.8 },
          { top: 25, left: 65, size: 8, delay: 0.9, duration: 2.4 },
          { top: 28, left: 5, size: 10, delay: 1.3, duration: 2.7 },
          { top: 10, left: 92, size: 7, delay: 0.5, duration: 1.9 },
          { top: 30, left: 45, size: 9, delay: 1.6, duration: 2.3 },
          { top: 35, left: 75, size: 8, delay: 0.2, duration: 2.6 },
          { top: 6, left: 60, size: 11, delay: 1.0, duration: 2.1 },
          { top: 32, left: 25, size: 7, delay: 1.4, duration: 2.5 },
          { top: 20, left: 40, size: 9, delay: 0.6, duration: 2.9 },
          { top: 16, left: 8, size: 8, delay: 1.9, duration: 1.7 },
          { top: 38, left: 85, size: 10, delay: 0.8, duration: 2.3 },
          { top: 26, left: 50, size: 7, delay: 1.7, duration: 2.0 },
          { top: 14, left: 28, size: 9, delay: 0.1, duration: 2.6 },
          { top: 33, left: 95, size: 8, delay: 1.1, duration: 2.4 },
          { top: 24, left: 70, size: 11, delay: 0.4, duration: 2.2 },
        ].map((star, i) => (
          <div
            key={i}
            className="absolute text-yellow-200 star-twinkle"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              fontSize: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          >
            ✦
          </div>
        ))}
      </div>

      {/* SOS 팻말 */}
      <div 
        className="absolute left-2 z-30 sos-tag"
        style={{ top: '8%' }}
      >
        <div 
          className="px-4 py-2 rounded-lg border-4 shadow-2xl"
          style={{
            background: 'linear-gradient(to bottom, #ef4444, #991b1b)',
            borderColor: '#450a0a',
            boxShadow: '3px 4px 0 rgba(0,0,0,0.5)',
          }}
        >
          <p className="text-sm text-yellow-100 font-black tracking-wider whitespace-nowrap" style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.5)' }}>
            🚨 청소년 SOS
          </p>
          <p className="text-[10px] text-yellow-200 font-bold text-center whitespace-nowrap">
            생명안전 프로젝트
          </p>
        </div>
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-xl">
          📌
        </div>
      </div>

      {/* 달 */}
      <div 
        className="absolute right-8 text-6xl moon-glow opacity-80"
        style={{ top: '10%' }}
      >
        🌙
      </div>

      {/* 건너뛰기 버튼 */}
      <button
        onClick={handleStart}
        className="absolute right-8 text-amber-200 text-xs font-bold opacity-60 hover:opacity-100 z-30"
        style={{ top: '8%' }}
      >
        건너뛰기 →
      </button>

      {/* 메인 콘텐츠 (배 + 타이틀) */}
      <div 
        className="absolute left-0 right-0 flex flex-col items-center px-6 z-10"
        style={{ top: '45%', transform: 'translateY(-50%)' }}
      >
        {/* 배 등장 */}
        <div 
          className={`relative mb-6 transition-all duration-1000 ${
            showShip ? 'ship-sail opacity-100' : 'opacity-0 -translate-x-96'
          }`}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl flag-wave">
            🏴‍☠️
          </div>
          <div className="text-7xl">
            ⛵
          </div>
        </div>

        {/* 타이틀 */}
        <div 
          className={`text-center transition-all duration-700 ${
            showTitle ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
          }`}
        >
          <div className="flex items-center justify-center gap-6 mb-2">
            <span className="text-2xl anchor-swing">⚓</span>
            <h1 
              className="text-5xl sm:text-7xl font-black whitespace-nowrap"
              style={{ 
                color: '#fbbf24',
                textShadow: '3px 3px 0 #5c3a17, 6px 6px 12px rgba(0,0,0,0.5)',
                letterSpacing: '1px',
              }}
            >
              AI 호구탈출
            </h1>
            <span className="text-2xl anchor-swing" style={{ animationDelay: '0.3s' }}>⚓</span>
          </div>
          <p 
            className="text-amber-100 text-sm sm:text-lg font-bold italic mt-3"
            style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}
          >
            "보물섬을 항해하는 해적들의 모험"
          </p>
        </div>
      </div>

      {/* 모험 시작 버튼 */}
      {showButton && (
        <div 
          className="absolute left-0 right-0 flex justify-center z-30"
          style={{ bottom: '22%' }}
        >
          <button
            onClick={handleStart}
            className="button-burst px-10 py-4 rounded-2xl font-black text-xl border-4 shadow-2xl active:scale-95"
            style={{
              background: 'linear-gradient(to bottom, #fbbf24, #d97706)',
              color: '#451a03',
              borderColor: '#451a03',
              boxShadow: '0 6px 0 #451a03, 0 10px 20px rgba(0,0,0,0.3)',
            }}
          >
            🏴‍☠️ 모험 시작!
          </button>
        </div>
      )}

      {/* 파도 (하단) - 간격 넓힘 */}
      <div className="absolute bottom-0 left-0 right-0 h-44 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, #1e3a5f 30%, #0f2942 100%)',
          }}
        ></div>
        {/* 뒤 파도 (어두움, 위쪽) */}
        <div className="absolute bottom-14 left-0 right-0 text-3xl opacity-40 wave-back whitespace-nowrap">
          🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊
        </div>
        {/* 중간 파도 */}
        <div className="absolute bottom-7 left-0 right-0 text-4xl opacity-70 wave-mid whitespace-nowrap">
          🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊
        </div>
        {/* 앞 파도 (밝음, 가장 아래) */}
        <div className="absolute -bottom-1 left-0 right-0 text-5xl opacity-90 wave-front whitespace-nowrap">
          🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊🌊
        </div>
      </div>

      <style jsx>{`
        @keyframes ship-sail {
          0% { transform: translateX(-300px) rotate(-5deg); }
          60% { transform: translateX(20px) rotate(3deg); }
          80% { transform: translateX(-10px) rotate(-2deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        .ship-sail {
          animation: ship-sail 1.5s ease-out forwards, ship-rock 3s ease-in-out infinite 1.5s;
        }
        @keyframes ship-rock {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes anchor-swing {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(10deg); }
        }
        .anchor-swing {
          animation: anchor-swing 2s ease-in-out infinite;
          display: inline-block;
        }
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        .star-twinkle {
          animation: star-twinkle 2s ease-in-out infinite;
        }
        @keyframes moon-glow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(255, 220, 100, 0.6)); }
          50% { filter: drop-shadow(0 0 30px rgba(255, 220, 100, 0.9)); }
        }
        .moon-glow {
          animation: moon-glow 3s ease-in-out infinite;
        }
        @keyframes button-burst {
          0% { opacity: 0; transform: scale(0) rotate(-720deg); }
          60% { opacity: 1; transform: scale(1.3) rotate(20deg); }
          75% { transform: scale(0.9) rotate(-10deg); }
          85% { transform: scale(1.1) rotate(5deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes button-idle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .button-burst {
          animation: button-burst 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, button-idle 1.5s ease-in-out infinite 1.2s;
        }
        @keyframes wave-front {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-15px, -8px); }
          50% { transform: translate(-15px, 0); }
          75% { transform: translate(0, -5px); }
        }
        @keyframes wave-mid {
          0%, 100% { transform: translate(-10px, 0); }
          25% { transform: translate(0, 5px); }
          50% { transform: translate(10px, 0); }
          75% { transform: translate(0, -3px); }
        }
        @keyframes wave-back {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, -3px); }
        }
        @keyframes flag-wave {
          0%, 100% { transform: rotate(-5deg) translateX(0); }
          50% { transform: rotate(8deg) translateX(2px); }
        }
        .flag-wave {
          animation: flag-wave 1s ease-in-out infinite;
        }
        @keyframes sos-tag {
          0%, 100% { transform: rotate(-12deg) translateY(0); }
          50% { transform: rotate(-10deg) translateY(-2px); }
        }
        .sos-tag {
          animation: sos-tag 2s ease-in-out infinite;
        }
        .wave-front { animation: wave-front 2.5s ease-in-out infinite; }
        .wave-mid { animation: wave-mid 3s ease-in-out infinite; }
        .wave-back { animation: wave-back 4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}