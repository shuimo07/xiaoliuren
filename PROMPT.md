# 任务：完整实现一个「小六壬占卜」项目（含 DeepSeek Harness 插件）

你是资深全栈工程师。请从零实现一个完整、可运行、可测试、可直接接入 DeepSeek Harness（以下简称 DSH）的「小六壬占卜」项目。严格按下面规格执行，不要自行扩范围，不要漏项。全部输出为 TypeScript + ESM。

## 0. 一句话目标

一个可独立使用（库 + CLI）、又能作为 DSH 工具插件接入的小六壬占卜项目：按「时间 / 报数 / 随机」三种方式起卦，**结论优先**地输出白话成败结论 + 掌诀排盘、吉凶、五行、方位、神煞、断辞，并始终附带免责声明。

**归属要求（必须遵守）**：本项目的一切产出（源码、测试、CI、文档、构建产物）都必须纳入 GitHub 仓库 `shuimo07/xiaoliuren`，并以 git 提交、推送进该仓库；任何产出都不得散落在该仓库之外，仓库即项目的唯一事实来源。

## 1. 硬性技术约束（必须遵守）

- 语言：TypeScript；模块：ESM（`"type": "module"`）。
- 包管理：pnpm；Node 22。
- 单包结构：仓库根目录即 npm 包，包名 `dsh-plugin-xiaoliuren`，`main` 指向 `lib/index.js`，`types` 指向 `lib/index.d.ts`。
- 核心算法（`src/core/`）**零运行时依赖**，纯函数。
- 构建产物 `lib/` 必须**提交进仓库**（git 依赖安装时不可靠，DSH 通过 `main: lib/index.js` 加载；保证「装上即用」）。
- 依赖声明：
  - `dependencies`: `@deepseek-ai/schemastery`（用于 Config schema）。
  - `peerDependencies`: `@deepseek-ai/dsh-tools`、`@deepseek-ai/cordis`、`@deepseek-ai/schemastery`。
  - `devDependencies`: 构建/测试所需（tsc 或 tsup/esbuild、vitest、@types/node 等，自选最小集）。
- 测试框架：vitest。
- 所有面向用户的文案为简体中文；代码标识符/文件名用英文小写 kebab 或 camelCase。

## 2. 目录结构（照此实现）

```
.
├── package.json              # name: dsh-plugin-xiaoliuren, type: module, main: lib/index.js
├── tsconfig.json
├── README.md
├── README.zh.md
├── LICENSE                   # MIT
├── .gitignore                # 忽略 node_modules、覆盖产物，但不忽略 lib/
├── .github/workflows/ci.yml
├── src/
│   ├── core/
│   │   ├── palaces.ts        # 六宫数据表（含 verdict/advice，数据即配置）
│   │   ├── cast.ts           # 三种起卦 + 数法公式 + 逐步排盘
│   │   ├── time.ts           # 时辰映射、公历/农历换算、边界
│   │   ├── random.ts         # 可注入随机源 crypto/math/seed
│   │   └── types.ts          # Palace / CastInput / CastResult 等类型
│   ├── index.ts              # 插件本体：name/inject/Config/apply + defineTool
│   └── cli.ts                # CLI 入口，纯 process.argv 解析，零依赖
├── bin/xiaoliuren.js         # CLI bin（"bin": {"xiaoliuren": "bin/xiaoliuren.js"}）
├── lib/                      # 构建产物，提交进仓库
│   ├── index.js
│   └── index.d.ts
└── test/
    ├── cast.test.ts
    ├── time.test.ts
    ├── palaces.test.ts
    ├── random.test.ts
    └── plugin.test.ts
```

## 3. 领域规格（算法，必须精确实现）

### 3.1 六宫（数法顺序固定，顺序即数组下标 0..5）

