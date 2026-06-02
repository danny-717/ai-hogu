'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/intro')
  }, [router])

  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ background: '#3d2817' }}
    >
      <div className="text-center">
        <div className="text-5xl mb-3 animate-bounce">🏴‍☠️</div>
        <p className="text-amber-100 font-bold">항해 준비 중...</p>
      </div>
    </div>
  )
}