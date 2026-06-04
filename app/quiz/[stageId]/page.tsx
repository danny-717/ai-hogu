'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getStage, type Question } from '@/data/quizData'
import { pickQuestionsByDifficulty } from '@/lib/quizPool'
import ChestTransition from '@/app/components/ChestTransition'

type AnswerRecord = {
  questionId: string
  selectedIndex: number
  isCorrect: boolean
}

export default function QuizPage() {
  const router = useRouter()
  const params = useParams()
  const stageId = params.stageId as string
  const stageInfo = getStage(stageId)

  const [userId, setUserId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [combo, setCombo] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const [comboBonus, setComboBonus] = useState(0)
  const [showChest, setShowChest] = useState(false)
  const [chestResult, setChestResult] = useState<{ points: number; isTrap: boolean } | null>(null)
  const [chestBonus, setChestBonus] = useState(0)
  const [trapBonus, setTrapBonus] = useState(0)
  const [showFinalTransition, setShowFinalTransition] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      setUserId(session.user.id)
      
      if (stageInfo) {
        const isBoss = stageInfo.stage.isBoss
        const picked = pickQuestionsByDifficulty(
          stageInfo.stage,
          1,                  // easy
          isBoss ? 2 : 1,     // medium
          1                   // hard (함정 보장)
        )
        setQuestions(picked)
      }
    }
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, stageId])

  if (!stageInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#3d2817' }}>
        <div className="text-center">
          <p className="text-amber-100 mb-4">존재하지 않는 스테이지야</p>
          <button
            onClick={() => router.push('/map')}
            className="px-4 py-2 bg-amber-700 text-yellow-100 rounded-lg font-bold"
          >
            지도로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const { dungeon, stage } = stageInfo
  const totalQuestions = questions.length

  if (totalQuestions === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#3d2817' }}>
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🏴‍☠️</div>
          <p className="text-amber-100 font-bold">모험을 준비하는 중...</p>
        </div>
      </div>
    )
  }

  const currentQuestion: Question = questions[currentIndex]
  const isLastQuestion = currentIndex === totalQuestions - 1
  const progress = ((currentIndex + (showResult ? 1 : 0)) / totalQuestions) * 100

  // 던전별 컬러 테마
  const dungeonTheme = {
    1: { accent: '#a83a1f', light: '#fde2dc' },
    2: { accent: '#1f4ea8', light: '#dce6fd' },
    3: { accent: '#7b1fa8', light: '#ecdcfd' },
    4: { accent: '#1f8a3a', light: '#dcfde6' },
  }[dungeon.id] || { accent: '#a83a1f', light: '#fde2dc' }

  function handleSelectOption(index: number) {
    if (showResult) return
    setSelectedIndex(index)
  }

  function handleSubmit() {
    if (selectedIndex === null) return

    const isCorrect = selectedIndex === currentQuestion.correctIndex
    const newAnswer: AnswerRecord = {
      questionId: currentQuestion.id,
      selectedIndex,
      isCorrect,
    }
    setAnswers([...answers, newAnswer])
    setShowResult(true)

    // 콤보 처리
    if (isCorrect) {
      const newCombo = combo + 1
      setCombo(newCombo)
      if (newCombo >= 2) {
        setShowCombo(true)
        if (newCombo >= 3) {
          setComboBonus(prev => prev + newCombo * 5)
        }
        setTimeout(() => setShowCombo(false), 1500)
      }
    } else {
      setCombo(0)
    }

    // 함정 문제 처리
    if (currentQuestion.difficulty === 'hard') {
      if (isCorrect) {
        setTrapBonus(prev => prev + 20)
      } else {
        setTrapBonus(prev => prev - 15)
      }
    }

    // 보물 상자 30% 확률
    if (isCorrect && Math.random() < 0.3) {
      setTimeout(() => setShowChest(true), 1000)
    }
  }

  function handleOpenChest() {
    const isTrap = Math.random() < 0.2
    const points = isTrap 
      ? -10 
      : Math.floor(Math.random() * 5 + 1) * 10
    
    setChestResult({ points, isTrap })
    setChestBonus(prev => prev + points)
    
    setTimeout(() => {
      setShowChest(false)
      setChestResult(null)
    }, 2000)
  }

  // 결과 저장 + 결과 화면 이동 (보물상자 연출이 끝나면 호출됨)
  async function finishStage() {
    const allAnswers = [...answers]
    const correctCount = allAnswers.filter(a => a.isCorrect).length
    
    let stars = 0
    const accuracy = correctCount / totalQuestions
    if (accuracy >= 1.0) stars = 3
    else if (accuracy >= 0.75) stars = 2
    else if (accuracy >= 0.5) stars = 1

    if (userId && stars > 0) {
      await supabase.from('progress').upsert({
        user_id: userId,
        dungeon_id: dungeon.id,
        stage_id: stage.id,
        stars: stars,
        is_boss: stage.isBoss,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,stage_id',
      })

      const quizRecords = allAnswers.map(a => ({
        user_id: userId,
        question_id: a.questionId,
        dungeon_id: dungeon.id,
        is_correct: a.isCorrect,
        selected_answer: String(a.selectedIndex),
      }))
      await supabase.from('quiz_results').insert(quizRecords)
    }

    const resultParams = new URLSearchParams({
      stage: stage.id,
      correct: String(correctCount),
      total: String(totalQuestions),
      stars: String(stars),
      bonus: String(comboBonus + chestBonus + trapBonus),
    })
    router.push(`/result?${resultParams.toString()}`)
  }

  function handleNext() {
    if (isLastQuestion) {
      // 💎 보물상자 연출 시작 → 끝나면 finishStage() 호출됨
      setShowFinalTransition(true)
    } else {
      setCurrentIndex(currentIndex + 1)
      setSelectedIndex(null)
      setShowResult(false)
    }
  }

  function handleExit() {
    const answered = answers.length
    let message = ''
    
    if (answered === 0) {
      message = '아직 모험 시작 안 했어. 지금 돌아갈래?'
    } else {
      message = `⚠️ 지금 돌아가면 푼 ${answered}문제가 다 사라져.\n\n별점도 못 받고 처음부터 다시 도전해야 해.\n\n정말 돌아갈래?`
    }
    
    if (confirm(message)) {
      router.push(`/dungeon/${dungeon.id}`)
    }
  }

  return (
    <div 
      className="min-h-screen pb-12 quiz-fadein"
      style={{ 
        background: 'linear-gradient(135deg, #3d2817 0%, #5c3a17 50%, #3d2817 100%)',
      }}
    >
      {/* 💎 보물상자 트랜지션 (마지막 문제 → 결과) */}
      {showFinalTransition && (
        <ChestTransition onComplete={finishStage} />
      )}

      <div className="max-w-md mx-auto px-3 pt-10">
        {/* 상단 - 나가기 + 진행 */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={handleExit}
            className="text-amber-200 hover:text-amber-100 text-xs font-bold flex items-center gap-1"
          >
            ← 섬으로 돌아가기
          </button>
          <div className="flex items-center gap-2">
            {combo >= 2 && (
              <div className="text-[10px] font-black text-amber-900 bg-yellow-300 px-2 py-0.5 rounded-full border-2 border-amber-700 shadow">
                🔥 {combo} 연속!
              </div>
            )}
            <div className="text-xs text-amber-200 font-bold">
              {currentIndex + 1} / {totalQuestions}
            </div>
          </div>
        </div>

        {/* 진행도 바 - 양피지 톤 */}
        <div 
          className="w-full h-3 rounded-full overflow-hidden mb-4 border-2 border-amber-900 shadow-inner"
          style={{ background: '#5c3a17' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{ 
              width: `${progress}%`,
              background: `linear-gradient(to right, #fbbf24, ${dungeonTheme.accent})`,
            }}
          />
        </div>

        {/* 메인 카드 - 양피지 */}
        <div 
          className="relative rounded-2xl shadow-2xl border-4 border-amber-800 p-5 mb-3"
          style={{ 
            background: 'linear-gradient(to bottom, #f5e1b8 0%, #e8c780 100%)',
          }}
        >
          {/* 모서리 장식 */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-amber-900 rounded-full opacity-40"></div>
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-900 rounded-full opacity-40"></div>
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-amber-900 rounded-full opacity-40"></div>
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-amber-900 rounded-full opacity-40"></div>

          {/* 스테이지 타이틀 */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-amber-700 border-dashed">
            <span className="text-2xl">{dungeon.emoji}</span>
            <div className="flex-1">
              <p className="text-[10px] text-amber-700 font-bold tracking-widest">⚓ {stage.isBoss ? 'BOSS BATTLE' : 'ADVENTURE'} ⚓</p>
              <p className="text-sm font-black text-amber-900">
                {stage.title} {stage.isBoss && '👹'}
              </p>
            </div>
          </div>
          
          {/* 함정 문제 경고 */}
          {currentQuestion.difficulty === 'hard' && !showResult && (
            <div 
              className="relative rounded-lg p-2.5 mb-3 flex items-center justify-between border-2 trap-shake"
              style={{
                background: 'linear-gradient(135deg, #fee2e2 0%, #fed7aa 100%)',
                borderColor: '#dc2626',
                boxShadow: '0 0 15px rgba(220, 38, 38, 0.4)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">💀</span>
                <div>
                  <p className="text-xs font-black text-red-700">⚠️ 함정 문제!</p>
                  <p className="text-[10px] text-red-600 font-bold">정답 +20 / 오답 -15</p>
                </div>
              </div>
              <span className="text-xl trap-pulse">⚠️</span>
            </div>
          )}

          {/* 상황 박스 */}
          {currentQuestion.scenario && (
            <div 
              className="border-l-4 border-amber-700 p-3 rounded-r-lg mb-3"
              style={{ background: 'rgba(255, 255, 255, 0.5)' }}
            >
              <p className="text-[10px] text-amber-800 font-black mb-1">📜 상황</p>
              <p className="text-sm text-amber-950 leading-relaxed">
                {currentQuestion.scenario}
              </p>
            </div>
          )}

          {/* 질문 */}
          <p className="text-base font-black text-amber-950 leading-relaxed">
            {currentQuestion.question}
          </p>
        </div>

        {/* 보기 버튼들 */}
        <div className="space-y-2 mb-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedIndex === index
            const isCorrectAnswer = index === currentQuestion.correctIndex
            
            let bgStyle = {}
            let borderColor = '#8b6535'
            let textColor = '#451a03'
            
            if (showResult) {
              if (isCorrectAnswer) {
                bgStyle = { background: 'linear-gradient(to bottom, #bbf7d0, #86efac)' }
                borderColor = '#16a34a'
                textColor = '#14532d'
              } else if (isSelected && !isCorrectAnswer) {
                bgStyle = { background: 'linear-gradient(to bottom, #fecaca, #fca5a5)' }
                borderColor = '#dc2626'
                textColor = '#7f1d1d'
              } else {
                bgStyle = { background: '#d4b06a', opacity: 0.5 }
              }
            } else if (isSelected) {
              bgStyle = { background: 'linear-gradient(to bottom, #fef3c7, #fde68a)' }
              borderColor = '#d97706'
              textColor = '#451a03'
            } else {
              bgStyle = { background: 'linear-gradient(to bottom, #f5e1b8, #e8c780)' }
            }

            const optionLabel = ['A', 'B', 'C', 'D'][index]

            return (
              <button
                key={index}
                onClick={() => handleSelectOption(index)}
                disabled={showResult}
                className={`
                  w-full text-left p-3.5 rounded-xl transition-all border-2
                  ${!showResult ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}
                `}
                style={{
                  ...bgStyle,
                  borderColor: borderColor,
                  color: textColor,
                  boxShadow: '1px 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 border-2"
                    style={{
                      background: showResult && isCorrectAnswer ? '#16a34a' :
                                  showResult && isSelected && !isCorrectAnswer ? '#dc2626' :
                                  isSelected ? '#d97706' : '#8b6535',
                      color: 'white',
                      borderColor: '#451a03',
                    }}
                  >
                    {showResult && isCorrectAnswer ? '✓' :
                     showResult && isSelected && !isCorrectAnswer ? '✕' :
                     optionLabel}
                  </div>
                  <span className="text-sm leading-relaxed pt-1 font-bold flex-1">{option}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* 보물 상자 */}
        {showChest && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-40">
            <div className="pointer-events-auto">
              {!chestResult ? (
                <button
                  onClick={handleOpenChest}
                  className="chest-bounce text-center"
                >
                  <div className="text-8xl" style={{ filter: 'drop-shadow(0 0 30px rgba(255, 200, 50, 0.8))' }}>
                    💎
                  </div>
                  <div className="mt-2 bg-amber-500 text-white text-sm font-black px-4 py-1 rounded-full shadow-lg animate-pulse border-2 border-amber-700">
                    클릭해서 열기!
                  </div>
                </button>
              ) : (
                <div className="chest-reveal text-center">
                  <div className="text-7xl mb-2">
                    {chestResult.isTrap ? '💀' : '🎁'}
                  </div>
                  <div className={`text-4xl font-black px-6 py-2 rounded-2xl shadow-2xl border-4 ${
                    chestResult.isTrap 
                      ? 'bg-red-500 text-white border-red-800' 
                      : 'bg-yellow-400 text-amber-900 border-amber-700'
                  }`}>
                    {chestResult.points > 0 ? '+' : ''}{chestResult.points}
                  </div>
                  <div className={`mt-2 font-black text-base ${
                    chestResult.isTrap ? 'text-red-100' : 'text-amber-100'
                  }`} style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.5)' }}>
                    {chestResult.isTrap ? '함정이었어! 😱' : '보물 획득!  🎉'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 콤보 표시 */}
        {showCombo && combo >= 2 && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
            <div className="combo-pop text-center">
              <div className="text-6xl font-black" style={{
                color: '#fbbf24',
                textShadow: '0 0 20px rgba(255, 220, 50, 0.8), 4px 4px 0 #5c3a17',
                WebkitTextStroke: '2px #5c3a17',
              }}>
                🔥 {combo} COMBO!
              </div>
              {combo >= 3 && (
                <div className="text-amber-100 font-black text-xl mt-2" style={{
                  textShadow: '2px 2px 0 #5c3a17',
                }}>
                  +{combo * 5} 보너스!
                </div>
              )}
            </div>
          </div>
        )}

        {/* 해설 박스 */}
        {showResult && (
          <div 
            className="rounded-2xl p-4 mb-3 border-4"
            style={{
              background: selectedIndex === currentQuestion.correctIndex
                ? 'linear-gradient(to bottom, #d1fae5, #a7f3d0)'
                : 'linear-gradient(to bottom, #fee2e2, #fecaca)',
              borderColor: selectedIndex === currentQuestion.correctIndex ? '#16a34a' : '#dc2626',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className={`font-black text-base ${
                selectedIndex === currentQuestion.correctIndex ? 'text-green-800' : 'text-red-800'
              }`}>
                {selectedIndex === currentQuestion.correctIndex ? '🎉 정답!' : '❌ 아쉽다!'}
              </p>
              {currentQuestion.difficulty === 'hard' && (
                <span className={`text-sm font-black px-3 py-1 rounded-full border-2 ${
                  selectedIndex === currentQuestion.correctIndex
                    ? 'bg-yellow-300 text-amber-900 border-amber-700'
                    : 'bg-red-600 text-white border-red-900'
                }`}>
                  💀 {selectedIndex === currentQuestion.correctIndex ? '+20' : '-15'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-800 leading-relaxed font-medium">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={selectedIndex === null}
            className="w-full font-black text-lg py-3.5 rounded-xl shadow-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: selectedIndex !== null 
                ? 'linear-gradient(to bottom, #fbbf24, #d97706)'
                : '#6b7280',
              color: '#451a03',
              borderColor: '#451a03',
            }}
          >
            ⚓ 정답 확인하기
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={showFinalTransition}
            className="w-full text-yellow-100 font-black text-lg py-3.5 rounded-xl shadow-lg border-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70"
            style={{
              background: `linear-gradient(to bottom, ${dungeonTheme.accent}, ${dungeonTheme.accent}dd)`,
              borderColor: '#451a03',
            }}
          >
            {isLastQuestion ? '🏆 보물 확인하기' : '다음 모험 →'}
          </button>
        )}
      </div>

      <style jsx>{`
        .quiz-fadein {
          animation: quiz-arrive 0.8s ease-out;
        }
        @keyframes quiz-arrive {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes combo-pop {
          0% { opacity: 0; transform: scale(0.3) rotate(-10deg); }
          20% { opacity: 1; transform: scale(1.3) rotate(5deg); }
          40% { transform: scale(1) rotate(-2deg); }
          80% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.2) translateY(-30px); }
        }
        .combo-pop {
          animation: combo-pop 1.5s ease-out forwards;
        }
        @keyframes chest-bounce {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        .chest-bounce {
          animation: chest-bounce 0.8s infinite ease-in-out;
        }
        @keyframes chest-reveal {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        .chest-reveal {
          animation: chest-reveal 0.5s ease-out forwards;
        }
        @keyframes trap-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .trap-shake {
          animation: trap-shake 0.5s ease-in-out;
        }
        @keyframes trap-pulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(10deg); }
        }
        .trap-pulse {
          animation: trap-pulse 0.8s infinite ease-in-out;
          display: inline-block;
        }
      `}</style>
    </div>
  )
}