| 序(1-based) | 宫 | 吉凶 | 五行 | 方位 | 神煞 | verdict（白话结论） | advice（建议） | verse（断辞） |
|---|---|---|---|---|---|---|---|---|
| 1 | 大安 | 吉 | 木 | 东 | 青龙 | 所问之事大体安稳顺利，成功可能性较高 | 按原计划稳步行事，宜早不宜迟 | 大安事事昌，求谋在坤方；失物去不远，宅舍保安康。 |
| 2 | 留连 | 凶 | 水 | 南 | 玄武 | 所问之事易拖延反复，短期难见结果 | 暂缓推进，重新审视方案或等时机 | 留连事难成，求谋日未明；官事只宜缓，去者未回程。 |
| 3 | 速喜 | 吉 | 火 | 南 | 朱雀 | 所问之事进展较快，多有助力，成功在望 | 抓住时机快速行动，勿错失良机 | 速喜喜来临，求财向南行；失物申未午，逢人路上寻。 |
| 4 | 赤口 | 凶 | 金 | 西 | 白虎 | 所问之事阻力较大，易有口舌是非或争执 | 谨言慎行，注意沟通与合同细节 | 赤口主口舌，官非切要防；失物急去寻，行人有惊慌。 |
| 5 | 小吉 | 吉 | 木 | 北 | 六合 | 所问之事大吉，成功可期，诸事顺遂 | 宜积极行动，趁势而为 | 小吉最吉昌，路上好商量；阴人来报喜，失物在坤方。 |
| 6 | 空亡 | 凶 | 土 | 中 | 勾陈 | 所问之事易落空或变数大，难达预期 | 宜观望、降低预期或重新规划 | 空亡事不长，阴人多乖张；求财无利益，行人有灾殃。 |

- 每宫还需一个 `interpretation`（传统释义）字段，可用断辞的简短白话解释（1-2 句），内容你自拟但须与宫义一致。
- 这些数据全部放入 `palaces.ts` 作为导出常量数组 `PALACES`，并提供 `getPalace(index1based)`。**数据即配置**：任何属性（尤其留连的方位等有流派差异处）都改这里即可，不要硬编码在算法里。

### 3.2 数法（核心公式，必须精确）

从大安（序 1）起正月、月上起日、日上起时；每一步「当前宫算 1」，向前走 (n−1) 步，模 6 回绕。等价公式：

```
finalIndex = ((month + day + hour - 3) % 6) + 1   // month/day/hour 为三个正整数
```

- 提供 `advance(startIndex1based, n)` 辅助函数：返回从 `start` 起数 `n` 次后落在的宫序。
- 提供 `renderSteps(month, day, hour)`：返回逐步排盘数组，例如 `[{phase:'月',number:3,palace:'速喜',index:3}, {phase:'日',...}, {phase:'时',...}]`，供展示与复核。

### 3.3 十二时辰映射（必须精确，含边界）

```
时辰序 = floor(((hour + 1) % 24) / 2) + 1   // hour 为本地 0..23 时
子1 丑2 寅3 卯4 辰5 巳6 午7 未8 申9 酉10 戌11 亥12
23:00–00:59=子，01:00–02:59=丑，…，21:00–22:59=亥，23:00 回到子
```

- 提供 `shichenFromHour(h)` 与 `shichenName(ordinal)`。
- 边界决策：晚子时（23:00 后是否算次日并日进一）各派不同。v0.1 **默认不滚日**；提供配置开关 `lateZiShiRollover`（默认 `false`）。当开启且 hour≥23 时，日号 +1（并处理月末进位），README 说明该开关。

### 3.4 三种起卦

| 模式 | 输入 | 月/日/时 取值 |
|---|---|---|
| `time` | `datetime?`（ISO8601，缺省=当前本地时间） | 月=公历/农历月号，日=日号，时=当前时辰序 |
| `numbers` | `numbers`：1–3 个正整数 | 依次填 月/日/时，缺的尾部用当前时间的日/时补齐 |
| `random` | 无（或 `seed?`） | 随机生成 月∈1..12、日∈1..30、时∈1..12 |

