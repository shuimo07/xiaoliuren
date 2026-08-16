import { describe, it, expect } from 'vitest'
import {
  compute,
  advance,
  renderSteps,
  validateNumbers,
  castNumbers,
  castTime,
  castRandom,
} from '../src/core/index.js'

describe('数法公式（核心）', () => {
  it('已知向量：(1,1,1)=大安、(6,1,1)=空亡、(7,1,1)=大安', () => {
    expect(compute(1, 1, 1).result).toMatchObject({ index: 1, palace: '大安' })
    expect(compute(6, 1, 1).result).toMatchObject({ index: 6, palace: '空亡' })
    expect(compute(7, 1, 1).result).toMatchObject({ index: 1, palace: '大安' })
  })

  it('等价公式 finalIndex = ((month + day + hour - 3) % 6) + 1', () => {
    for (const [m, d, h] of [[3, 15, 5], [1000, 2000, 3000], [6, 6, 6], [12, 30, 12], [1, 28, 9]]) {
      const expected = ((m + d + h - 3) % 6) + 1
      expect(compute(m, d, h).result.index).toBe(expected)
    }
  })

  it('advance：当前宫算 1，模 6 回绕', () => {
    expect(advance(1, 1)).toBe(1)
    expect(advance(6, 1)).toBe(6)
    expect(advance(6, 2)).toBe(1)
    expect(advance(1, 7)).toBe(1)
    expect(advance(1, 6)).toBe(6)
    expect(advance(3, 15)).toBe(5)
  })

  it('逐步排盘 steps 与最终结果一致（含宫名/宫序）', () => {
    const { steps, result } = compute(3, 15, 5)
    expect(steps).toHaveLength(3)
    expect(steps[0]).toEqual({ phase: '月', number: 3, palace: '速喜', index: 3 })
    expect(steps[1]).toEqual({ phase: '日', number: 15, palace: '小吉', index: 5 })
    expect(steps[2]).toEqual({ phase: '时', number: 5, palace: '速喜', index: 3 })
    expect(steps[2].index).toBe(result.index)
    expect(steps[2].palace).toBe(result.palace)
  })

  it('大数/回绕：每一步都从前一步落点继续，最终一致', () => {
    const { steps, result } = compute(1000, 2000, 3000)
    expect(steps[0].index).toBe(advance(1, 1000))
    expect(steps[1].index).toBe(advance(steps[0].index, 2000))
    expect(steps[2].index).toBe(advance(steps[1].index, 3000))
    expect(result.index).toBe(steps[2].index)
    expect(result.index).toBe(4) // 赤口
  })

  it('renderSteps 独立可用且逐步连续', () => {
    const steps = renderSteps(12, 30, 9)
    expect(steps[1].index).toBe(advance(steps[0].index, 30))
    expect(steps[2].index).toBe(advance(steps[1].index, 9))
    expect(steps.map((s) => s.phase)).toEqual(['月', '日', '时'])
  })
})

describe('validateNumbers', () => {
  it('接受 1–3 个正整数', () => {
    expect(validateNumbers([3])).toEqual([3])
    expect(validateNumbers([3, 15])).toEqual([3, 15])
    expect(validateNumbers([3, 15, 5])).toEqual([3, 15, 5])
  })

  it('长度 0 / 4 抛中文错误', () => {
    expect(() => validateNumbers([])).toThrow(/至少需要报 1 个数/)
    expect(() => validateNumbers([1, 2, 3, 4])).toThrow(/最多只能报 3 个数/)
  })

  it('非正整数抛中文错误', () => {
    expect(() => validateNumbers([0])).toThrow(/正整数/)
    expect(() => validateNumbers([-1])).toThrow(/正整数/)
    expect(() => validateNumbers([1.5])).toThrow(/正整数/)
    expect(() => validateNumbers(['3'])).toThrow(/正整数/)
    expect(() => validateNumbers(undefined)).toThrow(/数组/)
  })
})

describe('castNumbers 缺省补齐逻辑', () => {
  const now = new Date(2024, 1, 20, 15, 30) // 2024-02-20 15:30 → 申时(9)

  it('[n] → 月为报数，日/时取当前', () => {
    const r = castNumbers([3], { now })
    expect(r.mode).toBe('numbers')
    expect(r.input).toMatchObject({ month: 3, day: 20, hour: 9, shichen: '申' })
  })

  it('[n,m] → 月/日为报数，时取当前', () => {
    const r = castNumbers([3, 15], { now })
    expect(r.input).toMatchObject({ month: 3, day: 15, hour: 9 })
  })

  it('[n,m,k] → 全用报数', () => {
    const r = castNumbers([3, 15, 5], { now })
    expect(r.input).toMatchObject({ month: 3, day: 15, hour: 5 })
  })

  it('大数报数展示保留原数（公式取模）', () => {
    const r = castNumbers([1000, 2000, 3000])
    expect(r.input).toMatchObject({ month: 1000, day: 2000, hour: 3000 })
    expect(r.result.index).toBe(((1000 + 2000 + 3000 - 3) % 6) + 1)
  })
})

describe('castTime / castRandom', () => {
  it('castTime 指定时间：月/日/时/时辰名/日期', () => {
    const r = castTime('2024-02-10T12:00:00')
    expect(r.mode).toBe('time')
    expect(r.input).toMatchObject({ month: 2, day: 10, hour: 7, shichen: '午', date: '2024-02-10' })
    expect(r.steps).toHaveLength(3)
  })

  it('castTime 纯日期字符串按本地时间解析', () => {
    const r = castTime('2024-02-10')
    expect(r.input).toMatchObject({ month: 2, day: 10 })
  })

  it('castRandom 月∈1..12、日∈1..30、时∈1..12', () => {
    for (let i = 0; i < 20; i++) {
      const r = castRandom({ randomSource: { seed: i } })
      expect(r.mode).toBe('random')
      expect(r.input.month).toBeGreaterThanOrEqual(1)
      expect(r.input.month).toBeLessThanOrEqual(12)
      expect(r.input.day).toBeGreaterThanOrEqual(1)
      expect(r.input.day).toBeLessThanOrEqual(30)
      expect(r.input.hour).toBeGreaterThanOrEqual(1)
      expect(r.input.hour).toBeLessThanOrEqual(12)
      expect(r.result.index).toBe(r.steps[2].index)
    }
  })

  it('disclaimer 默认与覆盖', () => {
    expect(castTime('2024-02-10T12:00:00').disclaimer).toContain('民俗文化')
    expect(castTime('2024-02-10T12:00:00', { disclaimer: '自定义免责' }).disclaimer).toBe('自定义免责')
  })

  it('castTime 非法时间抛中文错误', () => {
    expect(() => castTime('not-a-date')).toThrow(/无法解析/)
  })
})
