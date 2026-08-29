export type RandomSource = () => number

export const cryptoRandom: RandomSource = () => {
  const buffer = new Uint32Array(1)
  crypto.getRandomValues(buffer)
  return buffer[0] / 2 ** 32
}

export function pickIndex(fractions: number[], random: RandomSource): number {
  let remaining = random()
  for (let i = 0; i < fractions.length; i++) {
    remaining -= fractions[i]
    if (remaining < 0) return i
  }
  return fractions.length - 1
}
