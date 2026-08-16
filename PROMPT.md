# 任务：完整实现「小六壬占卜」项目 v2（DSH 工具插件 + 界面小部件 + 库 + CLI）

你是资深全栈工程师。请从零实现一个完整、可运行、可测试、可直接接入 DeepSeek Harness（以下简称 DSH）的「小六壬占卜」项目。严格按下面规格执行，不要自行扩范围，不要漏项。主体输出为 TypeScript + ESM；客户端小部件为浏览器侧自包含纯 JS 打包产物。

## 0. 版本与变更原因

- **v1 的问题（本次必须避免）**：v1 只把需求理解为「模型可调用的文本工具 + 库 + CLI」。**没有理解用户的真实需求**——用户要的是一个 **DSH 界面里的小程序**：聊天页**右上角**一个可**缩成小点**的按钮，点开后是「**选择起卦方式（数字 / 时间 / 随机）→ 输入事由 → 生成答案**」的交互面板，而不是让 AI 在聊天里代查代答。
- **v2（本文档）**：在库 / CLI / 模型工具之外，**补齐 Client 侧界面小部件**（`lib/client.js`），并把「界面小部件」作为一等需求写入验收。本文档是完整的、可直接重生成整个项目的蓝图；**所有产出必须纳入 GitHub 仓库 `shuimo07/xiaoliuren` 并随 git 提交/推送，不得散落他处**。

### 一句话目标

一个小六壬项目 = **核心算法库（零依赖） + CLI + DSH 模型工具（`xiaoliuren`） + DSH 右上角界面小部件**：按「时间 / 报数 / 随机」起卦，**结论优先**输出白话成败结论 + 掌诀排盘、吉凶、五行、方位、神煞、断辞，始终附带免责声明。

## 1. 硬性技术约束（必须遵守）

- 语言：TypeScript；模块：ESM（`"type": "module"`）。
- 包管理：pnpm；Node 22。
- 单包结构：仓库根目录即 npm 包，包名 `dsh-plugin-xiaoliuren`，`main` 指向 `lib/index.js`，`types` 指向 `lib/index.d.ts`。
- 核心算法（`src/core/`）**零运行时依赖**，纯函数。
- 构建产物 `lib/` 必须**提交进仓库**（git 依赖安装时不可靠，DSH 通过 `main: lib/index.js` 加载；保证「装上即用」）。
- **客户端小部件 `lib/client.js` 必须是浏览器侧自包含纯 JS**：
  - 打包格式：`window.__ModuleLoader__.load({ id: "dsh-plugin-xiaoliuren", factory: (require) => { ... } })`；`factory` 内 `require("react")`，**不得使用任何 import/require 之外的模块加载方式**，不得引用 Node API。
  - 算法（六宫数据 / 数法 / 时辰映射）**内联**在 client 文件里，并与 `src/core/palaces.ts` 的数据**完全一致**（同一来源，改一处两处同步）。
  - 随机源用 `crypto.getRandomValues`，降级 `Math.random`。
- 包内同时声明 host 与 client 两个 half：
  - host：`main` / `types`（模型工具，`lib/index.js`，导出 `{ name, inject, Config, apply }`）。
  - client：`exports["./client"]` → `./lib/client.js`，并在 package.json 声明 `"dsh": { "client": { "inject": [...], "platform": "web" } }`；client 插件导出 `{ apply, inject }`。
- 依赖声明：
  - `dependencies`: `@deepseek-ai/schemastery`（Config schema）。
  - `peerDependencies`: `@deepseek-ai/dsh-tools`、`@deepseek-ai/cordis`、`@deepseek-ai/schemastery`、`@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-slots`、`react`。
  - `devDependencies`: 构建/测试所需（tsc 或 tsup/esbuild、vitest、@types/node、@types/react 等，自选最小集）。
- 测试框架：vitest。
- 所有面向用户的文案为简体中文；代码标识符/文件名用英文小写 kebab 或 camelCase。

## 2. 目录结构（照此实现）

