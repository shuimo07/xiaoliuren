import { describe, it, expect } from 'vitest'
import { name, inject, Config, apply } from '../src/index.js'
import type { CastResult } from '../src/core/types.js'

/** 假 ctx：捕获 systemPrompt.section 与 tools.register 的调用。 */
function makeFakeCtx() {
  const sections: any[] = []
  const tools: any[] = []
  const ctx = {
    systemPrompt: {
      section: (section: any) => {
        sections.push(section)
        return () => {}
      },
    },
    tools: {
      register: (tool: any) => {
        tools.push(tool)
        return tool
      },
    },
  }
  return { ctx, sections, tools }
}

function applyPlugin() {
  const fake = makeFakeCtx()
  apply(fake.ctx as never, {})
  return fake
}

function assertValidCastResult(r: any): asserts r is CastResult {
  expect(r).toBeTypeOf('object')
  expect(['time', 'numbers', 'random']).toContain(r.mode)
  expect(r.input).toBeTypeOf('object')
  expect(Number.isInteger(r.input.month)).toBe(true)
  expect(Number.isInteger(r.input.day)).toBe(true)
  expect(Number.isInteger(r.input.hour)).toBe(true)
  expect(r.steps).toHaveLength(3)
  expect(typeof r.result.palace).toBe('string')
  expect(typeof r.result.verdict).toBe('string')
  expect(typeof r.result.advice).toBe('string')
  expect(typeof r.result.verse).toBe('string')
  expect(typeof r.disclaimer).toBe('string')
  expect(r.disclaimer.length).toBeGreaterThan(0)
}

describe('插件导出四元组', () => {
  it('name / inject / Config / apply 均存在且正确', () => {
    expect(name).toBe('tool-xiaoliuren')
    expect(inject).toContain('tools')
    expect(inject).toContain('systemPrompt')
    expect(Config).toBeDefined()
    expect(typeof apply).toBe('function')
  })

  it('注册一个名为 xiaoliuren 的工具，参数 schema 完整', () => {
    const { tools } = applyPlugin()
    expect(tools).toHaveLength(1)
    const tool = tools[0]
    expect(tool.name).toBe('xiaoliuren')
    expect(tool.description).toContain('小六壬')
    // defineTool 将参数 schema 编译为 { type:'object', properties:{...} }
    expect(tool.parameters.type).toBe('object')
    for (const key of ['mode', 'numbers', 'datetime', 'calendar', 'question']) {
      expect(tool.parameters.properties[key]).toBeDefined()
    }
  })

  it('注册 systemPrompt 段落（tool:xiaoliuren）', () => {
    const { sections } = applyPlugin()
    expect(sections).toHaveLength(1)
    expect(sections[0].name).toBe('tool:xiaoliuren')
    expect(sections[0].text).toContain('xiaoliuren')
    expect(sections[0].text).toContain('question')
  })

  it('非法配置抛错', () => {
    const fake = makeFakeCtx()
    expect(() => apply(fake.ctx as never, { calendar: 'bogus' })).toThrow(/calendar/)
    expect(() => apply(fake.ctx as never, { randomSource: 'bogus' })).toThrow(/randomSource/)
  })
})

describe('execute 三种 mode', () => {
  it('time：返回合法 CastResult 且 question 回显', async () => {
    const { tools } = applyPlugin()
    const r = await tools[0].execute({ mode: 'time', datetime: '2024-02-10T12:00:00', question: '这个项目能否成功' })
    assertValidCastResult(r)
    expect(r.mode).toBe('time')
    expect(r.question).toBe('这个项目能否成功')
    expect(r.input.date).toBe('2024-02-10')
    expect(r.result.verdict.length).toBeGreaterThan(0)
    expect(r.result.advice.length).toBeGreaterThan(0)
    expect(r.disclaimer).toContain('不构成任何专业建议')
  })

  it('numbers：返回合法 CastResult，question 缺省为 null', async () => {
    const { tools } = applyPlugin()
    const r = await tools[0].execute({ mode: 'numbers', numbers: [3, 15, 5] })
    assertValidCastResult(r)
    expect(r.mode).toBe('numbers')
    expect(r.input).toMatchObject({ month: 3, day: 15, hour: 5 })
    expect(r.question).toBeNull()
  })

  it('random：返回合法 CastResult', async () => {
    const { tools } = applyPlugin()
    const r = await tools[0].execute({ mode: 'random' })
    assertValidCastResult(r)
    expect(r.mode).toBe('random')
  })

  it('numbers 缺参抛中文错误', async () => {
    const { tools } = applyPlugin()
    await expect(tools[0].execute({ mode: 'numbers' })).rejects.toThrow(/报数/)
  })
})

describe('render：结论优先、简洁、含免责声明', () => {
  it('首屏含「结论」与免责声明，question 行正确', async () => {
    const { tools } = applyPlugin()
    const args = { mode: 'numbers', numbers: [3, 15, 5], question: '这个项目能否成功' }
    const r = await tools[0].execute(args)
    const blocks = tools[0].output.render(args, r)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe('text')
    const text = blocks[0].text
    expect(text).toContain('【小六壬】结果')
    expect(text).toContain('所问：这个项目能否成功')
    expect(text).toContain('起卦：报数（3·15·5）')
    expect(text).toContain('结论：')
    expect(text).toContain('——')
    expect(text).toContain('※ 以上为传统民俗文化娱乐参考，不构成任何专业建议。')
  })

  it('无 question 时省略所问行', async () => {
    const { tools } = applyPlugin()
    const args = { mode: 'random' }
    const r = await tools[0].execute(args)
    const text = tools[0].output.render(args, r)[0].text
    expect(text).not.toContain('所问：')
    expect(text).toContain('※ 以上为传统民俗文化娱乐参考，不构成任何专业建议。')
  })
})
