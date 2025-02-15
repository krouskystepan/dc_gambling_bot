import { SLOT_MULTIPLIERS, WEIGHTED_SYMBOLS } from './multipliers'

export function spinSlot() {
  return (
    WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)] +
    WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)] +
    WEIGHTED_SYMBOLS[Math.floor(Math.random() * WEIGHTED_SYMBOLS.length)]
  )
}

export const calculateWinnings = (result: string, bet: number): number => {
  return (SLOT_MULTIPLIERS[result] || 0) * bet
}

export const calculateRTP = (iterations: number): number => {
  let totalWinnings = 0
  let totalBet = 0

  for (let i = 0; i < iterations; i++) {
    const bet = 1
    totalBet += bet

    const result = spinSlot()
    const winnings = SLOT_MULTIPLIERS[result]
      ? bet * SLOT_MULTIPLIERS[result]
      : 0

    totalWinnings += winnings
  }

  return (totalWinnings / totalBet) * 100
}
