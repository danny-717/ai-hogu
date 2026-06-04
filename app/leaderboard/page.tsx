'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type LeaderboardEntry = {
  user_id: string
  nickname: string
  school: string | null
  total_score: number
  stages_cleared: number
  total_stars: number
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [mySchool, setMySchool] = useState<string | null>(null)
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<'school' | 'all'>('school')
  const [schoolRankings, setSchoolRankings] = useState<LeaderboardEntry[]>([])
  const [allRankings, setAllRankings] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      setMyUserId(session.user.id)

      const { data: profile } = await supabase
        .from('profiles')
        .select('school')
        .eq('id', session.user.id)
        .single()

      const userSchool = profile?.school || null
      setMySchool(userSchool)

      const { data: allData } = await supabase
        .from('leaderboard_view')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(50)

      if (allData) {
        setAllRankings(allData)
        if (userSchool) {
          setSchoolRankings(allData.filter(e => e.school === userSchool))
        }
      }

      setLoading(false)
    }
    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#3d2817' }}>
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🏆</div>
          <p className="text-amber-100 font-bold">명예의 전당 입장 중...</p>
        </div>
      </div>
    )
  }

  const currentRankings = tab === 'school' ? schoolRankings : allRankings
  const myRank = currentRankings.findIndex(e => e.user_id === myUserId) + 1

  function getMedal(rank: number) {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return null
  }

  function getRowStyle(rank: number, isMe: boolean) {
    if (isMe) {
      return {
        background: 'linear-gradient(to right, #fef3c7, #fde68a)',
        borderColor: '#d97706',
        borderWidth: '3px',
      }
    }
    if (rank === 1) {
      return {
        background: 'linear-gradient(to right, #fef3c7, #fde68a)',
        borderColor: '#fbbf24',
        borderWidth: '2px',
      }
    }
    if (rank === 2) {
      return {
        background: 'linear-gradient(to right, #f3f4f6, #e5e7eb)',
        borderColor: '#9ca3af',
        borderWidth: '2px',
      }
    }
    if (rank === 3) {
      return {
        background: 'linear-gradient(to right, #fed7aa, #fdba74)',
        borderColor: '#ea580c',
        borderWidth: '2px',
      }
    }
    return {
      background: 'linear-gradient(to bottom, #f5e1b8, #e8c780)',
      borderColor: '#8b6535',
      borderWidth: '2px',
    }
  }

  return (
    <div 
      className="min-h-screen pb-12 leaderboard-fadein"
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

        {/* 헤더 - 양피지 카드 */}
        <div className="relative bg-gradient-to-b from-amber-50 to-amber-100 rounded-2xl shadow-2xl border-4 border-amber-800 p-4 mb-4 text-center">
          <div className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>
          <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>
          <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-amber-900 rounded-full opacity-30"></div>

          <p className="text-[10px] text-amber-700 font-bold tracking-widest">⚓ HAIJEOK CREW ⚓</p>
          <h1 className="text-2xl font-black text-amber-900 mt-1">🏆 명예의 전당</h1>
          <p className="text-xs text-amber-700 mt-1 italic">"전설의 해적들"</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('school')}
            className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all border-2"
            style={tab === 'school' 
              ? {
                  background: 'linear-gradient(to bottom, #fbbf24, #d97706)',
                  color: '#451a03',
                  borderColor: '#451a03',
                  boxShadow: '0 4px 0 #451a03',
                }
              : {
                  background: 'rgba(245, 225, 184, 0.3)',
                  color: '#fef3c7',
                  borderColor: '#8b6535',
                }
            }
          >
            🏫 우리 학교
          </button>
          <button
            onClick={() => setTab('all')}
            className="flex-1 py-2.5 rounded-xl font-black text-sm transition-all border-2"
            style={tab === 'all' 
              ? {
                  background: 'linear-gradient(to bottom, #fbbf24, #d97706)',
                  color: '#451a03',
                  borderColor: '#451a03',
                  boxShadow: '0 4px 0 #451a03',
                }
              : {
                  background: 'rgba(245, 225, 184, 0.3)',
                  color: '#fef3c7',
                  borderColor: '#8b6535',
                }
            }
          >
            🌐 전체
          </button>
        </div>

        {/* 내 순위 표시 (학교 탭일 때) */}
        {tab === 'school' && myRank > 0 && (
          <div 
            className="rounded-xl p-3 mb-4 text-center border-4"
            style={{ 
              background: 'linear-gradient(to bottom, #fef3c7, #fde68a)',
              borderColor: '#d97706',
            }}
          >
            <p className="text-xs text-amber-800 font-bold mb-1">내 순위</p>
            <p className="text-2xl font-black text-amber-900">
              🏴‍☠️ {mySchool} 내 {myRank}위
            </p>
          </div>
        )}

        {/* 학교 정보 없을 때 */}
        {tab === 'school' && !mySchool && (
          <div 
            className="rounded-xl p-4 mb-4 text-center border-2"
            style={{ 
              background: 'rgba(245, 225, 184, 0.3)',
              borderColor: '#8b6535',
            }}
          >
            <p className="text-amber-100 text-sm font-bold">학교 정보가 없어!</p>
            <p className="text-amber-200 text-xs mt-1">전체 랭킹을 봐줘.</p>
          </div>
        )}

        {/* 랭킹 리스트 */}
        {currentRankings.length === 0 ? (
          <div 
            className="rounded-xl p-8 text-center border-4 border-amber-800"
            style={{ background: 'linear-gradient(to bottom, #f5e1b8, #e8c780)' }}
          >
            <div className="text-5xl mb-3">⚓</div>
            <p className="text-amber-900 font-black text-base">아직 아무도 항해를 시작하지 않았어!</p>
            <p className="text-amber-700 text-xs mt-2 italic">"첫 번째 전설이 되어보자"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* TOP 3 - 특별 표시 */}
            {currentRankings.slice(0, 3).map((entry, idx) => {
              const rank = idx + 1
              const isMe = entry.user_id === myUserId
              const medal = getMedal(rank)
              const heightClass = rank === 1 ? 'p-4' : 'p-3.5'
              const emojiSize = rank === 1 ? 'text-4xl' : rank === 2 ? 'text-3xl' : 'text-3xl'

              return (
                <div
                  key={entry.user_id}
                  className={`relative rounded-xl ${heightClass} shadow-lg flex items-center gap-3 rank-pop`}
                  style={{
                    ...getRowStyle(rank, isMe),
                    animationDelay: `${idx * 0.15}s`,
                  }}
                >
                  {/* 메달 */}
                  <div className={`${emojiSize}`} style={{ filter: 'drop-shadow(2px 2px 0 rgba(0,0,0,0.3))' }}>
                    {medal}
                  </div>

                  {/* 닉네임 + 학교 */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-black ${rank === 1 ? 'text-base' : 'text-sm'} text-amber-900 truncate`}>
                      {entry.nickname}
                      {isMe && <span className="text-xs ml-1 text-amber-700">(나)</span>}
                    </p>
                    {entry.school && tab === 'all' && (
                      <p className="text-[10px] text-amber-700 truncate font-bold">
                        🏫 {entry.school}
                      </p>
                    )}
                    <p className="text-[10px] text-amber-700 font-bold">
                      ⭐ {entry.total_stars} · 🗺️ {entry.stages_cleared}곳 정복
                    </p>
                  </div>

                  {/* 점수 */}
                  <div className="text-right">
                    <p className={`font-black ${rank === 1 ? 'text-2xl' : 'text-xl'} text-amber-900`}
                      style={{ textShadow: rank === 1 ? '2px 2px 0 #fbbf24' : 'none' }}
                    >
                      {entry.total_score}
                    </p>
                    <p className="text-[9px] text-amber-700 font-bold">💎 보물</p>
                  </div>
                </div>
              )
            })}

            {/* 4위 이하 - 일반 표시 */}
            {currentRankings.length > 3 && (
              <div className="pt-10 mt-3 border-t-2 border-dashed border-amber-700">
                <p className="text-[10px] text-amber-200 font-bold tracking-widest text-center mb-2">
                  ⚓ 그 외 용감한 해적들 ⚓
                </p>
                <div className="space-y-2">
                  {currentRankings.slice(3).map((entry, idx) => {
                    const rank = idx + 4
                    const isMe = entry.user_id === myUserId

                    return (
                      <div
                        key={entry.user_id}
                        className="rounded-xl p-2.5 shadow flex items-center gap-3"
                        style={getRowStyle(rank, isMe)}
                      >
                        {/* 순위 */}
                        <div 
                          className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm border-2"
                          style={{
                            background: isMe ? '#fbbf24' : '#d4b06a',
                            color: '#451a03',
                            borderColor: '#451a03',
                          }}
                        >
                          {rank}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-black text-sm text-amber-900 truncate">
                            {entry.nickname}
                            {isMe && <span className="text-xs ml-1 text-amber-700">(나)</span>}
                          </p>
                          {entry.school && tab === 'all' && (
                            <p className="text-[9px] text-amber-700 truncate font-bold">
                              🏫 {entry.school}
                            </p>
                          )}
                          <p className="text-[9px] text-amber-700 font-bold">
                            ⭐ {entry.total_stars} · 🗺️ {entry.stages_cleared}곳
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="font-black text-base text-amber-900">
                            {entry.total_score}
                          </p>
                          <p className="text-[9px] text-amber-700 font-bold">💎</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .leaderboard-fadein {
          animation: lb-arrive 0.8s ease-out;
        }
        @keyframes lb-arrive {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes rank-pop {
          0% { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        .rank-pop {
          animation: rank-pop 0.5s ease-out backwards;
        }
      `}</style>
    </div>
  )
}