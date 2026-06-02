'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { dungeons } from '@/data/quizData'
import { getUserProgress, calculateTotalScore, type StageProgress } from '@/lib/progress'
import FogTransition from '@/app/components/FogTransition'

type Profile = {
  nickname: string
}

function getTitle(score: number) {
  const percentage = (score / 600) * 100
  if (percentage >= 90) return { emoji: '🎓', name: 'AI 마스터' }
  if (percentage >= 75) return { emoji: '🛡️', name: 'AI 슬기로운 탐험가' }
  if (percentage >= 60) return { emoji: '🚪', name: 'AI 호구탈출 성공' }
  if (percentage >= 40) return { emoji: '🤔', name: 'AI 호구 견습생' }
  return { emoji: '⚠️', name: 'AI 호구 위험군' }
}

export default function MapPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [progress, setProgress] = useState<StageProgress[]>([])
  const [totalScore, setTotalScore] = useState(0)
  const [transitionActive, setTransitionActive] = useState(false)
  const [pendingDungeonId, setPendingDungeonId] = useState<number | null>(null)

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', session.user.id)
        .single()
      if (profileData) setProfile(profileData)
      const userProgress = await getUserProgress(session.user.id)
      setProgress(userProgress)
      setTotalScore(calculateTotalScore(userProgress))
      setLoading(false)
    }
    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-900">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🏴‍☠️</div>
          <p className="text-amber-100 font-bold">지도를 펼치는 중...</p>
        </div>
      </div>
    )
  }

  const dungeonStatuses = dungeons.map(d => {
    const cleared = d.stages.filter(s => 
      progress.find(p => p.stageId === s.id && p.stars > 0)
    ).length
    const total = d.stages.length
    const stars = d.stages.reduce((sum, s) => {
      const sp = progress.find(p => p.stageId === s.id)
      return sum + (sp?.stars || 0)
    }, 0)
    const isFullyCleared = cleared === total
    return { dungeon: d, cleared, total, stars, isFullyCleared }
  })

  const unlockedStatus = dungeonStatuses.map((s, idx) => {
    if (idx === 0) return true
    return dungeonStatuses[idx - 1].isFullyCleared
  })

  const currentDungeonIdx = dungeonStatuses.findIndex((s, idx) => 
    unlockedStatus[idx] && !s.isFullyCleared
  )

  const title = getTitle(totalScore)

  const islands = [
    { x: 27, y: 30, name: 'dragon' },
    { x: 73, y: 32, name: 'castle' },
    { x: 25, y: 67, name: 'temple' },
    { x: 73, y: 65, name: 'crown' },
  ]

  const lockStyles = ['mist', 'gray', 'storm', 'mist']

  function handleTransitionComplete() {
    if (pendingDungeonId !== null) {
      router.push(`/dungeon/${pendingDungeonId}`)
    }
  }

  return (
    <div 
      className="min-h-screen pb-12"
      style={{ background: 'linear-gradient(135deg, #3d2817 0%, #5c3a17 50%, #3d2817 100%)' }}
    >
      <div className="max-w-md mx-auto px-3 pt-3">
        {/* 상단 헤더 - 양피지 카드 */}
        <div className="relative bg-gradient-to-b from-amber-50 to-amber-100 rounded-2xl shadow-2xl border-4 border-amber-800 p-4 mb-4">
          <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>
          <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>
          <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-amber-700 font-bold tracking-widest">⚓ HAIJEOK CREW ⚓</p>
              <h1 className="text-xl font-black text-amber-900 mt-0.5">
                {profile?.nickname || '해적'} 선장!
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm">{title.emoji}</span>
                <span className="text-[11px] font-bold text-amber-800">{title.name}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-b from-amber-700 to-amber-900 text-yellow-100 rounded-lg px-3 py-1.5 shadow-md">
                <p className="text-[9px] font-bold opacity-80">💎 보물</p>
                <p className="text-xl font-black">{totalScore}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 보물섬 지도 */}
        <div 
          className="relative w-full rounded-2xl shadow-2xl overflow-hidden"
          style={{ 
            aspectRatio: '1 / 1',
            backgroundImage: 'url(/treasure-map-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            boxShadow: 'inset 0 0 40px 25px #3d2817, 0 10px 40px rgba(0,0,0,0.4)',
          }}
        >
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <radialGradient id="glowGrad">
                <stop offset="0%" stopColor="rgba(255, 220, 50, 0.6)" />
                <stop offset="50%" stopColor="rgba(255, 200, 50, 0.3)" />
                <stop offset="100%" stopColor="rgba(255, 200, 50, 0)" />
              </radialGradient>
            </defs>

            {currentDungeonIdx !== -1 && (
              <circle
                cx={islands[currentDungeonIdx].x}
                cy={islands[currentDungeonIdx].y}
                r="12"
                fill="url(#glowGrad)"
                className="glow-pulse"
              />
            )}

            {dungeonStatuses.map((status, idx) => {
              if (idx === 0) return null
              if (!unlockedStatus[idx]) return null
              const prev = islands[idx - 1]
              const curr = islands[idx]
              const midX = (prev.x + curr.x) / 2
              const midY = (prev.y + curr.y) / 2 - 3
              return (
                <path
                  key={`path-${idx}`}
                  d={`M ${prev.x} ${prev.y} Q ${midX} ${midY} ${curr.x} ${curr.y}`}
                  stroke="#8b1f1f"
                  strokeWidth="0.6"
                  strokeDasharray="1.5 1"
                  fill="none"
                  opacity="0.85"
                />
              )
            })}
          </svg>

          {dungeonStatuses.map((status, idx) => {
            const island = islands[idx]
            const unlocked = unlockedStatus[idx]
            const lockStyle = lockStyles[idx]
            const isCurrent = idx === currentDungeonIdx
            const { dungeon } = status

            return (
              <div
                key={`overlay-${dungeon.id}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${island.x}%`, top: `${island.y}%` }}
              >
                <button
                  onClick={() => {
                    if (!unlocked) return
                    setPendingDungeonId(dungeon.id)
                    setTransitionActive(true)
                  }}
                  disabled={!unlocked}
                  className={`
                    relative flex flex-col items-center
                    ${unlocked ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                    transition-transform duration-200
                  `}
                  style={{ width: '70px', height: '70px' }}
                >
                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`
                        w-16 h-16 rounded-full flex items-center justify-center
                        ${lockStyle === 'mist' ? 'bg-slate-300/70 backdrop-blur-[2px]' :
                          lockStyle === 'gray' ? 'bg-gray-600/60' :
                          'bg-indigo-900/60'}
                      `}>
                        {lockStyle === 'mist' && <span className="text-3xl">🌫️</span>}
                        {lockStyle === 'gray' && <span className="text-2xl">🔒</span>}
                        {lockStyle === 'storm' && <span className="text-3xl">⛈️</span>}
                      </div>
                    </div>
                  )}

                  {unlocked && (
                    <div 
                      className="text-4xl"
                      style={{ filter: 'drop-shadow(2px 2px 0 rgba(60,40,15,0.6))' }}
                    >
                      {dungeon.emoji}
                    </div>
                  )}

                  <div 
                    className={`
                      absolute left-1/2 -translate-x-1/2 -bottom-5
                      px-2.5 py-1 whitespace-nowrap
                      ${unlocked ? 'text-amber-900' : 'text-gray-700'}
                    `}
                    style={{
                      background: unlocked 
                        ? 'linear-gradient(to bottom, #f5e1b8 0%, #e8c780 100%)'
                        : 'linear-gradient(to bottom, #c0c0c0 0%, #a0a0a0 100%)',
                      borderTop: unlocked ? '1px solid #8b6535' : '1px solid #707070',
                      borderBottom: unlocked ? '1px solid #5c3a17' : '1px solid #505050',
                      borderLeft: unlocked ? '1px solid #8b6535' : '1px solid #707070',
                      borderRight: unlocked ? '1px solid #8b6535' : '1px solid #707070',
                      boxShadow: '1px 1px 3px rgba(0,0,0,0.3), inset 0 0 8px rgba(180,140,80,0.3)',
                      fontSize: '10px',
                      fontWeight: 900,
                      borderRadius: '2px',
                      position: 'absolute',
                    }}
                  >
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 text-amber-900 text-xs">⊏</span>
                    <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 text-amber-900 text-xs">⊐</span>
                    {unlocked ? dungeon.title : '???'}
                  </div>

                  {unlocked && status.cleared > 0 && (
                    <div className="absolute -top-2 -left-3 bg-yellow-400 border-2 border-amber-900 rounded-full px-1.5 py-0.5 shadow-md z-10">
                      <span className="text-[10px] font-black text-amber-900">
                        ⭐{status.stars}
                      </span>
                    </div>
                  )}

                  {status.isFullyCleared && (
                    <>
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 text-2xl">
                        🚩
                      </div>
                      <div className="absolute -top-1 -right-3 text-sm" style={{ animation: 'sparkle 2s infinite' }}>✨</div>
                      <div className="absolute top-3 -left-4 text-xs" style={{ animation: 'sparkle 2.5s infinite 0.7s' }}>✨</div>
                      <div className="absolute bottom-2 -right-2 text-xs" style={{ animation: 'sparkle 2.2s infinite 1.2s' }}>⭐</div>
                    </>
                  )}

                  {isCurrent && unlocked && (
                    <>
                      <div 
                        className="absolute left-1/2 -translate-x-1/2 -top-8 text-3xl z-20"
                        style={{ animation: 'pirate-bob 1.2s infinite ease-in-out' }}
                      >
                        🏴‍☠️
                      </div>
                      <div 
                        className="absolute left-1/2 -translate-x-1/2 -top-14 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap z-20"
                        style={{ animation: 'challenge-pulse 1.5s infinite' }}
                      >
                        도전!
                      </div>
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* 진행 안내 메시지 */}
        <div className="mt-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-700 rounded-xl p-3 shadow-lg">
          <p className="text-xs text-amber-900 font-bold flex items-center gap-1">
            🗺️ {currentDungeonIdx === -1 
              ? '🎉 모든 보물을 찾았다! 진정한 AI 마스터!' 
              : `${dungeonStatuses[currentDungeonIdx].dungeon.title}으로 출항하라!`
            }
          </p>
          {currentDungeonIdx !== -1 && (
            <p className="text-[11px] text-amber-700 mt-0.5">
              섬을 눌러 모험을 시작해
            </p>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => router.push('/leaderboard')}
            className="bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-yellow-100 font-black py-3 rounded-xl shadow-lg border-2 border-amber-950 transition-all hover:scale-105"
          >
            🏅 명예의 전당
          </button>
          <button
            onClick={() => router.push('/mypage')}
            className="bg-gradient-to-b from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-yellow-100 font-black py-3 rounded-xl shadow-lg border-2 border-amber-950 transition-all hover:scale-105"
          >
            👤 선장실
          </button>
        </div>
      </div>

      {/* 안개 걷힘 트랜지션 */}
      <FogTransition 
        isActive={transitionActive} 
        onComplete={handleTransitionComplete}
      />

      {/* 애니메이션 정의 */}
      <style jsx>{`
        @keyframes pirate-bob {
          0%, 100% { transform: translate(-50%, 0) rotate(-8deg); }
          50% { transform: translate(-50%, -6px) rotate(8deg); }
        }
        @keyframes challenge-pulse {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, 0) scale(1.1); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        :global(.glow-pulse) {
          animation: glow-pulse 2s infinite ease-in-out;
          transform-origin: center;
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); transform-box: fill-box; }
          50% { opacity: 1; transform: scale(1.3); transform-box: fill-box; }
        }
      `}</style>
    </div>
  )
}