// Násobitel výhry pro hru s kostkou.
// Hráč vyhraje 5× svou sázku, pokud uhodne správné číslo (1–6).
// Očekávaný návrat je nižší než 1, což zajišťuje zisk pro kasino.
export const DICE_WIN_MULTIPLIER = 5

// Násobitel výhry pro hru s mincí.
// Hráč vyhraje 1,9× svou sázku, pokud uhodne správnou stranu (panna/orel).
// Tento násobitel je mírně pod férovými 2×, což dává kasinu výhodu.
export const COINFLIP_WIN_MULTIPLIER = 1.9

export const SLOT_MULTIPLIERS = {
  '🍒🍒🍒': 3, // Trochu zvýšený multiplikátor pro časté výhry
  '🍋🍋🍋': 5, // Vyšší multiplikátor pro střední výhry
  '🍊🍊🍊': 8, // Mírně vyšší multiplikátor pro středně vzácné výhry
  '🍉🍉🍉': 10, // Vyšší multiplikátor pro vzácné výhry
  '⭐⭐⭐': 15, // Vysoký multiplikátor pro velmi vzácné výhry
  '🔔🔔🔔': 20, // Ještě vyšší multiplikátor pro vzácnější výhry
  '7️⃣7️⃣7️⃣': 100, // Nejvyšší multiplikátor pro extrémně vzácné výhry
}

export const SLOT_PROBABILITIES = {
  '🍒🍒🍒': 0.05, // Vysoká pravděpodobnost pro časté výhry
  '🍋🍋🍋': 0.033, // Snížená pravděpodobnost pro střední výhry
  '🍊🍊🍊': 0.012, // Mírně nižší pravděpodobnost pro středně vzácné výhry
  '🍉🍉🍉': 0.011, // Snížená pravděpodobnost pro vzácné výhry
  '⭐⭐⭐': 0.009, // Mírně vzácná kombinace
  '🔔🔔🔔': 0.007, // Velmi vzácná kombinace
  '7️⃣7️⃣7️⃣': 0.0008, // Nejvzácnější kombinace
}

export const ALL_SYMBOLS = ['🍒', '🍋', '🍊', '🍉', '⭐', '🔔', '7️⃣']
