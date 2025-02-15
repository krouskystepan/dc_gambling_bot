import {
  SLOT_PROBABILITIES,
  SLOT_MULTIPLIERS,
  ALL_SYMBOLS,
} from './multipliers'

export const spinSlot = (): string => {
  const randomValue = Math.random()
  let cumulativeProbability = 0

  for (const [combination, probability] of Object.entries(SLOT_PROBABILITIES)) {
    cumulativeProbability += probability

    if (randomValue <= cumulativeProbability) {
      return combination
    }
  }

  return generateLosingCombination()
}

const generateLosingCombination = (): string => {
  const winningCombinations = new Set(Object.keys(SLOT_MULTIPLIERS))

  const allPossibleCombinations = ALL_SYMBOLS.flatMap((s1) =>
    ALL_SYMBOLS.flatMap((s2) => ALL_SYMBOLS.map((s3) => `${s1}${s2}${s3}`))
  )

  const losingCombinations = allPossibleCombinations.filter(
    (combo) => !winningCombinations.has(combo)
  )

  if (losingCombinations.length === 0) {
    throw new Error('No possible losing combinations!')
  }

  return losingCombinations[
    Math.floor(Math.random() * losingCombinations.length)
  ]
}

export const calculateWinnings = (result: string, bet: number): number => {
  return (SLOT_MULTIPLIERS[result] || 0) * bet
}

export const calculateRTP = (): number => {
  const totalExpectedReturn = Object.entries(SLOT_PROBABILITIES).reduce(
    (sum, [combination, probability]) =>
      sum + probability * (SLOT_MULTIPLIERS[combination] || 0),
    0
  )

  return totalExpectedReturn * 100
}
