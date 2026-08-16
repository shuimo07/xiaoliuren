# xiaoliuren · Xiao Liu Ren divination (dsh-plugin-xiaoliuren)

A **Xiao Liu Ren (小六壬)** divination project: cast a reading via **time / numbers / random**, and get a **conclusion-first** plain-language verdict plus the six-palace layout, auspiciousness, five elements, direction, celestial spirit and verse. It works standalone (library + CLI) and also ships as a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) tool plugin (tool name `xiaoliuren`). Every result carries a disclaimer — entertainment/traditional-culture reference only.

## Features

- Three casting modes: `time` (solar/lunar), `numbers` (1–3 numbers), `random` (seeded & reproducible)
- **Conclusion-first**: plain-language verdict + advice, then layout details
- `question` is echoed in the conclusion and never affects the math
- Configurable: calendar, `lateZiShiRollover`, disclaimer text, random source
- **Zero-dependency core** (`src/core/` is pure functions; lunar calendar uses a built-in compact table)
- **Install-and-run**: committed `lib/` output, loaded by DSH via `main: lib/index.js`

## Build & test

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

Requires Node ≥ 18 (Node 22 recommended) and pnpm.

## Library usage

```ts
import { castTime, castNumbers, castRandom } from 'dsh-plugin-xiaoliuren'

const r = castNumbers([3, 15, 5])                                  // numbers: month=3, day=15, hour=5
const r2 = castTime('2024-02-10T12:00:00', { calendar: 'lunar' })  // lunar time casting
const r3 = castRandom({ randomSource: { seed: 42 } })              // reproducible random
```

Public API: `castTime`, `castNumbers`, `castRandom`, `compute`, `advance`, `renderSteps`, `getPalace`, `PALACES`, `shichenFromHour`, `shichenName`, `solarToLunar`, `makeRng`, and all types.

## CLI usage

```bash
xiaoliuren
xiaoliuren time --datetime 2024-02-10T12:00:00 --question "Will this project succeed?"
xiaoliuren time --calendar lunar
xiaoliuren numbers 3 15 5
xiaoliuren random --seed 42 --json
```

Invalid input prints a Chinese error and exits non-zero. Default output is the conclusion-first card:

```text
【小六壬】结果
所问：Will this project succeed?
起卦：报数（3·15·5）→ 小吉
结论：所问之事大吉，成功可期，诸事顺遂 —— 宜积极行动，趁势而为。
（吉｜木｜北方｜六合）
※ 以上为传统民俗文化娱乐参考，不构成任何专业建议。
```

## The six palaces

| # | Palace | Fortune | Element | Direction | Spirit |
|---|--------|---------|---------|-----------|--------|
| 1 | 大安 Dà'ān | auspicious | Wood | East | Azure Dragon |
| 2 | 留连 Liúlián | inauspicious | Water | South | Dark Warrior |
| 3 | 速喜 Sùxǐ | auspicious | Fire | South | Vermilion Bird |
| 4 | 赤口 Chìkǒu | inauspicious | Metal | West | White Tiger |
| 5 | 小吉 Xiǎojí | auspicious | Wood | North | Six Harmony |
| 6 | 空亡 Kōngwáng | inauspicious | Earth | Center | Gouchen |

All palace data lives in `src/core/palaces.ts` (data-as-config): adjust it for school differences, never the algorithm.

## Math

- Fixed order: 大安(1) → 留连(2) → 速喜(3) → 赤口(4) → 小吉(5) → 空亡(6).
- Count months from 大安, days from the month result, hours from the day result; each step counts the current palace as 1 and steps (n−1) forward with modulo 6 wrap.
- Equivalent formula: `finalIndex = ((month + day + hour - 3) % 6) + 1`.
- Shichen mapping: `ordinal = floor(((hour + 1) % 24) / 2) + 1`, 子1 … 亥12, 23:00 wraps to 子.

## Calendar & late-zi rollover

- **Lunar**: `castTime(date, { calendar: 'lunar' })` uses the built-in 1900–2100 compact lunar table (`solarToLunar`; source/scope noted in `src/core/time.ts`). No third-party lunar/date runtime library.
- **`lateZiShiRollover`** (default `false`): whether 23:00–23:59 counts as the next day with day+1. v0.1 defaults to no rollover; enabling it advances the day (month/year carry handled by `Date`).

## Quick install (one command)

Load the plugin into a DSH profile with the bundled installer:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\install-dsh.ps1            # web profile, GitHub source
powershell -ExecutionPolicy Bypass -File scripts\install-dsh.ps1 -Profile headless
powershell -ExecutionPolicy Bypass -File scripts\install-dsh.ps1 -Source file:C:\path\to\xiaoliuren
```

The script runs `dsh plugin --profile <p> add <source>` and idempotently appends the `tool-xiaoliuren` insert row to the profile's `cordis.patch.yml`. Restart `dsh web` afterwards.

## Install shortcuts & restart requirement

- **Fully restart `dsh web` (stop the process, then start it again). A browser refresh is NOT enough.** The client-plugin graph is composed and cached at server boot (package metadata is cached per name and never expires); only a restart re-scans installed `package.json` files and serves `/plugins/<pkg>/client.js` for packages declaring `exports["./client"]` + `dsh.client`. The host-side `xiaoliuren` tool loads immediately; the **widget is client-side and needs the restart**. Sessions persist in `~/.dsh/sessions`, so the restart does not lose conversations.
- **One-command install** (idempotent): `powershell -ExecutionPolicy Bypass -File scripts\install-dsh.ps1` (options: `-Profile`, `-Source file:C:\...`, `-SkipInstall`).
- **Offline / network-fallback shortcut**: `dsh plugin --profile web add file:E:\AI\xiaoliuren`. Git deps pin a commit, so after code updates run `dsh plugin --profile web update dsh-plugin-xiaoliuren` (or reinstall) and restart.
- **Verify after restart**: host tool via `dsh --profile web --dump-config | grep -i xiaoliuren`; widget via `http://127.0.0.1:3080/plugins/dsh-plugin-xiaoliuren/client.js` → expect 200 (404 = not restarted / not discovered); the boot manifest `window.__DSH_BOOT__` should list `dsh-plugin-xiaoliuren`.

## Widget (client UI)

The package also ships a **browser-side widget**: a small **卦** button in the session header (top-right) that collapses into a dot and expands into a panel — pick **数字 / 时间 / 随机**, type the 事由 (matter), hit **生成**, and get the conclusion-first result card with the disclaimer. It lives in `lib/client.js` and auto-loads once the package is installed and `dsh web` is restarted.

## DSH integration (three steps)

```bash
dsh plugin --profile web add github:shuimo07/xiaoliuren

# then append to the profile's cordis.patch.yml:
#   - insert:
#       - id: xiaoliuren
#         name: 'dsh-plugin-xiaoliuren'
#         config: { calendar: solar, randomSource: crypto }

dsh --profile web --dump-config | grep -i xiaoliuren   # verify
```

The plugin exports `{ name: 'tool-xiaoliuren', inject: ['tools', 'systemPrompt'], Config, apply }` and registers the `xiaoliuren` tool (parameters: `mode`, `numbers`, `datetime`, `calendar`, `question`; output follows the CastResult JSON schema; render is the conclusion-first text card). Plugin config: `calendar` (solar/lunar), `randomSource` (crypto/math), `disclaimer` (text).

## Disclaimer

This project and its readings are for **traditional-culture entertainment only** and do not constitute professional advice of any kind (legal, medical, financial, relationship, etc.).

## License

[MIT](./LICENSE)
