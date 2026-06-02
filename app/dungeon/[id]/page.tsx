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
      <div 
        className="min-h-screen flex items-center justify-center" 
        style={{ background: '#3d2817' }}
      >
        {/* 빈 화면 - 트랜지션이 끝나면 바로 메인 화면 보이게 */}
      </div>
    )
  }

  if (!dungeon) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#3d2817' }}>
        <div className="text-center">
          <p className="text-amber-100 mb-4">존재하지 않는 섬이야</p>
          <button
            onClick={() => router.push('/map')}
            className="px-4 py-2 bg-amber-700 text-yellow-100 rounded-lg font-bold"
          >
            모험 지도로
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
    { x: 25, y: 18, icon: '🏕️', name: '야영지' },
    { x: 70, y: 35, icon: '🌳', name: '숲' },
    { x: 28, y: 55, icon: '🌊', name: '폭포' },
    { x: 65, y: 78, icon: '🏰', name: '동굴' },
  ]

  function handleStageClick(stage: Stage, status: ReturnType<typeof getStageStatus>) {
    if (!status.unlocked) return
    router.push(`/quiz/${stage.id}`)
  }

  const dungeonTheme = {
    1: { accent: '#a83a1f', glow: 'rgba(255, 100, 80, 0.4)' },
    2: { accent: '#1f4ea8', glow: 'rgba(80, 130, 255, 0.4)' },
    3: { accent: '#7b1fa8', glow: 'rgba(180, 80, 255, 0.4)' },
    4: { accent: '#1f8a3a', glow: 'rgba(80, 200, 130, 0.4)' },
  }[dungeon.id] || { accent: '#a83a1f', glow: 'rgba(255, 100, 80, 0.4)' }

  return (
    <div 
      className="min-h-screen pb-12 dungeon-fadein"
      style={{ background: 'linear-gradient(135deg, #3d2817 0%, #5c3a17 50%, #3d2817 100%)' }}
    >
      <div className="max-w-md mx-auto px-3 pt-3">
        {/* 상단 - 뒤로 가기 */}
        <button
          onClick={() => router.push('/map')}
          className="text-amber-200 hover:text-amber-100 text-sm mb-2 flex items-center gap-1 font-bold"
        >
          ← 모험 지도로 (배에 타고 돌아가기)
        </button>

        {/* 헤더 - 양피지 카드 */}
        <div className="relative bg-gradient-to-b from-amber-50 to-amber-100 rounded-2xl shadow-2xl border-4 border-amber-800 p-4 mb-4">
          <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>
          <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>
          <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>

          <div className="flex items-center gap-3">
            <div className="text-5xl">{dungeon.emoji}</div>
            <div className="flex-1">
              <p className="text-[10px] text-amber-700 font-bold tracking-widest">⚓ ISLAND OF ⚓</p>
              <h1 className="text-xl font-black text-amber-900">{dungeon.title}</h1>
              <p className="text-[11px] text-amber-700 mt-0.5 italic">"{dungeon.subtitle}"</p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-amber-300">
            <div className="flex items-center justify-between text-xs text-amber-800 mb-1 font-bold">
              <span>🗺️ 정복 상황</span>
              <span>{totalCleared} / {dungeon.stages.length}</span>
            </div>
            <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden border border-amber-700">
              <div
                className="h-full transition-all"
                style={{ 
                  width: `${(totalCleared / dungeon.stages.length) * 100}%`,
                  background: `linear-gradient(to right, ${dungeonTheme.accent}cc, ${dungeonTheme.accent})`,
                }}
              />
            </div>
          </div>
        </div>

        {/* 던전 내부 지도 */}
        <div 
          className="relative w-full rounded-2xl shadow-2xl overflow-hidden"
          style={{ 
            aspectRatio: '3 / 4',
            background: `
              radial-gradient(ellipse at 30% 20%, rgba(180, 140, 80, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(180, 140, 80, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #f4d699 0%, #e8c780 50%, #d4b06a 100%)
            `,
            boxShadow: 'inset 0 0 40px 15px rgba(120, 80, 30, 0.4), 0 10px 40px rgba(0,0,0,0.4)',
            border: '8px solid #5c3a17',
          }}
        >
          {/* 양피지 텍스처 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" preserveAspectRatio="none">
            <filter id="paperTex">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" />
              <feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.25  0 0 0 0 0.1  0 0 0 0.5 0"/>
            </filter>
            <rect width="100%" height="100%" filter="url(#paperTex)" />
          </svg>

          {/* 작은 디테일 + 점선 경로 */}
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <text x="5" y="8" fontSize="3" opacity="0.4" fill="#5c3a17">🧭</text>
            <text x="93" y="8" fontSize="3" opacity="0.4" fill="#5c3a17">⚓</text>
            <text x="93" y="97" fontSize="3" opacity="0.4" fill="#5c3a17">🏴‍☠️</text>
            
            <text x="50" y="30" fontSize="2.5" opacity="0.3">🌴</text>
            <text x="15" y="40" fontSize="2.5" opacity="0.3">⛰️</text>
            <text x="80" y="55" fontSize="2.5" opacity="0.3">🌴</text>
            <text x="45" y="70" fontSize="2.5" opacity="0.3">🌵</text>
            <text x="85" y="92" fontSize="2.5" opacity="0.3">⛰️</text>
            
            {stagePositions.map((pos, idx) => {
              if (idx === 0) return null
              const prev = stagePositions[idx - 1]
              const curr = pos
              const status = getStageStatus(dungeon.stages[idx], idx)
              const prevStatus = getStageStatus(dungeon.stages[idx - 1], idx - 1)
              
              if (!status.unlocked && !prevStatus.cleared) return null
              
              const midX = (prev.x + curr.x) / 2 + (idx % 2 === 0 ? -10 : 10)
              const midY = (prev.y + curr.y) / 2
              
              return (
                <path
                  key={`path-${idx}`}
                  d={`M ${prev.x} ${prev.y} Q ${midX} ${midY} ${curr.x} ${curr.y}`}
                  stroke="#8b1f1f"
                  strokeWidth="0.5"
                  strokeDasharray="1.5 1"
                  fill="none"
                  opacity={status.unlocked ? 0.8 : 0.3}
                />
              )
            })}
          </svg>

          {/* 스테이지 버튼들 */}
          {dungeon.stages.map((stage, index) => {
            const status = getStageStatus(stage, index)
            const pos = stagePositions[index] || stagePositions[0]
            
            return (
              <div
                key={stage.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              >
                <button
                  onClick={() => handleStageClick(stage, status)}
                  disabled={!status.unlocked}
                  className={`
                    relative flex flex-col items-center transition-transform
                    ${status.unlocked ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed'}
                  `}
                >
                  {status.isCurrent && (
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        width: stage.isBoss ? '110px' : '90px',
                        height: stage.isBoss ? '110px' : '90px',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: `radial-gradient(circle, ${dungeonTheme.glow} 0%, transparent 70%)`,
                        animation: 'stage-glow 2s infinite ease-in-out',
                      }}
                    />
                  )}

                  <div
                    className={`
                      relative rounded-full flex items-center justify-center
                      ${stage.isBoss ? 'w-20 h-20' : 'w-16 h-16'}
                    `}
                    style={{
                      background: status.cleared
                        ? `radial-gradient(circle, #fbbf24 0%, ${dungeonTheme.accent} 100%)`
                        : status.unlocked
                          ? `radial-gradient(circle, #f5e1b8 0%, ${dungeonTheme.accent} 100%)`
                          : 'radial-gradient(circle, #888 0%, #555 100%)',
                      border: `3px solid ${status.unlocked ? '#5c3a17' : '#444'}`,
                      boxShadow: status.unlocked 
                        ? '2px 4px 8px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.4)'
                        : '2px 4px 8px rgba(0,0,0,0.4)',
                      opacity: status.unlocked ? 1 : 0.6,
                    }}
                  >
                    {!status.unlocked && (
                      <span className="text-3xl">🔒</span>
                    )}
                    {status.unlocked && stage.isBoss && (
                      <span className="text-3xl" style={{ filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.5))' }}>
                        👹
                      </span>
                    )}
                    {status.unlocked && !stage.isBoss && (
                      <span className="text-3xl" style={{ filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.5))' }}>
                        {pos.icon}
                      </span>
                    )}
                  </div>

                  {stage.isBoss && status.unlocked && (
                    <div 
                      className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-700 text-yellow-100 text-[9px] font-black px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-10"
                      style={{ border: '1px solid #5c0000' }}
                    >
                      ⚔️ BOSS
                    </div>
                  )}

                  <div 
                    className="mt-2 px-2 py-0.5 whitespace-nowrap text-[10px] font-black"
                    style={{
                      background: status.unlocked 
                        ? 'linear-gradient(to bottom, #f5e1b8 0%, #e8c780 100%)'
                        : 'linear-gradient(to bottom, #c0c0c0 0%, #a0a0a0 100%)',
                      border: status.unlocked ? '1px solid #5c3a17' : '1px solid #707070',
                      borderRadius: '2px',
                      boxShadow: '1px 1px 3px rgba(0,0,0,0.3)',
                      color: status.unlocked ? '#5c3a17' : '#555',
                      maxWidth: '110px',
                      textAlign: 'center',
                    }}
                  >
                    {stage.title}
                  </div>

                  {status.cleared && (
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3].map(s => (
                        <span 
                          key={s} 
                          className={`text-xs ${status.stars >= s ? 'text-yellow-400' : 'text-gray-400'}`}
                          style={{ filter: 'drop-shadow(1px 1px 0 rgba(0,0,0,0.5))' }}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                  )}

                  {status.cleared && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-xl">
                      🚩
                    </div>
                  )}

                  {status.isCurrent && (
                    <>
                      <div 
                        className="absolute -top-9 left-1/2 -translate-x-1/2 text-2xl z-10"
                        style={{ animation: 'pirate-bob 1.2s infinite ease-in-out' }}
                      >
                        🏴‍☠️
                      </div>
                      <div 
                        className="absolute -top-16 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap z-10"
                        style={{ animation: 'challenge-pulse 1.5s infinite' }}
                      >
                        지금 여기!
                      </div>
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* 하단 안내 */}
        <div className="mt-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-700 rounded-xl p-3 shadow-lg">
          <p className="text-xs text-amber-900 font-bold flex items-center gap-1">
            {totalCleared === dungeon.stages.length 
              ? '🎉 이 섬의 모든 보물을 찾았다!' 
              : '⚓ 다음 모험 장소를 향해 출발하라!'}
          </p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            {totalCleared === dungeon.stages.length 
              ? '다음 섬으로 가는 길이 열렸다.'
              : '🏴‍☠️ 깃발이 있는 곳이 다음 도전 장소야.'}
          </p>
        </div>
      </div>

      <style jsx>{`
        /* ⭐ 던전 도착 페이드인 (안개 트랜지션과 자연스럽게 연결) */
        .dungeon-fadein {
          animation: dungeon-arrive 1.2s ease-out;
        }
        @keyframes dungeon-arrive {
          0% { 
            opacity: 0;
            filter: brightness(0.3);
          }
          50% {
            opacity: 0.6;
            filter: brightness(0.7);
          }
          100% { 
            opacity: 1;
            filter: brightness(1);
          }
        }

        /* 기존 애니메이션들 */
        @keyframes pirate-bob {
          0%, 100% { transform: translate(-50%, 0) rotate(-8deg); }
          50% { transform: translate(-50%, -6px) rotate(8deg); }
        }
        @keyframes challenge-pulse {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, 0) scale(1.1); }
        }
        @keyframes stage-glow {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
        }
      `}</style>
    </div>
  )
}