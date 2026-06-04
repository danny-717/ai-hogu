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
}

function getTitle(score: number) {
  const percentage = (score / 600) * 100
  if (percentage >= 90) return { emoji: '🎓', name: 'AI 마스터', color: '#fbbf24' }
  if (percentage >= 75) return { emoji: '🛡️', name: 'AI 슬기로운 탐험가', color: '#3b82f6' }
  if (percentage >= 60) return { emoji: '🚪', name: 'AI 호구탈출 성공', color: '#16a34a' }
  if (percentage >= 40) return { emoji: '🤔', name: 'AI 호구 견습생', color: '#d97706' }
  return { emoji: '⚠️', name: 'AI 호구 위험군', color: '#dc2626' }
}

export default function MyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [progress, setProgress] = useState<StageProgress[]>([])

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('nickname, school, grade, class_name')
        .eq('id', session.user.id)
        .single()

      if (profileData) setProfile(profileData)

      const userProgress = await getUserProgress(session.user.id)
      setProgress(userProgress)
      setLoading(false)
    }
    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#3d2817' }}>
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">⚓</div>
          <p className="text-amber-100 font-bold">선장실 입장 중...</p>
        </div>
      </div>
    )
  }

  const totalScore = calculateTotalScore(progress)
  const title = getTitle(totalScore)

  const dungeonStats = dungeons.map(d => {
    const dungeonProgress = progress.filter(p => 
      d.stages.some(s => s.id === p.stageId)
    )
    const score = dungeonProgress.reduce((sum, p) => {
      const stage = d.stages.find(s => s.id === p.stageId)
      const isBoss = stage?.isBoss || false
      return sum + (p.stars * (isBoss ? 20 : 10))
    }, 0)
    const maxScore = d.stages.reduce((sum, s) => sum + (s.isBoss ? 60 : 30), 0)
    const cleared = dungeonProgress.filter(p => p.stars > 0).length
    const stars = dungeonProgress.reduce((sum, p) => sum + p.stars, 0)
    const maxStars = d.stages.length * 3
    const accuracy = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    
    return {
      id: d.id,
      title: d.title,
      emoji: d.emoji,
      score,
      maxScore,
      cleared,
      total: d.stages.length,
      stars,
      maxStars,
      accuracy,
    }
  })

  const startedDungeons = dungeonStats.filter(s => s.score > 0)
  const notStartedDungeons = dungeonStats.filter(s => s.score === 0)

  const strongest = startedDungeons.length > 0
    ? [...startedDungeons].sort((a, b) => b.accuracy - a.accuracy)[0]
    : null

  const weakest = startedDungeons.length > 0
    ? [...startedDungeons]
        .filter(s => s.score < s.maxScore)
        .sort((a, b) => a.accuracy - b.accuracy)[0]
    : null

  const needsLearning = notStartedDungeons.length > 0
    ? notStartedDungeons[0]
    : null

  // 던전별 컬러
  const dungeonColors: Record<number, string> = {
    1: '#a83a1f',
    2: '#1f4ea8',
    3: '#7b1fa8',
    4: '#1f8a3a',
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <div 
      className="min-h-screen pb-12 mypage-fadein"
      style={{ background: 'linear-gradient(135deg, #3d2817 0%, #5c3a17 50%, #3d2817 100%)' }}
    >
      <div className="max-w-md mx-auto px-3 pt-10">
        {/* 뒤로 가기 */}
        <button
          onClick={() => router.push('/map')}
          className="text-amber-200 hover:text-amber-100 text-sm mb-2 font-bold"
        >
          ← 모험 지도로
        </button>

        {/* 메인 헤더 - 선장 명패 */}
        <div className="relative bg-gradient-to-b from-amber-50 to-amber-100 rounded-2xl shadow-2xl border-4 border-amber-800 p-5 mb-4 text-center">
          <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>
          <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>
          <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>

          <p className="text-[10px] text-amber-700 font-black tracking-widest mb-2">⚓ CAPTAIN'S LOG ⚓</p>
          
          {/* 칭호 큰 표시 */}
          <div className="text-6xl mb-2 captain-emoji">{title.emoji}</div>
          
          <h1 className="text-2xl font-black text-amber-900 mb-1">
            {profile?.nickname} 선장
          </h1>
          
          {/* 칭호 배지 */}
          <div 
            className="inline-block px-3 py-1 rounded-full font-black text-xs mb-3 border-2"
            style={{
              background: `linear-gradient(to bottom, ${title.color}33, ${title.color}66)`,
              color: title.color,
              borderColor: title.color,
            }}
          >
            {title.name}
          </div>

          {/* 학교/학년 정보 */}
          {profile?.school && (
            <p className="text-xs text-amber-700 font-bold">
              🏫 {profile.school} {profile.grade}학년 {profile.class_name}반
            </p>
          )}

          {/* 총 점수 */}
          <div className="mt-3 pt-10 border-t-2 border-amber-300 border-dashed">
            <p className="text-xs text-amber-700 font-bold mb-1">💎 총 획득 보물</p>
            <p className="text-3xl font-black text-amber-900" style={{ textShadow: '2px 2px 0 #fbbf24' }}>
              {totalScore} <span className="text-sm">/ 600</span>
            </p>
          </div>
        </div>

        {/* 영역별 점수 */}
        <div 
          className="rounded-2xl shadow-xl border-4 border-amber-800 p-4 mb-4"
          style={{ background: 'linear-gradient(to bottom, #f5e1b8, #e8c780)' }}
        >
          <h3 className="text-sm font-black text-amber-900 mb-3 flex items-center gap-1">
            📊 영역별 항해 일지
          </h3>
          
          <div className="space-y-3">
            {dungeonStats.map(stat => (
              <div key={stat.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <span className="text-base">{stat.emoji}</span>
                    {stat.title}
                  </span>
                  <span className="text-sm font-black text-amber-900">
                    {stat.score} <span className="text-[10px] text-amber-700">/ {stat.maxScore}</span>
                  </span>
                </div>
                <div 
                  className="w-full h-2 rounded-full overflow-hidden border border-amber-800"
                  style={{ background: 'rgba(255,255,255,0.5)' }}
                >
                  <div
                    className="h-full transition-all duration-500"
                    style={{ 
                      width: `${stat.accuracy}%`,
                      background: `linear-gradient(to right, ${dungeonColors[stat.id]}aa, ${dungeonColors[stat.id]})`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-amber-700 mt-0.5 font-bold">
                  <span>🗺️ {stat.cleared} / {stat.total} 정복</span>
                  <span>⭐ {stat.stars} / {stat.maxStars}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 맞춤 분석 */}
        {(strongest || weakest || needsLearning) && (
          <div 
            className="rounded-2xl shadow-xl border-4 border-amber-800 p-4 mb-4"
            style={{ background: 'linear-gradient(to bottom, #f5e1b8, #e8c780)' }}
          >
            <h3 className="text-sm font-black text-amber-900 mb-3 flex items-center gap-1">
              🧭 선장의 항해 분석
            </h3>
            
            {strongest && strongest.accuracy > 0 && (
              <div 
                className="border-l-4 p-3 rounded-r-lg mb-2"
                style={{ 
                  background: 'rgba(134, 239, 172, 0.4)', 
                  borderColor: '#16a34a' 
                }}
              >
                <p className="text-xs text-green-800 font-black mb-1">✨ 너의 강점</p>
                <p className="text-sm text-amber-950 font-bold">
                  <span className="text-base">{strongest.emoji}</span> <span className="font-black">{strongest.title}</span>에서 강해!
                  {strongest.accuracy >= 75 && ' 진짜 잘하고 있어 🔥'}
                </p>
              </div>
            )}
            
            {weakest && (
              <div 
                className="border-l-4 p-3 rounded-r-lg mb-2"
                style={{ 
                  background: 'rgba(252, 165, 165, 0.4)', 
                  borderColor: '#dc2626' 
                }}
              >
                <p className="text-xs text-red-800 font-black mb-1">⚠️ 조심할 부분</p>
                <p className="text-sm text-amber-950 font-bold">
                  <span className="text-base">{weakest.emoji}</span> <span className="font-black">{weakest.title}</span>이 약해
                </p>
                <button
                  onClick={() => router.push(`/dungeon/${weakest.id}`)}
                  className="mt-2 text-xs text-red-700 font-black hover:underline"
                >
                  → 다시 도전하러 가기
                </button>
              </div>
            )}

            {needsLearning && (
              <div 
                className="border-l-4 p-3 rounded-r-lg"
                style={{ 
                  background: 'rgba(147, 197, 253, 0.4)', 
                  borderColor: '#2563eb' 
                }}
              >
                <p className="text-xs text-blue-800 font-black mb-1">📚 미지의 섬</p>
                <p className="text-sm text-amber-950 font-bold">
                  <span className="text-base">{needsLearning.emoji}</span> <span className="font-black">{needsLearning.title}</span> 아직 항해 안 했어
                </p>
                <p className="text-[11px] text-blue-700 mt-1 font-bold">
                  이전 섬을 정복하면 항로가 열려!
                </p>
              </div>
            )}

            {totalScore >= 600 && (
              <div 
                className="rounded-xl p-3 text-center border-4 mt-3"
                style={{ 
                  background: 'linear-gradient(to right, #fef3c7, #fde68a)',
                  borderColor: '#d97706',
                }}
              >
                <p className="text-base font-black text-amber-900">
                  🎓 완벽 정복! 🎓
                </p>
                <p className="text-xs text-amber-800 font-bold mt-1">
                  AI 호구탈출 마스터 등극!
                </p>
              </div>
            )}
          </div>
        )}

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full font-black text-sm py-3 rounded-xl border-2"
          style={{
            background: 'rgba(220, 38, 38, 0.2)',
            color: '#fecaca',
            borderColor: '#dc2626',
          }}
        >
          🚪 항해 종료 (로그아웃)
        </button>
      </div>

      <style jsx>{`
        .mypage-fadein {
          animation: mp-arrive 0.8s ease-out;
        }
        @keyframes mp-arrive {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes captain-emoji {
          0% { transform: scale(0) rotate(-180deg); }
          50% { transform: scale(1.2) rotate(10deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        .captain-emoji {
          animation: captain-emoji 0.8s ease-out;
          display: inline-block;
        }
      `}</style>
    </div>
  )
}