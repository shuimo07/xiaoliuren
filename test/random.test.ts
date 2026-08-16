import { describe, it, expect } from 'vitest'
import { makeRng, castRandom } from '../src/core/index.js'

describe('makeRng（可注入随机源）', () => {
  it('{ seed } 可复现：同种子序列完全一致', () => {
    const a = makeRng({ seed: 42 })
    const b = makeRng({ seed: 42 })
    const seqA = [a(), a(), a(), a(), a()]
    const seqB = [b(), b(), b(), b(), b()]
    expect(seqA).toEqual(seqB)
  })

  it('不同种子序列不同', () => {
    const a = makeRng({ seed: 1 })
    const b = makeRng({ seed: 2 })
    expect([a(), a(), a()]).not.toEqual([b(), b(), b()])
  })

  it('crypto / math 输出落在 [0,1)', () => {
    for (let i = 0; i < 100; i++) {
      const c = makeRng('crypto')()
      expect(c).toBeGreaterThanOrEqual(0)
      expect(c).toBeLessThan(1)
      const m = makeRng('math')()
      expect(m).toBeGreaterThanOrEqual(0)
      expect(m).toBeLessThan(1)
    }
  })

  it('非法种子抛中文错误', () => {
    expect(() => makeRng({ seed: 1.5 })).toThrow(/整数/)
    expect(() => makeRng('unknown' as never)).toThrow(/未知的随机源/)
  })
})

describe('castRandom', () => {
  it('月/日/时范围正确且结果自洽', () => {
    for (let i = 0; i < 50; i++) {
      const r = castRandom({ randomSource: { seed: i } })
      expect(r.input.month).toBeGreaterThanOrEqual(1)
      expect(r.input.month).toBeLessThanOrEqual(12)
      expect(r.input.day).toBeGreaterThanOrEqual(1)
      expect(r.input.day).toBeLessThanOrEqual(30)
      expect(r.input.hour).toBeGreaterThanOrEqual(1)
      expect(r.input.hour).toBeLessThanOrEqual(12)
      expect(r.result.index).toBe(r.steps[2].index)
      expect(r.result.palace).toBe(r.steps[2].palace)
    }
  })

  it('同一 seed 起卦结果一致（可复现）', () => {
    const a = castRandom({ randomSource: { seed: 123 } })
    const b = castRandom({ randomSource: { seed: 123 } })
    expect(a.input).toEqual(b.input)
    expect(a.result.palace).toBe(b.result.palace)
  })

  it('默认 disclaimer 存在', () => {
    const r = castRandom()
    expect(r.disclaimer).toContain('民俗文化')
  })
})
