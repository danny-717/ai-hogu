'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getStage, type Question } from '@/data/quizData'

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

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace('/login')
        return
      }
      setUserId(session.user.id)
    }
    checkAuth()
  }, [router])

  if (!stageInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-700 mb-4">존재하지 않는 스테이지야</p>
          <button
            onClick={() => router.push('/map')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            맵으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const { dungeon, stage } = stageInfo
  const totalQuestions = stage.questions.length

  if (totalQuestions === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-700 mb-4">아직 문제가 준비되지 않았어</p>
          <button
            onClick={() => router.push(`/dungeon/${dungeon.id}`)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            던전으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion: Question = stage.questions[currentIndex]
  const isLastQuestion = currentIndex === totalQuestions - 1
  const progress = ((currentIndex + (showResult ? 1 : 0)) / totalQuestions) * 100

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
  }

  async function handleNext() {
    if (isLastQuestion) {
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
      })
      router.push(`/result?${resultParams.toString()}`)
    } else {
      setCurrentIndex(currentIndex + 1)
      setSelectedIndex(null)
      setShowResult(false)
    }
  }

  function handleExit() {
    if (confirm('지금 나가면 진행 상황이 저장되지 않아. 정말 나갈래?')) {
      router.push(`/dungeon/${dungeon.id}`)
    }
  }

  return (
    <div className={`min-h-screen ${dungeon.bgColor} pb-12`}>
      <div className="max-w-md mx-auto px-4 pt-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleExit}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            ✕ 나가기
          </button>
          <div className="text-xs text-gray-500">
            {currentIndex + 1} / {totalQuestions}
          </div>
        </div>

        <div className="w-full h-3 bg-white rounded-full overflow-hidden mb-6 shadow-inner">
          <div
            className={`h-full transition-all duration-500 ${
              dungeon.id === 1 ? 'bg-red-400' :
              dungeon.id === 2 ? 'bg-blue-400' :
              dungeon.id === 3 ? 'bg-purple-400' :
              'bg-green-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{dungeon.emoji}</span>
            <div>
              <p className={`text-xs font-bold ${dungeon.color}`}>
                {stage.title} {stage.isBoss && '👹'}
              </p>
            </div>
          </div>

          {currentQuestion.scenario && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-lg mb-4">
              <p className="text-xs text-amber-700 font-bold mb-1">📱 상황</p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {currentQuestion.scenario}
              </p>
            </div>
          )}

          <p className="text-base font-bold text-gray-800 leading-relaxed">
            {currentQuestion.question}
          </p>
        </div>

        <div className="space-y-2 mb-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedIndex === index
            const isCorrectAnswer = index === currentQuestion.correctIndex
            
            let buttonClass = 'bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-300'
            
            if (showResult) {
              if (isCorrectAnswer) {
                buttonClass = 'bg-green-50 border-2 border-green-500 text-green-800'
              } else if (isSelected && !isCorrectAnswer) {
                buttonClass = 'bg-red-50 border-2 border-red-500 text-red-800'
              } else {
                buttonClass = 'bg-gray-50 border-2 border-gray-200 text-gray-400'
              }
            } else if (isSelected) {
              buttonClass = 'bg-indigo-50 border-2 border-indigo-500 text-indigo-800'
            }

            const optionLabel = ['A', 'B', 'C', 'D'][index]

            return (
              <button
                key={index}
                onClick={() => handleSelectOption(index)}
                disabled={showResult}
                className={`w-full text-left p-4 rounded-xl transition-all ${buttonClass}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                    ${showResult && isCorrectAnswer ? 'bg-green-500 text-white' :
                      showResult && isSelected && !isCorrectAnswer ? 'bg-red-500 text-white' :
                      isSelected ? 'bg-indigo-500 text-white' :
                      'bg-gray-200 text-gray-600'}
                  `}>
                    {showResult && isCorrectAnswer ? '✓' :
                     showResult && isSelected && !isCorrectAnswer ? '✕' :
                     optionLabel}
                  </div>
                  <span className="text-sm leading-relaxed pt-1">{option}</span>
                </div>
              </button>
            )
          })}
        </div>

        {showResult && (
          <div className={`rounded-2xl p-4 mb-4 ${
            selectedIndex === currentQuestion.correctIndex
              ? 'bg-green-50 border-2 border-green-300'
              : 'bg-red-50 border-2 border-red-300'
          }`}>
            <p className={`font-bold mb-2 ${
              selectedIndex === currentQuestion.correctIndex ? 'text-green-700' : 'text-red-700'
            }`}>
              {selectedIndex === currentQuestion.correctIndex ? '🎉 정답!' : '❌ 아쉽다!'}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={selectedIndex === null}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            정답 확인하기
          </button>
        ) : (
          <button
            onClick={handleNext}
            className={`w-full text-white font-bold py-3 rounded-xl transition-colors ${
              dungeon.id === 1 ? 'bg-red-500 hover:bg-red-600' :
              dungeon.id === 2 ? 'bg-blue-500 hover:bg-blue-600' :
              dungeon.id === 3 ? 'bg-purple-500 hover:bg-purple-600' :
              'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isLastQuestion ? '🏆 결과 보기' : '다음 문제 →'}
          </button>
        )}
      </div>
    </div>
  )
}