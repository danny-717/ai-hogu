'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getStage, getDungeon } from '@/data/quizData'

function ResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const stageId = searchParams.get('stage') || ''
  const correctCount = parseInt(searchParams.get('correct') || '0')
  const totalCount = parseInt(searchParams.get('total') || '1')
  const stars = parseInt(searchParams.get('stars') || '0')
  
  const stageInfo = getStage(stageId)
  
  const [showStars, setShowStars] = useState(0)

  useEffect(() => {
    if (stars > 0) {
      const timer1 = setTimeout(() => setShowStars(1), 500)
      const timer2 = setTimeout(() => setShowStars(2), 1000)
      const timer3 = setTimeout(() => setShowStars(3), 1500)
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
      }
    }
  }, [stars])

  if (!stageInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">정보를 찾을 수 없어</p>
      </div>
    )
  }

  const { dungeon, stage } = stageInfo
  const accuracy = Math.round((correctCount / totalCount) * 100)
  
  const currentStageIndex = dungeon.stages.findIndex(s => s.id === stage.id)
  const nextStage = dungeon.stages[currentStageIndex + 1]
  const isDungeonComplete = currentStageIndex === dungeon.stages.length - 1
  const nextDungeon = getDungeon(dungeon.id + 1)

  let titleMessage = ''
  let emoji = ''
  let messageColor = ''
  
  if (stars === 3) {
    titleMessage = '완벽해!'
    emoji = '🏆'
    messageColor = 'text-amber-500'
  } else if (stars === 2) {
    titleMessage = '잘했어!'
    emoji = '🎉'
    messageColor = 'text-green-500'
  } else if (stars === 1) {
    titleMessage = '클리어!'
    emoji = '👏'
    messageColor = 'text-blue-500'
  } else {
    titleMessage = '아쉽다!'
    emoji = '😅'
    messageColor = 'text-gray-500'
  }

  const earnedScore = stars > 0 
    ? (stage.isBoss ? stars * 20 : stars * 10)
    : 0

  return (
    <div className={`min-h-screen ${dungeon.bgColor} flex items-center justify-center p-4`}>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-6xl mb-3">{emoji}</div>
          <h1 className={`text-3xl font-bold mb-2 ${messageColor}`}>
            {titleMessage}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {stage.title} {stage.isBoss && '👹'}
          </p>

          {stars > 0 && (
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`text-5xl transition-all duration-500 ${
                    showStars >= s
                      ? stars >= s
                        ? 'opacity-100 scale-100'
                        : 'opacity-30 scale-90'
                      : 'opacity-0 scale-50'
                  }`}
                >
                  ⭐
                </div>
              ))}
            </div>
          )}

          <div className="bg-gray-50 rounded-2xl p-5 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">정답률</p>
                <p className="text-2xl font-bold text-gray-800">{accuracy}%</p>
                <p className="text-xs text-gray-400 mt-1">
                  {correctCount} / {totalCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">획득 점수</p>
                <p className="text-2xl font-bold text-amber-500">
                  +{earnedScore}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {stage.isBoss ? '보스 ⭐ × 20' : '일반 ⭐ × 10'}
                </p>
              </div>
            </div>
          </div>

          {stars === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 text-sm text-amber-800">
              💪 정답률 50% 이상이어야 클리어돼. 다시 도전해보자!
            </div>
          )}

          {stars > 0 && stars < 3 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-6 text-sm text-indigo-700">
              ⭐ 다시 도전해서 만점에 도전해봐!
            </div>
          )}

          {stars === 3 && isDungeonComplete && nextDungeon && (
            <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-amber-800 mb-1">
                🎊 던전 클리어!
              </p>
              <p className="text-xs text-amber-700">
                다음 던전이 열렸어 → {nextDungeon.emoji} {nextDungeon.title}
              </p>
            </div>
          )}

          {stars === 3 && isDungeonComplete && !nextDungeon && (
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-xl p-4 mb-6">
              <p className="text-sm font-bold text-purple-800 mb-1">
                🎓 모든 던전 클리어!
              </p>
              <p className="text-xs text-purple-700">
                축하해! AI 호구탈출 완전 마스터!
              </p>
            </div>
          )}

          <div className="space-y-2">
            {stars === 0 ? (
              <button
                onClick={() => router.push(`/quiz/${stage.id}`)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                🔄 다시 도전!
              </button>
            ) : nextStage ? (
              <button
                onClick={() => router.push(`/quiz/${nextStage.id}`)}
                className={`w-full text-white font-bold py-3 rounded-xl transition-colors ${
                  dungeon.id === 1 ? 'bg-red-500 hover:bg-red-600' :
                  dungeon.id === 2 ? 'bg-blue-500 hover:bg-blue-600' :
                  dungeon.id === 3 ? 'bg-purple-500 hover:bg-purple-600' :
                  'bg-green-500 hover:bg-green-600'
                }`}
              >
                ➡️ 다음 스테이지로
              </button>
            ) : null}

            <button
              onClick={() => router.push(`/dungeon/${dungeon.id}`)}
              className="w-full bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-bold py-3 rounded-xl transition-colors"
            >
              🗺️ 던전으로 돌아가기
            </button>

            <button
              onClick={() => router.push('/map')}
              className="w-full text-gray-500 hover:text-gray-700 text-sm py-2"
            >
              모험 지도로
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">결과 불러오는 중...</p>
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}