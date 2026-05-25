'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [school, setSchool] = useState('')
  const [grade, setGrade] = useState('1')
  const [className, setClassName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup() {
    setError('')

    if (!nickname.trim()) {
      setError('닉네임을 입력해줘')
      return
    }
    if (nickname.length < 2) {
      setError('닉네임은 2글자 이상이어야 해')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 해')
      return
    }
    if (!school.trim()) {
      setError('학교 이름을 입력해줘')
      return
    }

    setLoading(true)

    try {
      const safeId = btoa(unescape(encodeURIComponent(nickname))).replace(/[+/=]/g, '').toLowerCase().slice(0, 20)
      const fakeEmail = `user_${safeId}@aihogu.com`

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: password,
      })

      if (authError) {
        if (authError.message.includes('already') || authError.message.includes('registered')) {
          setError('이미 사용 중인 닉네임이야')
        } else {
          setError('가입 중 오류: ' + authError.message)
        }
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('가입 처리 실패')
        setLoading(false)
        return
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          nickname: nickname,
          school: school,
          grade: grade,
          class_name: className || null,
        })

      if (profileError) {
        if (profileError.message.includes('duplicate')) {
          setError('이미 사용 중인 닉네임이야')
        } else {
          setError('프로필 저장 실패: ' + profileError.message)
        }
        setLoading(false)
        return
      }

      router.push('/map')

    } catch (e) {
      setError('가입 처리 중 오류가 발생했어')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-600 mb-2">
            🎮 AI 호구탈출
          </h1>
          <p className="text-gray-600">
            모험을 시작할 캐릭터 만들기
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="다른 사람과 겹치지 않게"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6자 이상"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학교
            </label>
            <input
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="예: 한빛중학교"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
              maxLength={30}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학년
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
              >
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                반 (선택)
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="예: 3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
                maxLength={5}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSignup}
          disabled={loading}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
        >
          {loading ? '가입 중...' : '🚀 모험 시작하기'}
        </button>

        <div className="mt-4 text-center text-sm text-gray-600">
          이미 계정 있어?{' '}
          <Link href="/login" className="text-indigo-600 hover:underline font-medium">
            로그인하기
          </Link>
        </div>
      </div>
    </div>
  )
}