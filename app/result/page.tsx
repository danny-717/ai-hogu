'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStage } from '@/data/quizData'

function ResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const stageId = searchParams.get('stage') || ''
  const correct = parseInt(searchParams.get('correct') || '0')
  const total = parseInt(searchParams.get('total') || '1')
  const stars = parseInt(searchParams.get('stars') || '0')
  const bonus = parseInt(searchParams.get('bonus') || '0')

  const stageInfo = getStage(stageId)
  const [showStars, setShowStars] = useState(0)
  const [showBonus, setShowBonus] = useState(false)
  const [showButtons, setShowButtons] = useState(false)

  useEffect(() => {
    // 별 1개씩 순차적으로 보여주기
    const timers: NodeJS.Timeout[] = []
    for (let i = 1; i <= stars; i++) {
      timers.push(
        setTimeout(() => setShowStars(i), 600 + i * 400)
      )
    }
    // 보너스 점수 표시
    timers.push(
      setTimeout(() => setShowBonus(true), 600 + (stars + 1) * 400)
    )
    // 버튼 표시
    timers.push(
      setTimeout(() => setShowButtons(true), 600 + (stars + 2) * 400)
    )
    
    return () => timers.forEach(t => clearTimeout(t))
  }, [stars])

  if (!stageInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#3d2817' }}>
        <button
          onClick={() => router.push('/map')}
          className="px-4 py-2 bg-amber-700 text-yellow-100 rounded-lg font-bold"
        >
          지도로 돌아가기
        </button>
      </div>
    )
  }

  const { dungeon, stage } = stageInfo
  const accuracy = Math.round((correct / total) * 100)
  const baseScore = stars * (stage.isBoss ? 20 : 10)
  const totalScore = Math.max(0, baseScore + bonus)

  // 메시지
  let title = ''
  let message = ''
  let bigEmoji = '⚓'
  
  if (stars === 3) {
    title = '완벽한 항해!'
    message = '이 섬의 모든 보물을 찾았다!'
    bigEmoji = '👑'
  } else if (stars === 2) {
    title = '대단해!'
    message = '거의 다 왔어. 다시 도전해서 완벽 클리어!'
    bigEmoji = '🏴‍☠️'
  } else if (stars === 1) {
    title = '클리어!'
    message = '간신히 통과! 다시 도전해서 별 더 모아봐'
    bigEmoji = '⚓'
  } else {
    title = '아쉽다...'
    message = '바다에 빠질 뻔! 다시 도전해보자'
    bigEmoji = '🌊'
  }

  // 다음 스테이지 찾기
  const currentIdx = dungeon.stages.findIndex(s => s.id === stage.id)
  const nextStage = currentIdx < dungeon.stages.length - 1 
    ? dungeon.stages[currentIdx + 1] 
    : null
  const canGoNext = stars > 0 && nextStage

  const dungeonTheme = {
    1: { accent: '#a83a1f' },
    2: { accent: '#1f4ea8' },
    3: { accent: '#7b1fa8' },
    4: { accent: '#1f8a3a' },
  }[dungeon.id] || { accent: '#a83a1f' }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #3d2817 0%, #5c3a17 50%, #3d2817 100%)' }}
    >
      <div className="max-w-md w-full">
        {/* 메인 양피지 카드 */}
        <div 
          className="relative rounded-3xl shadow-2xl border-4 border-amber-800 p-6 text-center result-arrive"
          style={{ 
            background: 'linear-gradient(to bottom, #f5e1b8 0%, #e8c780 100%)',
          }}
        >
          {/* 모서리 장식 */}
          <div className="absolute -top-2 -left-2 w-5 h-5 bg-amber-900 rounded-full opacity-40"></div>
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-900 rounded-full opacity-40"></div>
          <div className="absolute -bottom-2 -left-2 w-5 h-5 bg-amber-900 rounded-full opacity-40"></div>
          <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-amber-900 rounded-full opacity-40"></div>

          {/* 상단 라벨 */}
          <p className="text-[10px] text-amber-700 font-black tracking-widest mb-3">
            ⚓ ⚓ ⚓
          </p>

          {/* 큰 이모지 */}
          <div className="text-7xl mb-3 result-emoji">
            {bigEmoji}
          </div>

          {/* 타이틀 */}
          <h1 className="text-3xl font-black text-amber-900 mb-1">
            {title}
          </h1>
          <p className="text-sm text-amber-800 font-bold italic mb-5">
            "{message}"
          </p>

          {/* 별 표시 (큰) */}
          <div className="flex justify-center gap-3 mb-5">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className={`text-6xl transition-all duration-500 ${
                  showStars >= i ? 'star-pop' : 'opacity-20 scale-50'
                }`}
                style={{
                  filter: showStars >= i 
                    ? 'drop-shadow(0 0 15px rgba(255, 200, 50, 0.8))' 
                    : 'grayscale(100%)',
                }}
              >
                ⭐
              </div>
            ))}
          </div>

          {/* 점수 박스 */}
          <div className={`transition-all duration-500 ${
            showBonus ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div 
              className="rounded-2xl p-4 mb-3 border-4 shadow-inner"
              style={{ 
                background: 'linear-gradient(to bottom, #fffbeb, #fef3c7)',
                borderColor: '#d97706',
              }}
            >
              {/* 정답률 */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b-2 border-amber-300 border-dashed">
                <span className="text-sm font-bold text-amber-900">🎯 정답률</span>
                <span className="text-xl font-black text-amber-900">
                  {correct}/{total} ({accuracy}%)
                </span>
              </div>

              {/* 기본 점수 */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-amber-800">⭐ 별점 점수</span>
                <span className="text-base font-black text-amber-900">+{baseScore}</span>
              </div>

              {/* 보너스 점수 (있을 때만) */}
              {bonus !== 0 && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-800">
                    {bonus > 0 ? '🎁 보너스' : '💀 페널티'}
                  </span>
                  <span className={`text-base font-black ${
                    bonus > 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {bonus > 0 ? '+' : ''}{bonus}
                  </span>
                </div>
              )}

              {/* 총 점수 */}
              <div className="flex items-center justify-between pt-10 mt-2 border-t-2 border-amber-700">
                <span className="text-sm font-black text-amber-900">💎 획득 보물</span>
                <span 
                  className="text-3xl font-black"
                  style={{ 
                    color: '#5c3a17',
                    textShadow: '2px 2px 0 #fbbf24',
                  }}
                >
                  {totalScore}
                </span>
              </div>
            </div>
          </div>

          {/* 버튼들 */}
          <div className={`space-y-2 transition-all duration-500 ${
            showButtons ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {canGoNext && (
              <button
                onClick={() => router.push(`/quiz/${nextStage.id}`)}
                className="w-full text-yellow-100 font-black text-base py-3 rounded-xl shadow-lg border-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                style={{
                  background: `linear-gradient(to bottom, ${dungeonTheme.accent}, ${dungeonTheme.accent}dd)`,
                  borderColor: '#451a03',
                }}
              >
                ⚔️ 다음 모험으로 →
              </button>
            )}
            
            <button
              onClick={() => router.push(`/dungeon/${dungeon.id}`)}
              className="w-full font-black text-base py-3 rounded-xl shadow-lg border-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              style={{
                background: 'linear-gradient(to bottom, #fbbf24, #d97706)',
                color: '#451a03',
                borderColor: '#451a03',
              }}
            >
              🏝️ 섬으로 돌아가기
            </button>

            <button
              onClick={() => router.push('/map')}
              className="w-full font-bold text-sm py-2.5 rounded-xl border-2 hover:scale-[1.02] transition-all"
              style={{
                background: 'rgba(255,255,255,0.5)',
                color: '#5c3a17',
                borderColor: '#8b6535',
              }}
            >
              🗺️ 모험 지도로
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes result-arrive {
          0% { opacity: 0; transform: scale(0.8) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .result-arrive {
          animation: result-arrive 0.6s ease-out;
        }
        @keyframes result-emoji {
          0% { transform: scale(0) rotate(-180deg); }
          60% { transform: scale(1.2) rotate(10deg); }
          80% { transform: scale(0.9) rotate(-5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .result-emoji {
          animation: result-emoji 0.8s ease-out;
          display: inline-block;
        }
        @keyframes star-pop {
          0% { transform: scale(0.3) rotate(-30deg); opacity: 0; }
          50% { transform: scale(1.4) rotate(10deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .star-pop {
          animation: star-pop 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#3d2817' }}>
        <div className="text-5xl animate-bounce">⚓</div>
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}