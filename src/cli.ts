import { castTime, castNumbers, castRandom } from './core/index.js'
import { renderCard } from './render.js'
import type { CastResult, Calendar } from './core/types.js'

const USAGE = `小六壬占卜 CLI —— 用法：
  xiaoliuren [mode] [选项] [数字...]

模式（缺省 time）：
  time      时间起卦（--datetime 缺省为当前时间；--calendar solar|lunar）
  numbers   报数起卦：1–3 个正整数，依次为 月/日/时（缺的尾部用当前时间补齐）
  random    随机起卦（--seed 可复现）

全局选项：
  --datetime <ISO>            ISO8601 时间（time 模式）
  --calendar <solar|lunar>    时间起卦用公历还是农历，缺省 solar
  --seed <整数>               随机种子（random 模式，同种子结果可复现）
  --question <文本>           所问之事（仅用于结论表述，不参与起卦）
  --json                      输出原始 JSON（CastResult 结构）
  -h, --help                  显示本帮助

示例：
  xiaoliuren
  xiaoliuren time --datetime 2024-02-10T12:00:00 --question "这个项目能否成功"
  xiaoliuren time --calendar lunar
  xiaoliuren numbers 3 15 5
  xiaoliuren random --seed 42 --json
`

interface CliOptions {
  mode: 'time' | 'numbers' | 'random'
  datetime?: string
  calendar?: Calendar
  seed?: number
  question?: string
  numbers: string[]
  json: boolean
  help: boolean
}

/** 纯 process.argv 解析：返回选项，或 { error }（中文错误信息）。 */
function parseArgs(argv: string[]): CliOptions | { error: string } {
  const options: CliOptions = { mode: 'time', numbers: [], json: false, help: false }
  const positionals: string[] = []
  let i = 0
  while (i < argv.length) {
    const arg = argv[i]
    if (arg === '--json') {
      options.json = true
    } else if (arg === '-h' || arg === '--help') {
      options.help = true
    } else if (arg === '--datetime') {
      const value = argv[i + 1]
      if (value === undefined) return { error: '--datetime 缺少参数值' }
      options.datetime = value
      i += 1
    } else if (arg === '--calendar') {
      const value = argv[i + 1]
      if (value === undefined) return { error: '--calendar 缺少参数值' }
      if (value !== 'solar' && value !== 'lunar') {
        return { error: `--calendar 只能是 solar 或 lunar，收到：${value}` }
      }
      options.calendar = value
      i += 1
    } else if (arg === '--seed') {
      const value = argv[i + 1]
      if (value === undefined) return { error: '--seed 缺少参数值' }
      const seed = Number(value)
      if (!Number.isSafeInteger(seed)) {
        return { error: `--seed 必须是整数，收到：${value}` }
      }
      options.seed = seed
      i += 1
    } else if (arg === '--question') {
      const value = argv[i + 1]
      if (value === undefined) return { error: '--question 缺少参数值' }
      options.question = value
      i += 1
    } else if (arg.startsWith('-')) {
      return { error: `未知选项：${arg}` }
    } else {
      positionals.push(arg)
    }
    i += 1
  }

  if (positionals.length > 0) {
    const first = positionals[0]
    if (first === 'time' || first === 'numbers' || first === 'random') {
      options.mode = first
      options.numbers = positionals.slice(1)
    } else {
      return { error: `未知模式：${first}（可选 time / numbers / random）` }
    }
  }

  if (options.mode === 'numbers') {
    if (options.numbers.length < 1 || options.numbers.length > 3) {
      return { error: 'numbers 模式需要 1–3 个数字参数' }
    }
  } else if (options.numbers.length > 0) {
    return { error: `${options.mode} 模式不接受多余的位置参数` }
  }
  return options
}

/** CLI 主入口：解析参数 → 起卦 → 输出（默认 renderCard 文本 / --json 原始结构）。 */
export function main(argv: string[] = process.argv.slice(2)): void {
  const parsed = parseArgs(argv)
  if ('error' in parsed) {
    console.error(`错误：${parsed.error}`)
    process.exitCode = 1
    return
  }
  if (parsed.help) {
    console.log(USAGE)
    return
  }
  try {
    let result: CastResult
    if (parsed.mode === 'numbers') {
      result = castNumbers(parsed.numbers.map((n) => Number(n)))
    } else if (parsed.mode === 'random') {
      const randomSource = parsed.seed !== undefined ? { seed: parsed.seed } : 'crypto'
      result = castRandom({ randomSource })
    } else {
      result = castTime(parsed.datetime, { calendar: parsed.calendar })
    }
    result = { ...result, question: parsed.question ?? null }
    if (parsed.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log(renderCard(result))
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`错误：${message}`)
    process.exitCode = 1
  }
}

// bin/xiaoliuren.js 引入本模块即执行
main()
