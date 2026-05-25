'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setError('')

    if (!nickname.trim() || !password) {
      setError('닉네임과 비밀번호를 입력해줘')
      return
    }

    setLoading(true)

    try {
      const safeId = btoa(unescape(encodeURIComponent(nickname))).replace(/[+/=]/g, '').toLowerCase().slice(0, 20)
      const fakeEmail = `user_${safeId}@aihogu.com`

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: fakeEmail,
        password: password,
      })

      if (authError) {
        if (authError.message.includes('Invalid')) {
          setError('닉네임 또는 비밀번호가 틀렸어')
        } else {
          setError('로그인 오류: ' + authError.message)
        }
        setLoading(false)
        return
      }

      router.push('/map')

    } catch (e) {
      setError('로그인 처리 중 오류가 발생했어')
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      handleLogin()
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
            돌아온 걸 환영해!
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
              onKeyDown={handleKeyDown}
              placeholder="가입할 때 정한 닉네임"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
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
              onKeyDown={handleKeyDown}
              placeholder="비밀번호"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-gray-900"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
        >
          {loading ? '로그인 중...' : '🎮 모험 계속하기'}
        </button>

        <div className="mt-4 text-center text-sm text-gray-600">
          처음이야?{' '}
          <Link href="/signup" className="text-indigo-600 hover:underline font-medium">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}