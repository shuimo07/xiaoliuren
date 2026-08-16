# xiaoliuren · 小六壬占卜（dsh-plugin-xiaoliuren）

一个**小六壬**占卜项目：按「时间 / 报数 / 随机」三种方式起卦，**结论优先**地输出白话成败结论 + 掌诀排盘、吉凶、五行、方位、神煞与断辞；既可独立使用（库 + CLI），也可作为 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（DSH）的工具插件接入（工具名 `xiaoliuren`）。所有结果始终附带免责声明，仅作传统文化娱乐参考。

## 特性

- **三种起卦**：`time`（时间，公历/农历）、`numbers`（报 1–3 个数）、`random`（随机，可复现）
- **结论优先**：直接给出所问之事的白话成败结论（verdict）与建议（advice），再附排盘、吉凶、五行、方位、神煞、断辞
- **question 回显**：所问之事只参与表述、不参与数法
- **可配置**：公历/农历、晚子时滚日开关（`lateZiShiRollover`）、免责声明文案、随机源
- **零依赖核心**：`src/core/` 全部纯函数、无运行时第三方依赖（农历用内置紧凑表）
- **装上即用**：构建产物 `lib/` 提交进仓库，DSH 通过 `main: lib/index.js` 直接加载

## 安装与构建

```bash
pnpm install      # 安装依赖
pnpm typecheck    # 类型检查
pnpm test         # 单元测试（vitest）
pnpm build        # 构建 lib/
```

要求：Node ≥ 18（建议 22）、pnpm。

## 作为库使用

```ts
import { castTime, castNumbers, castRandom, getPalace, PALACES, solarToLunar } from 'dsh-plugin-xiaoliuren'

const r = castNumbers([3, 15, 5])                    // 报数起卦：月=3、日=15、时=5
const r2 = castTime('2024-02-10T12:00:00', { calendar: 'lunar' }) // 农历时间起卦
const r3 = castRandom({ randomSource: { seed: 42 } }) // 可复现的随机起卦

// CastResult 结构（也是工具输出 schema）：
// { mode, input: { month, day, hour, date?, shichen? }, question, steps, result: {
//     palace, index, auspicious, verdict, advice, wuxing, direction, shensha, verse, interpretation
//   }, disclaimer }
```

核心 API：`castTime`、`castNumbers`、`castRandom`、`compute`、`advance`、`renderSteps`、`getPalace`、`PALACES`、`shichenFromHour`、`shichenName`、`solarToLunar`、`makeRng` 及全部类型。

## CLI 用法

```bash
xiaoliuren                                  # 默认 time：当前时间起卦
xiaoliuren time --datetime 2024-02-10T12:00:00 --question "这个项目能否成功"
xiaoliuren time --calendar lunar            # 农历时间起卦
xiaoliuren numbers 3 15 5                   # 报数起卦（1–3 个数，缺的尾部用当前时间补齐）
xiaoliuren random                           # 随机起卦
xiaoliuren random --seed 42 --json          # 指定种子可复现；--json 输出原始 CastResult
```

非法输入会输出中文错误信息并以非零退出码结束。默认输出即「结论优先」卡片：

```text
【小六壬】结果
所问：这个项目能否成功
起卦：报数（3·15·5）→ 小吉
结论：所问之事大吉，成功可期，诸事顺遂 —— 宜积极行动，趁势而为。
（吉｜木｜北方｜六合）
※ 以上为传统民俗文化娱乐参考，不构成任何专业建议。
```

## 「结论优先」与免责声明

- 首行给出**白话结论 + 建议**，随后才是掌诀排盘等细节；不罗列卦辞。
- verdict / advice 描述的是传统占断取向（如「成功可能性较高」「易拖延反复」），**不是**「一定成功 / 一定失败」的确定性预言。
- 每次输出必含免责声明：`※ 以上为传统民俗文化娱乐参考，不构成任何专业建议。`（插件可通过 `disclaimer` 配置覆盖）。

## 六宫速查表

| 序 | 宫 | 吉凶 | 五行 | 方位 | 神煞 | verdict（白话结论） | advice（建议） |
|----|----|----|----|----|----|----|----|
| 1 | 大安 | 吉 | 木 | 东 | 青龙 | 所问之事大体安稳顺利，成功可能性较高 | 按原计划稳步行事，宜早不宜迟 |
| 2 | 留连 | 凶 | 水 | 南 | 玄武 | 所问之事易拖延反复，短期难见结果 | 暂缓推进，重新审视方案或等时机 |
| 3 | 速喜 | 吉 | 火 | 南 | 朱雀 | 所问之事进展较快，多有助力，成功在望 | 抓住时机快速行动，勿错失良机 |
| 4 | 赤口 | 凶 | 金 | 西 | 白虎 | 所问之事阻力较大，易有口舌是非或争执 | 谨言慎行，注意沟通与合同细节 |
| 5 | 小吉 | 吉 | 木 | 北 | 六合 | 所问之事大吉，成功可期，诸事顺遂 | 宜积极行动，趁势而为 |
| 6 | 空亡 | 凶 | 土 | 中 | 勾陈 | 所问之事易落空或变数大，难达预期 | 宜观望、降低预期或重新规划 |