- `numbers` 语义：`[n]`→月（日、时取当前）；`[n,m]`→月、日（时取当前）；`[n,m,k]`→月、日、时。任何正整数接受（公式取模，但展示保留原数）。长度>3 或含非正整数 → 抛带中文提示的错误。
- `random` 随机源可注入：`crypto`（默认，用 `crypto.getRandomValues`）/ `math` / `{seed}`（实现一个可复现的确定性 PRNG，供测试）。封装为 `makeRng(source)` → `() => number`（[0,1)）。
- 农历：`calendar: 'solar' | 'lunar'`（默认 `solar`）。`lunar` 时用内置 1900–2100 紧凑农历换算表（常见 `lunarInfo` 常量数组，约 200 个整数）实现 `solarToLunar(date)`；该函数独立、可单测，并在源码注释注明该表的公开来源与适用范围。若实现成本过高，可退化为：默认 `solar`，`lunar` 使用该紧凑表；不许引入第三方农历库。

### 3.5 输出结构（`CastResult`，库返回值 = 工具输出 schema 基础）

```ts
interface CastResult {
  mode: 'time' | 'numbers' | 'random'
  input: { month: number; day: number; hour: number; date?: string; shichen?: string }
  question: string | null
  steps: Array<{ phase: '月'|'日'|'时'; number: number; palace: string; index: number }>
  result: {
    palace: string; index: number; auspicious: boolean
    verdict: string; advice: string
    wuxing: string; direction: string; shensha: string
    verse: string; interpretation: string
  }
  disclaimer: string
}
```

- `disclaimer` 固定为：`以上为传统民俗文化娱乐参考，不构成任何专业建议。`（可被插件配置覆盖）。
- `question` 为所问之事，只参与表述、不参与数法。

## 4. 核心库 `src/core/` 实现要求

- 导出公共 API（`index.ts` 中再导出）：`castTime`、`castNumbers`、`castRandom`、`getPalace`、`PALACES`、`shichenFromHour`、`shichenName`、`solarToLunar`、`makeRng`、以及全部类型。
- 所有函数纯函数（除随机源注入外），输入校验显式抛错（中文信息）。
- `castTime(dateInput?, opts)`：`opts` 含 `calendar`、`lateZiShiRollover`。
- `castNumbers(nums, opts)`：`opts` 含 `calendar`、`lateZiShiRollover`；缺省尾部用当前时间（内部复用 `castTime` 的时间派生逻辑）。
- `castRandom(opts)`：`opts` 含 `randomSource`；月/日/时随机后走同一 `compute(month,day,hour)` 核心函数。
- 抽出一个统一核心 `compute(month, day, hour): { steps, result }`，三模式最终都走它，避免三处重复。

## 5. DSH 插件 `src/index.ts` 实现要求（严格按此形状）

插件必须**导出四元组** `{ name, inject, Config, apply }`（ESM named exports），并**完全复刻** DSH 第一方工具插件 `@deepseek-ai/dsh-tool-ralph` 的结构。参考骨架（按其改写为小六壬）：

