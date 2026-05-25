'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { dungeons } from '@/data/quizData'
import {
  getUserProgress,
  calculateDungeonProgress,
  calculateTotalScore,
  type DungeonProgress,
} from '@/lib/progress'

export default function MapPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(true)
  const [dungeonProgress, setDungeonProgress] = useState<DungeonProgress[]>([])
  const [totalScore, setTotalScore] = useState(0)

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setNickname(profile.nickname)
      }

      const progress = await getUserProgress(session.user.id)
      const dungProgress = calculateDungeonProgress(progress)
      const score = calculateTotalScore(progress)
      
      setDungeonProgress(dungProgress)
      setTotalScore(score)
      setLoading(false)
    }

    loadData()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  function handleDungeonClick(dungeonId: number, isUnlocked: boolean) {
    if (!isUnlocked) return
    router.push(`/dungeon/${dungeonId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 pb-20">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-5 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">환영해</p>
              <h1 className="text-xl font-bold text-indigo-600">
                {nickname}님 🎮
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-gray-400 hover:text-gray-700"
            >
              로그아웃
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">총점</p>
              <p className="text-2xl font-bold text-amber-500">
                {totalScore} <span className="text-sm text-gray-400">/ 600</span>
              </p>
            </div>
            <div className="text-3xl">🏆</div>
          </div>
        </div>

        <div className="mt-6 mb-3 px-2">
          <h2 className="text-lg font-bold text-gray-800">
            🗺️ 모험 지도
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            던전을 차례로 클리어하면 다음 던전이 열려
          </p>
        </div>

        <div className="space-y-3">
          {dungeons.map((dungeon, idx) => {
            const progress = dungeonProgress[idx]
            if (!progress) return null

            const percentage = progress.totalStages > 0
              ? Math.round((progress.clearedStages / progress.totalStages) * 100)
              : 0

            return (
              <button
                key={dungeon.id}
                onClick={() => handleDungeonClick(dungeon.id, progress.isUnlocked)}
                disabled={!progress.isUnlocked}
                className={`
                  w-full text-left rounded-2xl border-2 p-5 transition-all
                  ${progress.isUnlocked
                    ? `bg-white ${dungeon.borderColor} hover:shadow-lg hover:scale-[1.02] cursor-pointer`
                    : 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed'
                  }
                  ${progress.isCompleted ? 'ring-2 ring-amber-300' : ''}
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">
                      {progress.isUnlocked ? dungeon.emoji : '🔒'}
                    </div>
                    <div>
                      <h3 className={`font-bold text-lg ${progress.isUnlocked ? dungeon.color : 'text-gray-400'}`}>
                        {dungeon.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {progress.isUnlocked ? dungeon.subtitle : '이전 던전을 먼저 클리어해야 해'}
                      </p>
                    </div>
                  </div>
                  {progress.isCompleted && (
                    <div className="text-2xl">👑</div>
                  )}
                </div>

                {progress.isUnlocked && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>{progress.clearedStages} / {progress.totalStages} 클리어</span>
                      <span className="text-amber-500 font-medium">
                        ⭐ {progress.totalStars} / {progress.maxStars}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${dungeon.bgColor.replace('bg-', 'bg-').replace('-50', '-400')} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/leaderboard')}
            className="bg-white border-2 border-purple-200 rounded-xl p-4 hover:shadow-md transition-all"
          >
            <div className="text-2xl mb-1">🏅</div>
            <div className="text-sm font-bold text-purple-600">리더보드</div>
            <div className="text-xs text-gray-400">친구 순위</div>
          </button>
          <button
            onClick={() => router.push('/mypage')}
            className="bg-white border-2 border-indigo-200 rounded-xl p-4 hover:shadow-md transition-all"
          >
            <div className="text-2xl mb-1">👤</div>
            <div className="text-sm font-bold text-indigo-600">마이페이지</div>
            <div className="text-xs text-gray-400">내 정보</div>
          </button>
        </div>
      </div>
    </div>
  )
}