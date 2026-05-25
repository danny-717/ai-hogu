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

type TabType = 'school' | 'all'

export default function LeaderboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('school')
  const [myNickname, setMyNickname] = useState('')
  const [mySchool, setMySchool] = useState<string | null>(null)
  const [schoolRanking, setSchoolRanking] = useState<LeaderboardEntry[]>([])
  const [allRanking, setAllRanking] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname, school')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setMyNickname(profile.nickname)
        setMySchool(profile.school)
      }

      const { data: allData } = await supabase
        .from('leaderboard_view')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(100)

      if (allData) {
        setAllRanking(allData)
        
        if (profile?.school) {
          const schoolData = allData.filter(entry => entry.school === profile.school)
          setSchoolRanking(schoolData)
        }
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

  const currentRanking = activeTab === 'school' ? schoolRanking : allRanking
  const myRank = currentRanking.findIndex(e => e.nickname === myNickname) + 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 pb-12">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.push('/map')}
          className="text-sm text-gray-600 hover:text-gray-800 mb-3 flex items-center gap-1"
        >
          ← 모험 지도로
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <div className="text-center mb-2">
            <div className="text-4xl mb-2">🏅</div>
            <h1 className="text-2xl font-bold text-purple-600">
              리더보드
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              누가누가 잘하나
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('school')}
              className={`py-3 text-sm font-bold transition-colors ${
                activeTab === 'school'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-500'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              🏫 우리 학교
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 text-sm font-bold transition-colors ${
                activeTab === 'all'
                  ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-500'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              🌐 전체
            </button>
          </div>

          {activeTab === 'school' && mySchool && (
            <div className="bg-purple-50 px-4 py-2 text-xs text-purple-700 border-b border-purple-100">
              📍 {mySchool}
            </div>
          )}

          {myRank > 0 && (
            <div className="bg-amber-50 border-b-2 border-amber-200 px-4 py-3">
              <p className="text-xs text-amber-700 font-bold mb-1">내 순위</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-xl font-bold text-amber-600 w-8 text-center">
                    {myRank}위
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{myNickname}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-600">
                    {currentRanking[myRank - 1]?.total_score || 0}점
                  </p>
                  <p className="text-xs text-gray-500">
                    ⭐ {currentRanking[myRank - 1]?.total_stars || 0}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="divide-y divide-gray-100">
            {currentRanking.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <div className="text-3xl mb-2">😴</div>
                <p className="text-sm">아직 아무도 없어</p>
                <p className="text-xs mt-1">친구들도 가입하라고 알려줘!</p>
              </div>
            ) : (
              currentRanking.map((entry, index) => {
                const rank = index + 1
                const isMe = entry.nickname === myNickname
                
                let rankBadge = ''
                let rankColor = 'text-gray-500'
                if (rank === 1) {
                  rankBadge = '🥇'
                  rankColor = 'text-amber-500'
                } else if (rank === 2) {
                  rankBadge = '🥈'
                  rankColor = 'text-gray-400'
                } else if (rank === 3) {
                  rankBadge = '🥉'
                  rankColor = 'text-amber-700'
                }

                return (
                  <div
                    key={entry.user_id}
                    className={`px-4 py-3 flex items-center justify-between ${
                      isMe ? 'bg-purple-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`text-lg font-bold ${rankColor} w-10 text-center flex-shrink-0`}>
                        {rankBadge || rank}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {entry.nickname}
                          </p>
                          {isMe && (
                            <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full flex-shrink-0">
                              나
                            </span>
                          )}
                        </div>
                        {activeTab === 'all' && entry.school && (
                          <p className="text-xs text-gray-400 truncate">
                            {entry.school}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-base font-bold text-indigo-600">
                        {entry.total_score}
                      </p>
                      <p className="text-xs text-gray-400">
                        ⭐ {entry.total_stars} · 🎯 {entry.stages_cleared}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="mt-4 bg-white rounded-2xl shadow-lg p-4 text-xs text-gray-500">
          <p className="font-bold text-gray-700 mb-2">💡 점수 계산</p>
          <ul className="space-y-1">
            <li>• 일반 스테이지 별 1개 = 10점</li>
            <li>• 보스 스테이지 별 1개 = 20점</li>
            <li>• 만점: 600점</li>
          </ul>
        </div>
      </div>
    </div>
  )
}