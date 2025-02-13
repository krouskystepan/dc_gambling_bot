import {
  SLOT_PROBABILITIES,
  SLOT_MULTIPLIERS,
  ALL_SYMBOLS,
} from './multiplayers'

export const spinSlot = (): string => {
  const randomValue = Math.random()
  let cumulativeProbability = 0

  // Check if the spin results in a winning combination
  for (const combination in SLOT_PROBABILITIES) {
    cumulativeProbability += SLOT_PROBABILITIES[combination]

    if (randomValue <= cumulativeProbability) {
      return combination // Return a winning combination
    }
  }

  // If no winning combination was selected, return a random **losing** combination
  return generateLosingCombination()
}

const generateLosingCombination = (): string => {
  while (true) {
    const spin = [
      ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)],
      ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)],
      ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)],
    ].join('')

    // If the result isn't in the winning list, return it as a losing combination
    if (!SLOT_MULTIPLIERS[spin]) {
      return spin
    }
  }
}

export const calculateWinnings = (result: string, bet: number): number => {
  return SLOT_MULTIPLIERS[result] ? bet * SLOT_MULTIPLIERS[result] : 0
}

export const calculateRTP = (): number => {
  let totalExpectedReturn = 0

  for (const combination in SLOT_PROBABILITIES) {
    const probability = SLOT_PROBABILITIES[combination]
    const multiplier = SLOT_MULTIPLIERS[combination]

    totalExpectedReturn += probability * multiplier
  }

  return totalExpectedReturn * 100 // Convert to percentage
}
