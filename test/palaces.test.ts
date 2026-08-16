import { describe, it, expect } from 'vitest'
import { PALACES, getPalace } from '../src/core/index.js'

describe('六宫数据表', () => {
  it('共六宫，顺序固定（数组下标 0..5 = 序 1..6）', () => {
    expect(PALACES).toHaveLength(6)
    expect(PALACES.map((p) => p.name)).toEqual(['大安', '留连', '速喜', '赤口', '小吉', '空亡'])
    PALACES.forEach((p, i) => {
      expect(p.index).toBe(i + 1)
    })
  })

  it('verdict / advice / verse / interpretation 均非空', () => {
    for (const p of PALACES) {
      expect(p.verdict.length).toBeGreaterThan(0)
      expect(p.advice.length).toBeGreaterThan(0)
      expect(p.verse.length).toBeGreaterThan(0)
      expect(p.interpretation.length).toBeGreaterThan(0)
      expect(p.wuxing.length).toBeGreaterThan(0)
      expect(p.direction.length).toBeGreaterThan(0)
      expect(p.shensha.length).toBeGreaterThan(0)
    }
  })

  it('吉宫 verdict 偏成功取向、凶宫 verdict 偏波折取向', () => {
    for (const p of PALACES) {
      if (p.auspicious) {
        expect(p.verdict).toMatch(/成功|顺利|吉|成/)
      } else {
        expect(p.verdict).toMatch(/拖延|阻力|落空|口舌|难/)
      }
    }
  })

  it('getPalace 按 1-based 取宫', () => {
    expect(getPalace(1).name).toBe('大安')
    expect(getPalace(6).name).toBe('空亡')
    expect(getPalace(3)).toBe(PALACES[2])
  })

  it('越界抛中文错误', () => {
    expect(() => getPalace(0)).toThrow(/宫序/)
    expect(() => getPalace(7)).toThrow(/宫序/)
    expect(() => getPalace(1.5)).toThrow(/宫序/)
    expect(() => getPalace(NaN)).toThrow(/宫序/)
  })
})
