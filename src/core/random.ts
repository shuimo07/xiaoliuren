import type { RandomSource } from './types.js'

/** mulberry32：小巧的确定性 PRNG，返回 [0,1) 浮点数，同一种子序列可复现。 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type CryptoLike = { getRandomValues<T extends ArrayBufferView | null>(array: T): T }

/**
 * 生成一个返回 [0,1) 随机数的函数（可注入随机源）：
 * - 'crypto'（默认）：crypto.getRandomValues，加密级随机；
 * - 'math'：Math.random；
 * - { seed }：确定性 PRNG，同一种子可复现（供测试）。
 */
export function makeRng(source: RandomSource = 'crypto'): () => number {
  if (typeof source === 'object') {
    const { seed } = source
    if (!Number.isInteger(seed)) {
      throw new Error(`随机种子必须是整数，收到：${seed}`)
    }
    return mulberry32(seed)
  }
  if (source === 'crypto') {
    const cryptoGlobal = (globalThis as { crypto?: CryptoLike }).crypto
    if (!cryptoGlobal || typeof cryptoGlobal.getRandomValues !== 'function') {
      throw new Error('当前环境不支持 crypto.getRandomValues，请改用 randomSource: "math" 或 { seed }')
    }
    return () => cryptoGlobal.getRandomValues(new Uint32Array(1))[0] / 4294967296
  }
  if (source === 'math') {
    return Math.random
  }
  throw new Error(`未知的随机源：${String(source)}`)
}