```
.
├── package.json              # name: dsh-plugin-xiaoliuren, type: module, main: lib/index.js
│                             # exports: { ".": host, "./client": lib/client.js }; dsh.client 声明
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
│   ├── index.ts              # 插件本体（host half）：name/inject/Config/apply + defineTool
│   └── cli.ts                # CLI 入口，纯 process.argv 解析，零依赖
├── bin/xiaoliuren.js         # CLI bin（"bin": {"xiaoliuren": "bin/xiaoliuren.js"}）
├── lib/                      # 构建产物，提交进仓库
│   ├── index.js              # host half（工具 + 库 + CLI 入口）
│   ├── index.d.ts
│   └── client.js             # client half：右上角界面小部件（__ModuleLoader__ 打包格式）
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

- 每宫还需一个 `interpretation`（传统释义）字段，用断辞的简短白话解释（1-2 句），内容自拟但须与宫义一致。
- 这些数据全部放入 `palaces.ts` 作为导出常量数组 `PALACES`，并提供 `getPalace(index1based)`；**数据即配置**（尤其留连的方位等有流派差异处，改这里即可，不要硬编码在算法里）。
- **client 小部件内联的六宫数据必须与 `PALACES` 完全一致。**

### 3.2 数法（核心公式，必须精确）

从大安（序 1）起正月、月上起日、日上起时；每一步「当前宫算 1」，向前走 (n−1) 步，模 6 回绕。等价公式：

```
finalIndex = ((month + day + hour - 3) % 6) + 1   // month/day/hour 为三个正整数
```

- 提供 `advance(startIndex1based, n)` 辅助函数。
- 提供 `renderSteps(month, day, hour)`：返回逐步排盘数组，如 `[{phase:'月',number:3,palace:'速喜',index:3}, ...]`。

### 3.3 十二时辰映射（必须精确，含边界）

```
时辰序 = floor(((hour + 1) % 24) / 2) + 1   // hour 为本地 0..23 时
子1 丑2 寅3 卯4 辰5 巳6 午7 未8 申9 酉10 戌11 亥12
23:00–00:59=子，01:00–02:59=丑，…，21:00–22:59=亥，23:00 回到子
```

- 提供 `shichenFromHour(h)` 与 `shichenName(ordinal)`。
- 边界决策：晚子时（23:00 后是否算次日并日进一）各派不同。v2 **默认不滚日**；提供配置开关 `lateZiShiRollover`（默认 `false`），README 说明。

### 3.4 三种起卦

| 模式 | 输入 | 月/日/时 取值 |
|---|---|---|
| `time` | `datetime?`（ISO8601，缺省=当前本地时间） | 月=公历/农历月号，日=日号，时=当前时辰序 |
| `numbers` | `numbers`：1–3 个正整数 | 依次填 月/日/时，缺的尾部用当前时间的日/时补齐 |
| `random` | 无（或 `seed?`） | 随机生成 月∈1..12、日∈1..30、时∈1..12 |

- `numbers` 语义：`[n]`→月；`[n,m]`→月、日；`[n,m,k]`→月、日、时；缺的尾部用当前时间补齐。任何正整数接受（公式取模，展示保留原数）。长度>3 或含非正整数 → 抛中文错误。
- `random` 随机源可注入：`crypto`（默认）/ `math` / `{seed}`（可复现 PRNG，供测试）。封装 `makeRng(source)` → `() => number`。
- 农历：`calendar: 'solar' | 'lunar'`（默认 `solar`）。`lunar` 用内置 1900–2100 紧凑农历换算表（`lunarInfo` 常量数组）实现 `solarToLunar(date)`，函数独立可单测，注释注明公开来源与适用范围；**不许引入第三方农历库**。

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
- `question` 只参与表述、不参与数法。

## 4. 核心库 `src/core/` 实现要求

- 导出公共 API（`index.ts` 再导出）：`castTime`、`castNumbers`、`castRandom`、`getPalace`、`PALACES`、`shichenFromHour`、`shichenName`、`solarToLunar`、`makeRng` 及全部类型。
- 纯函数（除随机源注入），输入校验显式抛错（中文信息）。
- `castTime(dateInput?, opts)`：`opts` 含 `calendar`、`lateZiShiRollover`。
- `castNumbers(nums, opts)`：缺省尾部用当前时间（复用 `castTime` 的时间派生逻辑）。
- `castRandom(opts)`：`opts` 含 `randomSource`。
- 抽出一个统一核心 `compute(month, day, hour): { steps, result }`，三模式最终都走它，避免三处重复；**client 小部件内联的 compute 必须与它逻辑一致**。

## 5. DSH 工具插件 `src/index.ts`（Host half）

插件必须**导出四元组** `{ name, inject, Config, apply }`（ESM named exports），完全复刻 DSH 第一方工具插件 `@deepseek-ai/dsh-tool-ralph` 的结构（参考骨架按此改写为小六壬）：

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

export function apply(ctx, config) {
  const resolved = resolveConfig(config)          // 缺省兜底 + 校验

  ctx.systemPrompt.section({
    name: 'tool:xiaoliuren', order: 120,
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
      schema: { type: 'object', additionalProperties: false, properties: { /* 按 3.5 展开 */ } },
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

- 若对 `@deepseek-ai/dsh-tools` 的 `defineTool` 签名不确定，以其真实类型定义为准（本机 `node_modules/@deepseek-ai/dsh-tools/lib/types/schema.d.ts`；`@deepseek-ai/dsh-tool-ralph/lib/index.js` 是完整参考），不要臆造字段。
- `validateNumbers`：校验 1–3 个正整数，否则抛中文错误。

## 6. 界面小部件 `lib/client.js`（Client half，本版重点）

这是 v2 的核心新增。目标形态：**DSH 聊天页右上角一个可缩成小点的「卦」按钮，点开是"选模式 → 输事由 → 生成答案"的交互面板**。

### 6.1 位置与形态

- 注册到会话头部 actions Slot：`conversation.session.header.actions`（与官方 `@deepseek-ai/dsh-client-ui-jobs` 同 Slot，其代码是本范式参考）。
- 收起态：28px 圆形小按钮，文字「卦」，`title`/`aria-label`「小六壬占卜」——即"缩成一个小点"。
- 展开态：按钮下方右对齐弹出面板（`position:absolute; top:calc(100% + 6px); right:0; width:340px; maxWidth:min(400px, calc(100vw - 24px)); maxHeight:min(70vh, 640px); overflowY:auto; z-index:100`，圆角 12px、阴影），跟随 DSH 主题变量（`var(--dsw-*)`，每个都带兜底值，明/暗色自适应）。
- 关闭：点面板外部（pointerdown + contains 判断）或按 Esc（参考 jobs 的 closeOutside / Escape 实现）。

### 6.2 交互流程（用户原话落点，必须逐条满足）

1. 面板顶部三个模式 tab：**数字 / 时间 / 随机**（选中态高亮）。
2. 数字模式：显示 月 / 日 / 时 三个数字输入框（允许只填 1–3 个，缺的尾部用当前时间补齐；非法输入给中文错误提示：如"请至少输入一个数字"、"数字必须是正整数"、"最多输入 3 个数字"）。
3. 时间模式：取当前本地时间（公历月 + 日 + 时辰）。
4. 随机模式：`crypto.getRandomValues` 随机生成 月1-12 / 日1-30 / 时1-12。
5. 「所问之事」输入框（事由，可空）。
6. 「生成答案」按钮 → 显示结论优先卡片。

### 6.3 结果卡片（结论优先，与库的 `renderCard` 输出一致）

```
【小六壬】结果
所问：这个项目能否成功
起卦：报数（3·15·5）→ 小吉
掌诀：大安(月) → 速喜(日) → 小吉(时)
结论：所问之事大吉，成功可期，诸事顺遂 —— 宜积极行动，趁势而为。
（吉｜木｜北方｜六合）
断辞：小吉最吉昌，路上好商量；阴人来报喜，失物在坤方。
※ 以上为传统民俗文化娱乐参考，不构成任何专业建议。
```

- 有 `question` 显示「所问：」行，无则省略；「结论：」= `verdict + " —— " + advice`；括注行 = `吉/凶｜五行｜方位｜神煞`；末行必含免责声明。

### 6.4 打包格式（照抄结构，不要改）

```js
window.__ModuleLoader__.load({
  id: "dsh-plugin-xiaoliuren",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    let react = require("react");
    // …六宫数据 / 算法 / formatCard（内联，与 src/core 一致）…
    // …React 组件：React.createElement（不用 JSX）…
    var inject = ["slots"];
    function apply(ctx) {
      ctx.slots.inject("conversation.session.header.actions", function () {
        return ctx.slots.register({
          name: "conversation.session.header.actions",
          id: "xiaoliuren",
          order: 30
        }, XiaoliurenWidget);
      });
    }
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
```

### 6.5 约束

- 只 `require("react")`，不 import 其他包；样式用内联 `style` 对象 + 主题变量兜底，不注入全局 CSS。
- 六宫数据、`compute`、`shichenFromHour` 等必须与 `src/core` 完全一致（同一来源）。
- 时间模式 v2 默认公历；农历可在后续版本加入（与库 `calendar` 配置思路一致）。
- 不得把结果说成确定性预言；必须保留免责声明。

## 7. CLI `src/cli.ts` + `bin/xiaoliuren.js`

- 用法（纯 `process.argv` 解析，零依赖）：
  - `xiaoliuren`（默认 time，当前时间）
  - `xiaoliuren time --datetime <ISO>`（可选 `--calendar solar|lunar`）
  - `xiaoliuren numbers 3 15 5`（1–3 个数）
  - `xiaoliuren random`（可选 `--seed <number>`）
  - 全局可选 `--question "..."`、`--json`
- 默认输出复用 `renderCard` 同款文本；`--json` 输出 `CastResult` 序列化。
- 非法输入 → 中文错误信息 + 非零退出码。

## 8. 测试（vitest，必须覆盖）

- `cast.test.ts`：数法已知向量 `(1,1,1)=大安`、`(6,1,1)=空亡`、`(7,1,1)=大安`；`steps` 一致性；大数/回绕；`numbers` 长度/类型错误；缺省补齐。
- `time.test.ts`：`shichenFromHour` 边界 `0→子(1)`、`1→丑(2)`、`22→亥(12)`、`23→子(1)`；`lateZiShiRollover` 开关；`solarToLunar` 抽样。
- `palaces.test.ts`：六宫 `verdict`/`advice` 非空；吉/凶与 verdict 取向一致；`getPalace` 越界抛错。
- `random.test.ts`：`makeRng({seed})` 可复现；取值范围。
- `plugin.test.ts`：假 `ctx.tools.register`/`ctx.systemPrompt.section` 捕获定义，断言工具名/参数 schema/输出 schema；三种 mode 各跑 `execute`；`question` 回显；render 含「结论」与免责声明。
- **client 一致性**：client 内联的纯逻辑（compute/shichen/formatCard 的等价实现）与 `src/core` 结果一致（可把该逻辑抽到共享文件或测试中比对）。
- **client 结构**：`lib/client.js` 含 `__ModuleLoader__.load`、`exports.apply`、`exports.inject`（含 `"slots"`）、注册到 `conversation.session.header.actions`。

## 9. CI `.github/workflows/ci.yml`

- 触发：push 与 pull_request。
- 步骤：checkout → setup pnpm + Node 22 → `pnpm install --frozen-lockfile`（无 lockfile 则 `pnpm install`）→ `typecheck` → `test` → `build` → `git diff --exit-code`（校验 `lib/` 与 `src/` 同步）。
- scripts：`typecheck`、`test`、`build`。

## 10. README（中文为主）

README.zh.md 必含：项目简介；三种起卦用法与示例（含 CLI）；「结论优先」说明与免责声明；六宫速查表；农历/晚子时开关说明；**DSH 接入三步**；**「界面小部件」章节**（右上角「卦」按钮、三种模式、事由输入、生成答案、重启后生效）。README.md 提供等价英文版或简短英文简介。

## 11. 明确不要做

- 不要引入第三方农历/日期运行时库（农历用内置紧凑表）。
- 不要做数据库、持久化、用户偏好存储、后端服务。
- 不要把 verdict/advice 说成「一定成功/一定失败」的确定性预言。
- 不要用第三方 React 组件库 / UI 框架（小部件内联实现即可）。
- 不要超出上述文件范围新增其他功能。

## 12. 验收清单（全部满足才算完成）

1. `pnpm install && pnpm typecheck && pnpm test && pnpm build` 全绿，`git diff` 干净（lib 已同步）。
2. CLI 三种起卦输出正确，`--json` 结构符合 3.5。
3. 插件导出四元组，`execute` 三种 mode 返回含 `verdict/advice/disclaimer` 的结果，`question` 正确回显。
4. `render` 结论优先、简洁、含免责声明。
5. 测试覆盖 §8 全部断言（含 client 一致性）。
6. README 含 DSH 接入三步、免责声明与界面小部件章节。
7. 所有产出文件均位于 `shuimo07/xiaoliuren` 仓库内并已提交/推送（工作区干净），无仓库外散落文件。
8. **安装并重启 `dsh web` 后，右上角出现「卦」小按钮；点开可完成 数字/时间/随机 三模式选择 → 输入事由 → 生成答案；结果卡片结论优先且必含免责声明。**

请先给出完整文件清单与每个文件的要点说明，再逐文件实现；实现过程中如对 DSH 的 `defineTool`、client half 打包（`__ModuleLoader__`）、Slot 协议有疑问，以本机 `node_modules/@deepseek-ai/dsh-tool-ralph`（host 工具范式）与 `@deepseek-ai/dsh-client-ui-jobs`（client 小部件范式）为参考，不要臆造 API。
