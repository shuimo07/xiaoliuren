import { describe, it, expect } from 'vitest'
import { shichenFromHour, shichenName, solarToLunar, castTime } from '../src/core/index.js'

describe('shichenFromHour（十二时辰映射）', () => {
  it('边界：0→子(1)、1→丑(2)、22→亥(12)、23→子(1)', () => {
    expect(shichenFromHour(0)).toBe(1)
    expect(shichenFromHour(1)).toBe(2)
    expect(shichenFromHour(22)).toBe(12)
    expect(shichenFromHour(23)).toBe(1)
  })

  it('抽样：12→午(7)、13→未(8)、3→寅(3)', () => {
    expect(shichenFromHour(12)).toBe(7)
    expect(shichenFromHour(13)).toBe(8)
    expect(shichenFromHour(3)).toBe(3)
  })

  it('非法小时抛中文错误', () => {
    expect(() => shichenFromHour(-1)).toThrow(/0–23/)
    expect(() => shichenFromHour(24)).toThrow(/0–23/)
    expect(() => shichenFromHour(1.5)).toThrow(/0–23/)
  })
})

describe('shichenName', () => {
  it('1–12 对应 子…亥', () => {
    const names = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
    names.forEach((n, i) => {
      expect(shichenName(i + 1)).toBe(n)
    })
  })

  it('越界抛中文错误', () => {
    expect(() => shichenName(0)).toThrow(/1–12/)
    expect(() => shichenName(13)).toThrow(/1–12/)
  })
})

describe('lateZiShiRollover（晚子时滚日开关）', () => {
  it('默认不滚日：23:30 仍算当日', () => {
    const r = castTime('2024-01-31T23:30:00')
    expect(r.input).toMatchObject({ month: 1, day: 31, hour: 1, shichen: '子' })
  })

  it('开启后日号 +1（含月末进位）', () => {
    const r = castTime('2024-01-31T23:30:00', { lateZiShiRollover: true })
    expect(r.input).toMatchObject({ month: 2, day: 1, hour: 1 })
  })

  it('开启后跨年进位', () => {
    const r = castTime('2024-12-31T23:30:00', { lateZiShiRollover: true })
    expect(r.input).toMatchObject({ month: 1, day: 1 })
  })

  it('23 点之前不受开关影响', () => {
    const r = castTime('2024-01-31T22:59:00', { lateZiShiRollover: true })
    expect(r.input).toMatchObject({ month: 1, day: 31 })
  })
})

describe('solarToLunar（内置紧凑农历表）', () => {
  it('已知农历日期抽样（三个春节）', () => {
    expect(solarToLunar(new Date(2024, 1, 10))).toMatchObject({ year: 2024, month: 1, day: 1, isLeap: false })
    expect(solarToLunar(new Date(2023, 0, 22))).toMatchObject({ year: 2023, month: 1, day: 1 })
    expect(solarToLunar(new Date(2000, 1, 5))).toMatchObject({ year: 2000, month: 1, day: 1 })
  })

  it('1900-01-31 为换算起点', () => {
    expect(solarToLunar(new Date(1900, 0, 31))).toMatchObject({ year: 1900, month: 1, day: 1 })
  })

  it('范围外抛中文错误', () => {
    expect(() => solarToLunar(new Date(1899, 11, 31))).toThrow(/1900/)
    // 农历 2100 年（数据表最后一年）可延伸到 2101 年初，更晚的日期才越界
    expect(() => solarToLunar(new Date(2101, 11, 31))).toThrow(/2100/)
  })

  it('castTime 的 lunar 历法使用农历月日', () => {
    const r = castTime('2024-02-10T12:00:00', { calendar: 'lunar' })
    expect(r.input).toMatchObject({ month: 1, day: 1 })
  })
})