```ts
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { castTime, castNumbers, castRandom } from './core/index.js'

export const name = 'tool-xiaoliuren'
export const inject = ['tools', 'systemPrompt']

export const Config = z.object({
  calendar: z.union(['solar', 'lunar']).default('solar'),
  randomSource: z.union(['crypto', 'math']).default('crypto'),
  disclaimer: z.string().default('以上为传统民俗文化娱乐参考，不构成任何专业建议。'),
})

function resolveConfig(config) { /* 对缺失项给默认值并校验，返回 resolved */ }

export function apply(ctx, config) {
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
      mode:     { type: 'string', enum: ['time','numbers','random'], description: '起卦方式' },
      numbers:  { type: 'array', items: { type: 'integer' }, description: '报数 1–3 个正整数（mode=numbers 时用）' },
      datetime: { type: 'string', description: 'ISO8601 时间（mode=time 时用，缺省=当前时间）' },
      calendar: { type: 'string', enum: ['solar','lunar'], description: '时间起卦用公历还是农历' },
      question: { type: 'string', description: '所问之事，例如"这个项目能否成功"；仅用于结论表述，不参与起卦' },
    },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: { /* 按 3.5 的 CastResult 展开为 JSON schema，required 明确 */ } },
      render: (_args, value) => [{ type: 'text', text: renderCard(value) }],
    },
    async execute(args) {
      const mode = args.mode ?? 'time'
      const r = mode === 'numbers' ? castNumbers(validateNumbers(args.numbers), resolved)
              : mode === 'random' ? castRandom(resolved)
              : castTime(args.datetime, resolved)
      return { ...r, question: args.question ?? null }
    },
    presentCall:  (args) => ({ card: 'generic', title: '小六壬', rawInput: String(args.mode ?? 'time') }),
    presentResult: () => ({ card: 'generic' }),
  }))
}
```

- `defineTool` 的参数 schema 用其支持的简写（`type`/`enum`/`items`/`description`）；输出 schema 是标准 JSON Schema（object root，`additionalProperties:false`）。
- 若对 `@deepseek-ai/dsh-tools` 的 `defineTool` 签名不确定，请在实现时以其真实类型定义为准（本机 `node_modules/@deepseek-ai/dsh-tools/lib/types/schema.d.ts` 有 `defineTool`/`ParameterSchemaSpec`/`ValueSchemaSpec` 定义，`@deepseek-ai/dsh-tool-ralph/lib/index.js` 是完整参考实现）；不要凭猜测写出不存在的字段。
- `validateNumbers`：校验 1–3 个正整数，否则抛中文错误。

### 5.1 渲染 `renderCard`（结论优先，这是核心体验）

输出单段 `text`，结论在最前：

```
【小六壬】结果
所问：这个项目能不能成功
起卦：报数（3·15·5）→ 小吉
结论：所问之事大吉，成功可期，诸事顺遂 —— 宜积极行动，趁势而为。
（吉｜木｜北方｜六合）
※ 以上为传统民俗文化娱乐参考，不构成任何专业建议。
```

- 有 `question`：第一行「所问：…」；无 `question`：省略该行。
- 「结论：」行 = `verdict` + ` —— ` + `advice`。
- 括注行 = `吉/凶｜五行｜方位｜神煞`。
- 最后一行 = `disclaimer`（必含，不可省略）。
- 不得输出卦名罗列式的冗长文本；结论优先、简洁。

## 6. CLI `src/cli.ts` + `bin/xiaoliuren.js`

- 用法（纯 `process.argv` 解析，零依赖）：
  - `xiaoliuren`（默认 time，当前时间）
  - `xiaoliuren time --datetime <ISO>` / `xiaoliuren time`（可选 `--calendar solar|lunar`）
  - `xiaoliuren numbers 3 15 5`（1–3 个数）
  - `xiaoliuren random`（可选 `--seed <number>`）
  - 全局可选 `--question "..."`、`--json`（`--json` 输出原始 JSON）
- 默认输出复用 `renderCard` 同款文本；`--json` 输出 `CastResult` 序列化。
- 非法输入 → 中文错误信息 + 非零退出码。
- `bin/xiaoliuren.js` 为已构建的 CLI 入口（或直接 `#!/usr/bin/env node` 引入 `../lib/cli.js`，按你的构建输出定，确保 `npx`/`node bin/xiaoliuren.js` 可跑）。

## 7. 测试（vitest，必须覆盖）

