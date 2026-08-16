import type { CastResult } from './core/types.js';
/**
 * 结论优先的文本卡片（插件 render 与 CLI 默认输出共用，保证两者一致）。
 * 结构：
 *   【小六壬】结果
 *   所问：…（有 question 时）
 *   起卦：报数（3·15·5）→ 小吉
 *   结论：verdict —— advice。
 *   （吉｜木｜北方｜六合）
 *   ※ disclaimer（必含）
 */
export declare function renderCard(result: CastResult): string;
