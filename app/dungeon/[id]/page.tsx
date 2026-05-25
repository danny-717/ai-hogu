'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getDungeon, type Stage } from '@/data/quizData'
import { getUserProgress, type StageProgress } from '@/lib/progress'

export default function DungeonPage() {
  const router = useRouter()
  const params = useParams()
  const dungeonId = parseInt(params.id as string)
  const dungeon = getDungeon(dungeonId)

  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState<StageProgress[]>([])

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.replace('/login')
        return
      }

      const userProgress = await getUserProgress(session.user.id)
      setProgress(userProgress)
      setLoading(false)
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    )
  }

  if (!dungeon) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-700 mb-4">존재하지 않는 던전이야</p>
          <button
            onClick={() => router.push('/map')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            맵으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  function getStageStatus(stage: Stage, index: number) {
    const stageProgress = progress.find(p => p.stageId === stage.id)
    const stars = stageProgress?.stars || 0
    const cleared = stars > 0

    let unlocked = false
    if (index === 0) {
      unlocked = true
    } else {
      const prevStage = dungeon!.stages[index - 1]
      const prevProgress = progress.find(p => p.stageId === prevStage.id)
      unlocked = (prevProgress?.stars || 0) > 0
    }

    return { stars, cleared, unlocked, isCurrent: unlocked && !cleared }
  }

  const totalCleared = dungeon.stages.filter(s =>
    progress.find(p => p.stageId === s.id && p.stars > 0)
  ).length

  const stagePositions = [
    { side: 'left', y: 60 },
    { side: 'right', y: 200 },
    { side: 'left', y: 340 },
    { side: 'center', y: 480 },
  ]

  function handleStageClick(stage: Stage, status: ReturnType<typeof getStageStatus>) {
    if (!status.unlocked) return
    router.push(`/quiz/${stage.id}`)
  }

  return (
    <div className={`min-h-screen ${dungeon.bgColor} pb-12`}>
      <div className="max-w-md mx-auto px-4 pt-4">
        <button
          onClick={() => router.push('/map')}
          className="text-sm text-gray-600 hover:text-gray-800 mb-3 flex items-center gap-1"
        >
          ← 모험 지도로
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6 border-2 border-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="text-5xl">{dungeon.emoji}</div>
            <div className="flex-1">
              <h1 className={`text-2xl font-bold ${dungeon.color}`}>
                {dungeon.title}
              </h1>
              <p className="text-xs text-gray-500 mt-1">{dungeon.subtitle}</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span className="font-medium">진행 상황</span>
              <span>{totalCleared} / {dungeon.stages.length} 클리어</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all bg-gradient-to-r ${
                  dungeon.id === 1 ? 'from-red-300 to-red-500' :
                  dungeon.id === 2 ? 'from-blue-300 to-blue-500' :
                  dungeon.id === 3 ? 'from-purple-300 to-purple-500' :
                  'from-green-300 to-green-500'
                }`}
                style={{ width: `${(totalCleared / dungeon.stages.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="relative" style={{ height: `${(dungeon.stages.length * 140) + 60}px` }}>
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="none"
            viewBox="0 0 400 600"
          >
            <path
              d="M 80 80 Q 320 140, 320 220 T 80 360 Q 80 440, 200 480"
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="4"
              strokeDasharray="8 8"
              fill="none"
              strokeLinecap="round"
            />
          </svg>

          {dungeon.stages.map((stage, index) => {
            const status = getStageStatus(stage, index)
            const pos = stagePositions[index] || stagePositions[0]
            
            let leftPosition = '50%'
            let translateX = '-50%'
            if (pos.side === 'left') {
              leftPosition = '20%'
              translateX = '-50%'
            } else if (pos.side === 'right') {
              leftPosition = '80%'
              translateX = '-50%'
            }

            return (
              <div
                key={stage.id}
                className="absolute"
                style={{
                  left: leftPosition,
                  top: `${index * 140 + 20}px`,
                  transform: `translateX(${translateX})`,
                }}
              >
                <button
                  onClick={() => handleStageClick(stage, status)}
                  disabled={!status.unlocked}
                  className={`
                    relative flex flex-col items-center transition-all
                    ${status.unlocked ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                  `}
                >
                  {status.isCurrent && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap animate-bounce">
                      지금 여기!
                    </div>
                  )}

                  <div
                    className={`
                      ${stage.isBoss ? 'w-24 h-24' : 'w-20 h-20'} 
                      rounded-full flex items-center justify-center text-3xl font-bold border-4
                      ${status.cleared
                        ? stage.isBoss
                          ? 'bg-amber-400 border-amber-600 text-white'
                          : 'bg-green-400 border-green-600 text-white'
                        : status.unlocked
                          ? stage.isBoss
                            ? 'bg-red-400 border-red-600 text-white ring-4 ring-red-200'
                            : 'bg-indigo-400 border-indigo-600 text-white ring-4 ring-indigo-200'
                          : 'bg-gray-300 border-gray-400 text-gray-500'
                      }
                    `}
                  >
                    {!status.unlocked ? '🔒' : stage.isBoss ? '👹' : index + 1}
                  </div>

                  <div className="mt-2 text-center">
                    <p className={`text-xs font-bold max-w-[100px] ${status.unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                      {stage.title}
                    </p>
                    {status.cleared && (
                      <div className="flex justify-center gap-0.5 mt-1">
                        {[1, 2, 3].map(s => (
                          <span key={s} className={status.stars >= s ? 'text-amber-400' : 'text-gray-300'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}