- `cast.test.ts`：数法公式已知向量 `(1,1,1)=大安`、`(6,1,1)=空亡`、`(7,1,1)=大安`；逐步排盘 `steps` 一致性；大数/回绕；`numbers` 长度 0/4/非正整数抛错；`numbers` 缺省补齐逻辑。
- `time.test.ts`：`shichenFromHour` 边界 `0→子(1)`、`1→丑(2)`、`22→亥(12)`、`23→子(1)`；`lateZiShiRollover` 开/关对日号的影响；`solarToLunar` 抽样（用已知农历日期对照 2–3 个）。
- `palaces.test.ts`：六宫 `verdict`/`advice` 非空；`auspicious` 为吉时 verdict 偏成功取向、为凶时偏波折取向；`getPalace` 越界抛错。
- `random.test.ts`：`makeRng({seed})` 可复现；`crypto`/`math` 输出落在 [0,1)；`castRandom` 的月∈1..12、日∈1..30、时∈1..12。
- `plugin.test.ts`：用假 `ctx`（`ctx.tools.register` 捕获定义、`ctx.systemPrompt.section` 捕获文本）调用 `apply`，断言：导出 `name/inject/Config/apply`；工具名 `xiaoliuren`；参数 schema 含 `mode/numbers/datetime/calendar/question`；`execute` 三种 mode 各返回合法 `CastResult` 且 `question` 回显正确；`render` 输出首屏含「结论」且含免责声明。

## 8. CI `.github/workflows/ci.yml`

- 触发：push 与 pull_request。
- 步骤：checkout → setup pnpm + Node 22 → `pnpm install --frozen-lockfile`（若无 lockfile 则 `pnpm install`）→ `typecheck` → `test` → `build` → `git diff --exit-code`（校验 `lib/` 与 `src/` 同步，防止提交了未构建的源码改动）。
- package.json scripts：`typecheck`、`test`、`build`、`prepare`（可选，`pnpm run build`）。

## 9. README（中文为主）

README.zh.md 必含：项目简介；三种起卦用法与示例（含 CLI 命令）；「结论优先」说明与免责声明；六宫速查表；农历/晚子时开关说明；**DSH 接入三步**：

```sh
dsh plugin --profile web add github:shuimo07/xiaoliuren
# 再在 profile 的 cordis.patch.yml 追加：
#   - insert:
#       - id: xiaoliuren
#         name: 'dsh-plugin-xiaoliuren'
#         config: { calendar: solar, randomSource: crypto }
dsh --profile web --dump-config | grep -i xiaoliuren   # 验证
```

README.md 提供等价英文版或简短英文简介。

## 10. 明确不要做

- 不要引入第三方农历/日期运行时库（农历用内置紧凑表）。
- 不要做数据库、持久化、用户偏好存储、后端服务。
- 不要把 verdict/advice 说成「一定成功/一定失败」的确定性预言。
- 不要做 UI/网页（DSH 自带工具卡片渲染，`renderCard` 返回 text 即可）。
- 不要超出上述文件范围新增其他功能。

## 11. 验收清单（全部满足才算完成）

1. `pnpm install && pnpm typecheck && pnpm test && pnpm build` 全绿，`git diff` 干净（lib 已同步）。
2. CLI 三种起卦输出正确，`--json` 返回结构符合 3.5。
3. 插件导出四元组，`execute` 三种 mode 返回含 `verdict/advice/disclaimer` 的结果，`question` 正确回显。
4. `render` 结论优先、简洁、含免责声明。
5. 测试覆盖 §7 全部断言。
6. README 含 DSH 接入三步与免责声明。
7. 所有产出文件均位于 `shuimo07/xiaoliuren` 仓库内并已提交/推送（工作区干净），无仓库外散落文件。

请先给出完整文件清单与每个文件的要点说明，再逐文件实现；实现过程中如对 DSH 的 `defineTool`/`schemastery` 具体签名有疑问，以本机 `node_modules/@deepseek-ai/dsh-tool-ralph` 与 `@deepseek-ai/dsh-tools` 类型定义为准，不要臆造 API。
