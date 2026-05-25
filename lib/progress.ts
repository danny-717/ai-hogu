import { supabase } from './supabase'
import { dungeons } from '@/data/quizData'

export type StageProgress = {
  stageId: string
  stars: number
  cleared: boolean
}

export type DungeonProgress = {
  dungeonId: number
  totalStages: number
  clearedStages: number
  totalStars: number
  maxStars: number
  isUnlocked: boolean
  isCompleted: boolean
}

export async function getUserProgress(userId: string): Promise<StageProgress[]> {
  const { data, error } = await supabase
    .from('progress')
    .select('stage_id, stars')
    .eq('user_id', userId)

  if (error || !data) return []

  return data.map(row => ({
    stageId: row.stage_id,
    stars: row.stars,
    cleared: row.stars > 0,
  }))
}

export function calculateDungeonProgress(
  allProgress: StageProgress[]
): DungeonProgress[] {
  return dungeons.map((dungeon, idx) => {
    const stageProgresses = dungeon.stages.map(stage => {
      const found = allProgress.find(p => p.stageId === stage.id)
      return {
        stageId: stage.id,
        stars: found?.stars || 0,
        cleared: (found?.stars || 0) > 0,
        isBoss: stage.isBoss,
      }
    })

    const clearedStages = stageProgresses.filter(s => s.cleared).length
    const totalStages = dungeon.stages.length
    const totalStars = stageProgresses.reduce((sum, s) => sum + s.stars, 0)
    const maxStars = totalStages * 3
    const isCompleted = clearedStages === totalStages

    let isUnlocked = false
    if (idx === 0) {
      isUnlocked = true
    } else {
      const allPrevProgress = allProgress.filter(p =>
        dungeons[idx - 1].stages.some(s => s.id === p.stageId)
      )
      const prevCleared = allPrevProgress.filter(p => p.stars > 0).length
      isUnlocked = prevCleared === dungeons[idx - 1].stages.length
    }

    return {
      dungeonId: dungeon.id,
      totalStages,
      clearedStages,
      totalStars,
      maxStars,
      isUnlocked,
      isCompleted,
    }
  })
}

export function calculateTotalScore(allProgress: StageProgress[]): number {
  let score = 0
  for (const dungeon of dungeons) {
    for (const stage of dungeon.stages) {
      const found = allProgress.find(p => p.stageId === stage.id)
      if (found) {
        score += stage.isBoss ? found.stars * 20 : found.stars * 10
      }
    }
  }
  return score
}