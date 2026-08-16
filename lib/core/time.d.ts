import type { LunarDate } from './types.js';
/**
 * 小时（本地 0..23）→ 时辰序（1..12）。
 * 公式：时辰序 = floor(((hour + 1) % 24) / 2) + 1
 * 边界：23:00–00:59 = 子(1)，01:00–02:59 = 丑(2)，…，21:00–22:59 = 亥(12)，23:00 回到子。
 */
export declare function shichenFromHour(hour: number): number;
/** 时辰序（1..12）→ 时辰名（子…亥），越界抛中文错误。 */
export declare function shichenName(ordinal: number): string;
/**
 * 公历（阳历）日期 → 农历日期。独立、可单测。
 * 适用范围：公历 1900-01-31 至 2100-12-31；范围外抛中文错误。
 */
export declare function solarToLunar(date: Date): LunarDate;
