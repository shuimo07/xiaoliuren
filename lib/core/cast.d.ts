import type { CastOptions, CastResult, PalaceResult, RandomCastOptions, Step } from './types.js';
/**
 * 从 start（1-based）起数 n 次后落到的宫序。
 * 当前宫算 1，向前走 (n−1) 步，模 6 回绕：
 *   advance(start, n) = ((start - 1 + n - 1) % 6) + 1
 */
export declare function advance(startIndex1based: number, n: number): number;
/**
 * 逐步排盘：从大安起正月、月上起日、日上起时，每一步从前一步的落点继续数。
 * 返回 [{ phase:'月', ... }, { phase:'日', ... }, { phase:'时', ... }]，供展示与复核。
 */
export declare function renderSteps(month: number, day: number, hour: number): Step[];
/**
 * 统一核心：三种起卦最终都走这里。
 * 等价公式：finalIndex = ((month + day + hour - 3) % 6) + 1
 */
export declare function compute(month: number, day: number, hour: number): {
    steps: Step[];
    result: PalaceResult;
};
/**
 * 校验报数：1–3 个正整数，否则抛带中文提示的错误。
 * 语义：[n]→月；[n,m]→月、日；[n,m,k]→月、日、时（缺的尾部在 castNumbers 中用当前时间补齐）。
 */
export declare function validateNumbers(nums: unknown): number[];
/** 时间起卦：datetime 缺省 = 当前本地时间；可指定 calendar（公历/农历）与 lateZiShiRollover。 */
export declare function castTime(dateInput?: string | Date, opts?: CastOptions): CastResult;
/** 报数起卦：1–3 个正整数依次为 月/日/时，缺的尾部用当前时间的日/时补齐（内部复用时间派生逻辑）。 */
export declare function castNumbers(nums: number[], opts?: CastOptions): CastResult;
/** 随机起卦：随机生成 月∈1..12、日∈1..30、时∈1..12（随机源可注入，缺省 crypto）。 */
export declare function castRandom(opts?: RandomCastOptions): CastResult;