以上数据集中定义在 `src/core/palaces.ts`（数据即配置），任何流派差异（如留连的方位）修改该表即可，算法不硬编码。

## 数法说明

- 六宫顺序固定：大安(1) → 留连(2) → 速喜(3) → 赤口(4) → 小吉(5) → 空亡(6)。
- 从大安起正月、月上起日、日上起时；每一步「当前宫算 1」，向前走 (n−1) 步，模 6 回绕。
- 等价公式：`finalIndex = ((month + day + hour - 3) % 6) + 1`（month/day/hour 为三个正整数）。
- 十二时辰映射：`时辰序 = floor(((hour + 1) % 24) / 2) + 1`，子1 … 亥12，23:00 回到子。

## 农历与晚子时开关

- **农历**：`castTime(date, { calendar: 'lunar' })` 使用内置 1900–2100 紧凑农历换算表（`solarToLunar`，可单测；表来源与适用范围见 `src/core/time.ts` 注释）。不引入任何第三方农历库。
- **晚子时滚日（`lateZiShiRollover`，默认 `false`）**：晚子时（23:00–23:59 是否算次日并让日号 +1）各派做法不同。v0.1 默认**不滚日**（23:00–23:59 仍算当日、时辰为子）；开启后，日号 +1（Date 自动处理月末与跨年进位）。CLI 未暴露该开关，库与插件调用时传入选项即可。

## 接入 DeepSeek Harness（三步）

```bash
# 1. 添加插件源
dsh plugin --profile web add github:shuimo07/xiaoliuren

# 2. 在 profile 的 cordis.patch.yml 追加启用与配置：
#    - insert:
#        - id: xiaoliuren
#          name: 'dsh-plugin-xiaoliuren'
#          config: { calendar: solar, randomSource: crypto }

# 3. 验证配置已生效
dsh --profile web --dump-config | grep -i xiaoliuren
```

插件导出 DSH 四元组 `{ name: 'tool-xiaoliuren', inject: ['tools', 'systemPrompt'], Config, apply }`，注册工具 `xiaoliuren`：

- 参数：`mode`（time/numbers/random）、`numbers`、`datetime`、`calendar`、`question`
- 输出：按 CastResult 结构（object root，`additionalProperties: false`，required 明确）
- 渲染：结论优先的文本卡片（含免责声明），由 DSH 工具卡片直接展示
- 插件配置：`calendar`（solar/lunar，默认 solar）、`randomSource`（crypto/math，默认 crypto）、`disclaimer`（免责声明文案）

## 安装捷径与重启提示（重要）

### ① 完全重启才生效（客户端小部件的关键坑）
- **必须完全重启 `dsh web` 服务进程**（在运行终端 Ctrl+C 停掉，再重新 `dsh web`）；**只刷新浏览器页面无效**。
- 原因：DSH 的**客户端插件图谱在服务启动时合成并缓存**（插件包元数据按名缓存、永不过期）。只有重启才会重新扫描已装插件的 `package.json`，把声明了 `exports["./client"]` + `dsh.client` 的包纳入 `/plugins/<包名>/client.js` 路由并注入 `window.__DSH_BOOT__`。
- host 侧工具（`xiaoliuren` 工具）是即时生效的；**界面小部件属于 client 侧，必须重启**。
- 会话持久化在 `~/.dsh/sessions`，重启不会丢对话。

### ② 一键安装（幂等）
```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-dsh.ps1
# 可选：-Profile headless / -Source file:C:\path\to\xiaoliuren / -SkipInstall
```
脚本自动执行 `dsh plugin --profile <p> add <source>`，并把 `tool-xiaoliuren` 插件行幂等地追加到 profile 的 `cordis.patch.yml`。脚本面向 Windows PowerShell；macOS / Linux 用户按下方「接入 DeepSeek Harness（三步）」手动执行即可（同样必须完全重启）。

### ③ 网络不稳时的捷径
- 改用本地源：`dsh plugin --profile web add file:E:\AI\xiaoliuren`（或 `link:`）。
- 已装版本是 git 依赖、**钉住某个 commit**：代码更新后需 `dsh plugin --profile web update dsh-plugin-xiaoliuren`（或重装）再重启。

### ④ 验证捷径（重启后）
- host 工具：`dsh --profile web --dump-config | Select-String xiaoliuren`
- client 小部件：浏览器直接访问 `http://127.0.0.1:3080/plugins/dsh-plugin-xiaoliuren/client.js`，**200 = 已生效；404 = 没重启或未被发现**
- 图谱：查看页面源码中 `window.__DSH_BOOT__` 的 entries 是否包含 `dsh-plugin-xiaoliuren`。

## 免责声明

本项目及其占卜结果仅供**传统文化娱乐参考**，不构成任何专业建议（法律、医疗、投资、情感等）。请理性看待。

## License

[MIT](./LICENSE)
