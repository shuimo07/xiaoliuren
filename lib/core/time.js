/** 十二时辰名称，顺序固定（下标 0..11 = 序 1..12） */
const SHICHEN_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
/**
 * 小时（本地 0..23）→ 时辰序（1..12）。
 * 公式：时辰序 = floor(((hour + 1) % 24) / 2) + 1
 * 边界：23:00–00:59 = 子(1)，01:00–02:59 = 丑(2)，…，21:00–22:59 = 亥(12)，23:00 回到子。
 */
export function shichenFromHour(hour) {
    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        throw new Error(`小时必须是 0–23 的整数，收到：${hour}`);
    }
    return Math.floor(((hour + 1) % 24) / 2) + 1;
}
/** 时辰序（1..12）→ 时辰名（子…亥），越界抛中文错误。 */
export function shichenName(ordinal) {
    if (!Number.isInteger(ordinal) || ordinal < 1 || ordinal > 12) {
        throw new Error(`时辰序必须是 1–12 的整数，收到：${ordinal}`);
    }
    return SHICHEN_NAMES[ordinal - 1];
}
/**
 * 农历紧凑数据表（1900–2100 共 201 个整数）。
 * 公开来源：开源农历转换实现中广泛使用的 lunarInfo 常量表（常见于各类“农历 JS
 * 工具”，最初出自 1900–2100 农历数据整理），本项目仅用于内置农历换算，不引入任何
 * 第三方农历/日期运行时库。适用范围：公历 1900-01-31 至 2100-12-31。
 *
 * 编码约定（每个整数 32 位内的低 17 位）：
 *   bit 16        该年闰月为大月(30 天)，否则小月(29 天)
 *   bits 15..4    依次表示正月…腊月为大月(30 天)（位为 1 即 30 天，否则 29 天）
 *   bits 3..0     闰月编号（0 表示无闰月）
 */
const LUNAR_INFO = [
    0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
    0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
    0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
    0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
    0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
    0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0,
    0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
    0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
    0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
    0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
    0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
    0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
    0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
    0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
    0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0,
    0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0,
    0x0a2e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4,
    0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0,
    0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160,
    0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252,
    0x0d520,
];
const DAY_MS = 86_400_000;
const LUNAR_BASE = new Date(1900, 0, 31); // 农历换算起点：1900-01-31 = 农历 1900 年正月初一
/** 某年的闰月编号（0 = 无闰月） */
function leapMonth(year) {
    return LUNAR_INFO[year - 1900] & 0xf;
}
/** 某年闰月的天数（0 = 无闰月） */
function leapDays(year) {
    const leap = leapMonth(year);
    return leap === 0 ? 0 : LUNAR_INFO[year - 1900] & 0x10000 ? 30 : 29;
}
/** 某年某月（非闰月）的天数 */
function monthDays(year, month) {
    return LUNAR_INFO[year - 1900] & (0x10000 >> month) ? 30 : 29;
}
/** 某农历年的总天数 */
function lunarYearDays(year) {
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) {
        sum += LUNAR_INFO[year - 1900] & i ? 1 : 0;
    }
    return sum + leapDays(year);
}
/**
 * 公历（阳历）日期 → 农历日期。独立、可单测。
 * 适用范围：公历 1900-01-31 至 2100-12-31；范围外抛中文错误。
 */
export function solarToLunar(date) {
    // 先归一化到本地当日零点，避免带时刻的日期（如正午）产生半日误差
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let offset = Math.round((dayStart.getTime() - LUNAR_BASE.getTime()) / DAY_MS);
    if (offset < 0) {
        throw new Error('农历换算仅支持 1900-01-31 之后的公历日期');
    }
    let year = 1900;
    while (year <= 2100 && offset >= lunarYearDays(year)) {
        offset -= lunarYearDays(year);
        year += 1;
    }
    if (year > 2100) {
        throw new Error('农历换算仅支持 1900–2100 农历年覆盖的公历日期');
    }
    const leap = leapMonth(year);
    let month = 1;
    let isLeap = false;
    while (month <= 12) {
        const days = monthDays(year, month);
        if (offset < days)
            break;
        offset -= days;
        if (leap !== 0 && month === leap) {
            const leapDaysOfMonth = leapDays(year);
            if (offset < leapDaysOfMonth) {
                isLeap = true;
                break;
            }
            offset -= leapDaysOfMonth;
        }
        month += 1;
    }
    return { year, month, day: offset + 1, isLeap };
}
