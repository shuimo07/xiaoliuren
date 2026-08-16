# xiaoliuren · 小六壬占卜 + DeepSeek Harness 插件

一个**小六壬**占卜项目：按「时间 / 报数 / 随机」三种方式起卦，**结论优先**地输出白话成败结论 + 掌诀排盘、吉凶、五行、方位、神煞、断辞；同时提供一个可接入 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的工具插件（工具名 `xiaoliuren`）。

> 当前处于**规格 / 提示词阶段**：代码尚未生成。`PROMPT.md` 即"施工蓝图"。

## 用一份 Prompt 生成整个项目

`PROMPT.md` 是一份自洽、可直接整段粘贴的 vibe-coding 主提示词：丢给任意编程 AI（Cursor / Claude / DeepSeek / Copilot 等），即可从零生成全部代码——核心算法、DSH 插件、CLI、测试、CI。

**归属约定**：本项目的一切产出（源码、测试、CI、文档、构建产物）都必须纳入本仓库并随 git 提交/推送，不得散落他处。

## 关键特性（规划）

- 三种起卦：`time`（时间）、`numbers`（报 1–3 个数）、`random`（随机）
- 结论优先：直接给出「所问之事能否成功」的白话结论（verdict）与建议（advice）
- 支持 `question` 参数回显所问之事；结果必含免责声明
- 可配置公历 / 农历、晚子时开关
- DSH 接入：`dsh plugin --profile web add github:shuimo07/xiaoliuren`

## 文件

- `PROMPT.md` — 生成整个项目的主提示词
- `LICENSE` — MIT

## License

[MIT](./LICENSE)
