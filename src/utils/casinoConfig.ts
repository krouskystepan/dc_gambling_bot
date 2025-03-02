// Násobitel výhry pro hru s kostkou.
// Hráč vyhraje 5× svou sázku, pokud uhodne správné číslo (1–6).
// Očekávaný návrat je nižší než 1, což zajišťuje zisk pro kasino.
export const DICE_WIN_MULTIPLIER = 5
export const DICE_MAX_BET = 3000

// Násobitel výhry pro hru s mincí.
// Hráč vyhraje 1,9× svou sázku, pokud uhodne správnou stranu (panna/orel).
// Tento násobitel je mírně pod férovými 2×, což dává kasinu výhodu.
export const COINFLIP_WIN_MULTIPLIER = 1.9
export const COINFLIP_MAX_BET = 3000

export const SLOT_MULTIPLIERS = {
  '🍒🍒🍒': 5,
  '🍋🍋🍋': 10,
  '🍉🍉🍉': 20,
  '🔔🔔🔔': 50,
  '7️⃣7️⃣7️⃣': 100,
}
export const SYMBOL_WEIGHTS = {
  '🍒': 35,
  '🍋': 25,
  '🍉': 10,
  '🔔': 4,
  '7️⃣': 2,
}
export const WEIGHTED_SYMBOLS = Object.entries(SYMBOL_WEIGHTS).flatMap(
  ([symbol, weight]) => Array(weight).fill(symbol)
)
export const SLOT_MAX_BET = 1000
// export const BLACKJACK_MAX_BET = 3000
