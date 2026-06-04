'use client'

import { useEffect, useState } from 'react'

interface ScrollTransitionProps {
  onComplete: () => void
}

export default function ScrollTransition({ onComplete }: ScrollTransitionProps) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 100)   // 양피지 펼침 시작
    const t2 = setTimeout(() => setPhase(2), 900)   // 텍스트 등장
    const t3 = setTimeout(() => onComplete(), 1600) // 페이지 이동
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onComplete])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(40, 25, 10, 0.85)', backdropFilter: 'blur(3px)' }}
    >
      {/* 양피지 두루마리 */}
      <div
        className="relative rounded-2xl shadow-2xl border-4 border-amber-800 flex flex-col items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #f5e1b8, #e8c780)',
          width: '280px',
          height: phase >= 1 ? '180px' : '24px',
          transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* 위아래 막대 (두루마리 봉) */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-amber-900 opacity-70"></div>
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-amber-900 opacity-70"></div>

        {/* 내용 */}
        <div
          className="flex flex-col items-center gap-2 px-4"
          style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'scale(1)' : 'scale(0.8)',
            transition: 'all 0.4s ease-out',
          }}
        >
          <div className="text-4xl">📜</div>
          <div className="text-amber-900 font-bold text-lg">모험의 시험이 시작된다...</div>
          <div className="text-amber-800 text-sm">⚔️ 준비하라! ⚔️</div>
        </div>
      </div>
    </div>
  )
}