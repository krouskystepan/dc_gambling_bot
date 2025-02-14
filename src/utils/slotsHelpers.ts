import {
  SLOT_PROBABILITIES,
  SLOT_MULTIPLIERS,
  ALL_SYMBOLS,
} from './multiplayers'

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

export const BET_CHOICES = [
  {
    label: '100',
    value: 100,
  },
  {
    label: '250',
    value: 250,
  },
  {
    label: '500',
    value: 500,
  },
  {
    label: '1k',
    value: 1_000,
  },
  {
    label: '2.5k',
    value: 2_500,
  },
  {
    label: '5k',
    value: 5_000,
  },
  {
    label: '10k',
    value: 10_000,
  },
  {
    label: '25k',
    value: 25_000,
  },
  {
    label: '50k',
    value: 50_000,
  },
  {
    label: '100k',
    value: 100_000,
  },
  {
    label: '250k',
    value: 250_000,
  },
  {
    label: '500k',
    value: 500_000,
  },
  {
    label: '1M',
    value: 1_000_000,
  },
]
