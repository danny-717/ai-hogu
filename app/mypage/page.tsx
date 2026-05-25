'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { dungeons } from '@/data/quizData'
import { getUserProgress, calculateTotalScore, type StageProgress } from '@/lib/progress'

type Profile = {
  nickname: string
  school: string | null
  grade: string | null
  class_name: string | null
  created_at: string
}

type DungeonStat = {
  id: number
  title: string
  emoji: string
  color: string
  score: number
  maxScore: number
  stars: number
  maxStars: number
  cleared: number
  total: number
  accuracy: number
}

type Title = {
  emoji: string
  name: string
  message: string
  color: string
}

function getTitle(score: number): Title {
  const percentage = (score / 600) * 100
  
  if (percentage >= 90) return {
    emoji: '🎓',
    name: 'AI 마스터',
    message: 'AI를 완벽하게 다루는 사람! 친구들한테도 알려줘',
    color: 'from-amber-400 to-yellow-500',
  }
  if (percentage >= 75) return {
    emoji: '🛡️',
    name: 'AI 슬기로운 탐험가',
    message: '거의 다 와따! 조금만 더 다듬으면 완벽',
    color: 'from-purple-400 to-indigo-500',
  }
  if (percentage >= 60) return {
    emoji: '🚪',
    name: 'AI 호구탈출 성공',
    message: '기본은 잡았어! 약한 부분만 보완하자',
    color: 'from-green-400 to-emerald-500',
  }
  if (percentage >= 40) return {
    emoji: '🤔',
    name: 'AI 호구 견습생',
    message: '위험해! 더 배우자',
    color: 'from-blue-400 to-cyan-500',
  }
  return {
    emoji: '⚠️',
    name: 'AI 호구 위험군',
    message: '큰일 났다! AI 쓰기 전에 다시 공부하자',
    color: 'from-gray-400 to-gray-500',
  }
}

