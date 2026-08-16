import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { castTime, castNumbers, castRandom, validateNumbers } from './core/index.js'
import { renderCard } from './render.js'
import type { CastResult } from './core/types.js'

// 再导出核心库公共 API：本包既是库/CLI，也是 DSH 插件
export * from './core/index.js'

/** 插件名（DSH 四元组之一） */
export const name = 'tool-xiaoliuren'

/** 依赖注入的服务（DSH 四元组之一） */
export const inject = ['tools', 'systemPrompt']

/** 插件配置 schema（DSH 四元组之一；Loader 未规范化时也由 resolveConfig 兜底） */
export const Config = z.object({
  calendar: z.union(['solar', 'lunar']).default('solar'),
  randomSource: z.union(['crypto', 'math']).default('crypto'),
  disclaimer: z.string().default('以上为传统民俗文化娱乐参考，不构成任何专业建议。'),
})

const DEFAULT_DISCLAIMER = '以上为传统民俗文化娱乐参考，不构成任何专业建议。'

interface PluginConfigInput {
  calendar?: unknown
  randomSource?: unknown
  disclaimer?: unknown
}

interface ResolvedConfig {
  calendar: 'solar' | 'lunar'
  randomSource: 'crypto' | 'math'
  disclaimer: string
}

/** 对缺失项给默认值并校验，返回 resolved。 */
function resolveConfig(config: PluginConfigInput = {}): ResolvedConfig {
  const calendar = config.calendar ?? 'solar'
  const randomSource = config.randomSource ?? 'crypto'
  const disclaimer = config.disclaimer ?? DEFAULT_DISCLAIMER
  if (calendar !== 'solar' && calendar !== 'lunar') {
    throw new TypeError(`calendar 必须是 solar 或 lunar，收到：${String(calendar)}`)
  }
  if (randomSource !== 'crypto' && randomSource !== 'math') {
    throw new TypeError(`randomSource 必须是 crypto 或 math，收到：${String(randomSource)}`)
  }
  if (typeof disclaimer !== 'string' || disclaimer.length === 0) {
    throw new TypeError('disclaimer 必须是非空字符串')
  }
  return { calendar, randomSource, disclaimer }
}

/** apply 所需的最小 ctx 结构（systemPrompt + tools），便于独立测试。 */
interface PluginContext {
  systemPrompt: {
    section(section: { name: string; order: number; text: string }): () => void
  }
  tools: {
    register(tool: unknown): unknown
  }
}

/** 插件本体：注册系统提示段落 + xiaoliuren 工具（DSH 四元组之一）。 */
export function apply(ctx: PluginContext, config?: PluginConfigInput): void {
  const resolved = resolveConfig(config)

  ctx.systemPrompt.section({
    name: 'tool:xiaoliuren',
    order: 120,
    text: '当用户询问小六壬/马前课/占卜/起卦时，调用 xiaoliuren 工具；若用户说清所问之事，务必填入 question 参数。返回后，用一两句大白话结合用户的问题转述"结论/建议"，不要只报卦名，也不要说成确定性预言；结论仅代表传统民俗文化娱乐参考，必须保留免责声明。',
  })

  ctx.tools.register(defineTool({
    name: 'xiaoliuren',
    description: '小六壬占卜：按时间、报数或随机起卦，返回白话成败结论、掌诀排盘、吉凶、五行、方位、神煞与断辞（仅供传统文化娱乐参考）。',
    parameters: {
      mode: { type: 'string', enum: ['time', 'numbers', 'random'], description: '起卦方式' },
      numbers: { type: 'array', items: { type: 'integer' }, description: '报数 1–3 个正整数（mode=numbers 时用）' },
      datetime: { type: 'string', description: 'ISO8601 时间（mode=time 时用，缺省=当前时间）' },
      calendar: { type: 'string', enum: ['solar', 'lunar'], description: '时间起卦用公历还是农历' },
      question: { type: 'string', description: '所问之事，例如"这个项目能否成功"；仅用于结论表述，不参与起卦' },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          mode: { type: 'string', required: true },
          input: {
            type: 'object',
            required: true,
            additionalProperties: false,
            properties: {
              month: { type: 'integer', required: true },
              day: { type: 'integer', required: true },
              hour: { type: 'integer', required: true },
              date: { type: 'string' },
              shichen: { type: 'string' },
            },
          },
          question: { oneOf: [{ type: 'string' }, { type: 'null' }], required: true },
          steps: {
            type: 'array',
            required: true,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                phase: { type: 'string', required: true },
                number: { type: 'integer', required: true },
                palace: { type: 'string', required: true },
                index: { type: 'integer', required: true },
              },
            },
          },
          result: {
            type: 'object',
            required: true,
            additionalProperties: false,
            properties: {
              palace: { type: 'string', required: true },
              index: { type: 'integer', required: true },
              auspicious: { type: 'boolean', required: true },
              verdict: { type: 'string', required: true },
              advice: { type: 'string', required: true },
              wuxing: { type: 'string', required: true },
              direction: { type: 'string', required: true },
              shensha: { type: 'string', required: true },
              verse: { type: 'string', required: true },
              interpretation: { type: 'string', required: true },
            },
          },
          disclaimer: { type: 'string', required: true },
        },
      },
      render: (_args, value) => [{ type: 'text', text: renderCard(value as unknown as CastResult) }],
    },
    async execute(args) {
      const mode = args.mode ?? 'time'
      const r =
        mode === 'numbers'
          ? castNumbers(validateNumbers(args.numbers), {
              calendar: resolved.calendar,
              disclaimer: resolved.disclaimer,
            })
          : mode === 'random'
            ? castRandom({ randomSource: resolved.randomSource, disclaimer: resolved.disclaimer })
            : castTime(args.datetime, { calendar: resolved.calendar, disclaimer: resolved.disclaimer })
      return { ...r, question: args.question ?? null }
    },
    presentCall: (args) => ({ card: 'generic', title: '小六壬', rawInput: String(args.mode ?? 'time') }),
    presentResult: () => ({ card: 'generic' }),
  }))
}
