import type { Question, Stage } from '@/data/quizData'

// 배열을 무작위로 섞기 (Fisher-Yates 셔플)
function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

// 문제 하나의 보기를 랜덤 순서로 섞기
// 정답 인덱스는 자동으로 새 위치 추적
// lockOptions: true면 안 섞고 그대로 반환 ("위 셋 다 맞다" 같은 순서 의존 문제용)
function shuffleOptions(question: Question): Question {
  // 보기 순서가 잠긴 문제는 그대로 반환
  if (question.lockOptions) {
    return question
  }
  
  const original = question.options.map((opt, idx) => ({
    text: opt,
    isCorrect: idx === question.correctIndex,
  }))
  
  const shuffled = shuffle(original)
  const newCorrectIndex = shuffled.findIndex(o => o.isCorrect)
  
  return {
    ...question,
    options: shuffled.map(o => o.text),
    correctIndex: newCorrectIndex,
  }
}

// 스테이지에서 매번 다른 문제 세트를 뽑아 보기 순서도 섞어 반환
//
// 매개변수:
// - stage: 어떤 스테이지에서 뽑을지
// - count: 몇 문제 뽑을지 (기본 3개, 보스는 4개)
//
// 동작:
// - 풀에 있는 문제 중 count개 만큼 무작위 선택
// - 풀이 count보다 작으면 전체 다 사용
// - 각 문제의 보기도 랜덤 순서로 섞기 (lockOptions: true는 예외)
export function pickQuestions(stage: Stage, count?: number): Question[] {
  const targetCount = count ?? (stage.isBoss ? 4 : 3)
  const pool = stage.questions
  
  // 풀이 요청 수보다 작으면 전체 사용
  const numToPick = Math.min(targetCount, pool.length)
  
  // 풀에서 랜덤하게 numToPick개 선택
  const shuffledPool = shuffle(pool)
  const selected = shuffledPool.slice(0, numToPick)
  
  // 각 문제의 보기도 섞기
  return selected.map(q => shuffleOptions(q))
}

// 난이도별 비례 추출 (Phase 2에서 사용 예정)
// 일단 만들어두고 지금은 안 쓰임
export function pickQuestionsByDifficulty(
  stage: Stage,
  easyCount: number = 1,
  mediumCount: number = 1,
  hardCount: number = 1,
): Question[] {
  const pool = stage.questions
  
  const easy = pool.filter(q => q.difficulty === 'easy')
  const medium = pool.filter(q => q.difficulty === 'medium' || !q.difficulty)
  const hard = pool.filter(q => q.difficulty === 'hard')
  
  const picked: Question[] = []
  picked.push(...shuffle(easy).slice(0, easyCount))
  picked.push(...shuffle(medium).slice(0, mediumCount))
  picked.push(...shuffle(hard).slice(0, hardCount))
  
  // 부족하면 전체에서 채움
  if (picked.length < easyCount + mediumCount + hardCount) {
    const remaining = pool.filter(q => !picked.find(p => p.id === q.id))
    const need = (easyCount + mediumCount + hardCount) - picked.length
    picked.push(...shuffle(remaining).slice(0, need))
  }
  
  // 문제 순서도 섞고, 보기도 섞기
  return shuffle(picked).map(q => shuffleOptions(q))
}