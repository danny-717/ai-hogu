'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        router.replace('/map')
      } else {
        router.replace('/login')
      }
    }
    
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="text-center">
        <div className="text-5xl mb-4">🎮</div>
        <p className="text-gray-600">잠시만요...</p>
      </div>
    </div>
  )
}