export default function MyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [totalStars, setTotalStars] = useState(0)
  const [totalCleared, setTotalCleared] = useState(0)
  const [dungeonStats, setDungeonStats] = useState<DungeonStat[]>([])
  const [correctRate, setCorrectRate] = useState(0)

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.replace('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('nickname, school, grade, class_name, created_at')
        .eq('id', session.user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }

      const progress = await getUserProgress(session.user.id)
      const score = calculateTotalScore(progress)
      setTotalScore(score)

      const allStars = progress.reduce((sum, p) => sum + p.stars, 0)
      setTotalStars(allStars)
      setTotalCleared(progress.filter(p => p.stars > 0).length)

      const stats: DungeonStat[] = dungeons.map(dungeon => {
        const dungeonProgress = progress.filter(p =>
          dungeon.stages.some(s => s.id === p.stageId)
        )
        
        let dungeonScore = 0
        let dungeonStars = 0
        let dungeonMaxScore = 0
        let dungeonMaxStars = 0
        
        dungeon.stages.forEach(stage => {
          const sp = dungeonProgress.find(p => p.stageId === stage.id)
          const multiplier = stage.isBoss ? 20 : 10
          dungeonMaxScore += 3 * multiplier
          dungeonMaxStars += 3
          if (sp) {
            dungeonScore += sp.stars * multiplier
            dungeonStars += sp.stars
          }
        })

        return {
          id: dungeon.id,
          title: dungeon.title,
          emoji: dungeon.emoji,
          color: dungeon.color,
          score: dungeonScore,
          maxScore: dungeonMaxScore,
          stars: dungeonStars,
          maxStars: dungeonMaxStars,
          cleared: dungeonProgress.filter(p => p.stars > 0).length,
          total: dungeon.stages.length,
          accuracy: dungeonMaxScore > 0 ? (dungeonScore / dungeonMaxScore) * 100 : 0,
        }
      })
      setDungeonStats(stats)

      const { data: quizData } = await supabase
        .from('quiz_results')
        .select('is_correct')
        .eq('user_id', session.user.id)

      if (quizData && quizData.length > 0) {
        const correct = quizData.filter(q => q.is_correct).length
        setCorrectRate(Math.round((correct / quizData.length) * 100))
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">프로필을 불러올 수 없어</p>
      </div>
    )
  }

  const title = getTitle(totalScore)
  const joinDate = new Date(profile.created_at).toLocaleDateString('ko-KR')
  
  const strongest = [...dungeonStats].sort((a, b) => b.accuracy - a.accuracy)[0]
  const weakest = [...dungeonStats]
    .filter(s => s.score < s.maxScore)
    .sort((a, b) => a.accuracy - b.accuracy)[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 pb-12">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.push('/map')}
          className="text-sm text-gray-600 hover:text-gray-800 mb-3 flex items-center gap-1"
        >
          ← 모험 지도로
        </button>

        <div className={`bg-gradient-to-br ${title.color} rounded-2xl shadow-lg p-6 mb-4 text-white`}>
          <div className="text-center">
            <div className="text-5xl mb-2">{title.emoji}</div>
            <p className="text-xs opacity-80 mb-1">현재 칭호</p>
            <h1 className="text-2xl font-bold mb-2">{title.name}</h1>
            <p className="text-xs opacity-90">{title.message}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{profile.nickname}</h2>
              <p className="text-xs text-gray-500">
                {profile.school} 
                {profile.grade && ` · ${profile.grade}학년`}
                {profile.class_name && ` ${profile.class_name}반`}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">가입일: {joinDate}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="text-2xl mb-1">🏆</div>
            <p className="text-xl font-bold text-amber-500">{totalScore}</p>
            <p className="text-xs text-gray-500">점</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="text-2xl mb-1">⭐</div>
            <p className="text-xl font-bold text-yellow-500">{totalStars}</p>
            <p className="text-xs text-gray-500">/ 48 별</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="text-2xl mb-1">🎯</div>
            <p className="text-xl font-bold text-green-500">{correctRate}%</p>
            <p className="text-xs text-gray-500">정답률</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            📊 영역별 점수
          </h3>
          <div className="space-y-3">
            {dungeonStats.map(stat => (
              <div key={stat.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{stat.emoji}</span>
                    <span className="text-sm font-bold text-gray-700">
                      {stat.title}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-indigo-600">
                      {stat.score}
                    </span>
                    <span className="text-xs text-gray-400"> / {stat.maxScore}</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all bg-gradient-to-r ${
                      stat.id === 1 ? 'from-red-300 to-red-500' :
                      stat.id === 2 ? 'from-blue-300 to-blue-500' :
                      stat.id === 3 ? 'from-purple-300 to-purple-500' :
                      'from-green-300 to-green-500'
                    }`}
                    style={{ width: `${stat.accuracy}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                  <span>{stat.cleared}/{stat.total} 클리어</span>
                  <span>⭐ {stat.stars}/{stat.maxStars}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {(strongest.score > 0 || weakest) && (
          <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
            <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              💡 맞춤 분석
            </h3>
            
            {strongest.score > 0 && (
              <div className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r-lg mb-3">
                <p className="text-xs text-green-700 font-bold mb-1">✨ 잘하는 부분</p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{strongest.emoji} {strongest.title}</span>에서 강해!
                  {strongest.accuracy >= 75 && ' 진짜 잘하고 있어 🔥'}
                </p>
              </div>
            )}
            
            {weakest && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg mb-3">
                <p className="text-xs text-amber-700 font-bold mb-1">⚠️ 조심할 부분</p>
                <p className="text-sm text-gray-700">
                  <span className="font-bold">{weakest.emoji} {weakest.title}</span>이 약해
                </p>
                <button
                  onClick={() => router.push(`/dungeon/${weakest.id}`)}
                  className="mt-2 text-xs text-amber-700 font-bold hover:underline"
                >
                  → 다시 도전하러 가기
                </button>
              </div>
            )}

            {totalScore >= 600 && (
              <div className="bg-gradient-to-r from-amber-100 to-yellow-100 border-2 border-amber-300 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-amber-800">
                  🎓 완벽 클리어! 🎓
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  AI 호구탈출 마스터 등극!
                </p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={async () => {
            await supabase.auth.signOut()
            router.replace('/login')
          }}
          className="w-full bg-white border-2 border-gray-200 hover:border-red-300 text-gray-500 hover:text-red-500 font-medium py-3 rounded-xl transition-colors text-sm"
        >
          로그아웃
        </button>
      </div>
    </div>
  )
}