import { getPalace } from './palaces.js';
import { shichenFromHour, shichenName, solarToLunar } from './time.js';
import { makeRng } from './random.js';
import { DEFAULT_DISCLAIMER } from './types.js';
/**
 * 从 start（1-based）起数 n 次后落到的宫序。
 * 当前宫算 1，向前走 (n−1) 步，模 6 回绕：
 *   advance(start, n) = ((start - 1 + n - 1) % 6) + 1
 */
export function advance(startIndex1based, n) {
    if (!Number.isInteger(startIndex1based) || startIndex1based < 1 || startIndex1based > 6) {
        throw new Error(`起始宫序必须是 1–6 的整数，收到：${startIndex1based}`);
    }
    if (!Number.isInteger(n) || n < 1) {
        throw new Error(`数数必须是正整数，收到：${n}`);
    }
    return ((startIndex1based - 1 + n - 1) % 6) + 1;
}
/**
 * 逐步排盘：从大安起正月、月上起日、日上起时，每一步从前一步的落点继续数。
 * 返回 [{ phase:'月', ... }, { phase:'日', ... }, { phase:'时', ... }]，供展示与复核。
 */
export function renderSteps(month, day, hour) {
    assertPositive(month, '月号');
    assertPositive(day, '日号');
    assertPositive(hour, '时号');
    const monthIndex = advance(1, month);
    const dayIndex = advance(monthIndex, day);
    const hourIndex = advance(dayIndex, hour);
    return [
        { phase: '月', number: month, palace: getPalace(monthIndex).name, index: monthIndex },
        { phase: '日', number: day, palace: getPalace(dayIndex).name, index: dayIndex },
        { phase: '时', number: hour, palace: getPalace(hourIndex).name, index: hourIndex },
    ];
}
/**
 * 统一核心：三种起卦最终都走这里。
 * 等价公式：finalIndex = ((month + day + hour - 3) % 6) + 1
 */
export function compute(month, day, hour) {
    assertPositive(month, '月号');
    assertPositive(day, '日号');
    assertPositive(hour, '时号');
    const steps = renderSteps(month, day, hour);
    const finalIndex = ((month + day + hour - 3) % 6) + 1;
    const p = getPalace(finalIndex);
    return {
        steps,
        result: {
            palace: p.name,
            index: p.index,
            auspicious: p.auspicious,
            verdict: p.verdict,
            advice: p.advice,
            wuxing: p.wuxing,
            direction: p.direction,
            shensha: p.shensha,
            verse: p.verse,
            interpretation: p.interpretation,
        },
    };
}
/**
 * 校验报数：1–3 个正整数，否则抛带中文提示的错误。
 * 语义：[n]→月；[n,m]→月、日；[n,m,k]→月、日、时（缺的尾部在 castNumbers 中用当前时间补齐）。
 */
export function validateNumbers(nums) {
    if (!Array.isArray(nums)) {
        throw new Error('报数必须是 1–3 个正整数组成的数组');
    }
    if (nums.length < 1) {
        throw new Error('至少需要报 1 个数');
    }
    if (nums.length > 3) {
        throw new Error('最多只能报 3 个数');
    }
    const result = [];
    for (const n of nums) {
        if (typeof n !== 'number' || !Number.isInteger(n) || n < 1) {
            throw new Error(`报数必须是正整数（如 3、15、5），收到非法值：${String(n)}`);
        }
        result.push(n);
    }
    return result;
}
/** 时间起卦：datetime 缺省 = 当前本地时间；可指定 calendar（公历/农历）与 lateZiShiRollover。 */
export function castTime(dateInput, opts = {}) {
    const calendar = opts.calendar ?? 'solar';
    const source = resolveDate(dateInput, opts.now);
    const effective = applyLateZiRollover(source, opts.lateZiShiRollover ?? false);
    const { month, day } = monthDayOf(effective, calendar);
    const hour = shichenFromHour(effective.getHours());
    return buildResult('time', { month, day, hour, date: formatDate(effective) }, opts.disclaimer);
}
/** 报数起卦：1–3 个正整数依次为 月/日/时，缺的尾部用当前时间的日/时补齐（内部复用时间派生逻辑）。 */
export function castNumbers(nums, opts = {}) {
    const validated = validateNumbers(nums);
    const calendar = opts.calendar ?? 'solar';
    const source = applyLateZiRollover(opts.now ?? new Date(), opts.lateZiShiRollover ?? false);
    const { day: nowDay } = monthDayOf(source, calendar);
    const nowHour = shichenFromHour(source.getHours());
    const [month, day, hour] = validated.length === 1
        ? [validated[0], nowDay, nowHour]
        : validated.length === 2
            ? [validated[0], validated[1], nowHour]
            : [validated[0], validated[1], validated[2]];
    return buildResult('numbers', { month, day, hour }, opts.disclaimer);
}
/** 随机起卦：随机生成 月∈1..12、日∈1..30、时∈1..12（随机源可注入，缺省 crypto）。 */
export function castRandom(opts = {}) {
    const rng = makeRng(opts.randomSource ?? 'crypto');
    const month = 1 + Math.floor(rng() * 12);
    const day = 1 + Math.floor(rng() * 30);
    const hour = 1 + Math.floor(rng() * 12);
    return buildResult('random', { month, day, hour }, opts.disclaimer);
}
// ---- 内部工具（纯函数） ----
function assertPositive(value, label) {
    if (!Number.isInteger(value) || value < 1) {
        throw new Error(`${label}必须是正整数，收到：${value}`);
    }
}
function resolveDate(dateInput, now) {
    if (dateInput === undefined)
        return now ?? new Date();
    if (dateInput instanceof Date) {
        if (Number.isNaN(dateInput.getTime()))
            throw new Error('无效的日期时间');
        return dateInput;
    }
    // 纯日期字符串（YYYY-MM-DD）按本地时间 00:00 解析，避免 JS 默认按 UTC 导致跨日
    const text = /^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? `${dateInput}T00:00:00` : dateInput;
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`无法解析的日期时间：${dateInput}`);
    }
    return date;
}
/** 晚子时（本地 23:00–23:59）滚日开关：开启时日号 +1（Date 自动处理月末/跨年进位）。 */
function applyLateZiRollover(date, rollover) {
    if (!rollover || date.getHours() < 23)
        return date;
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return next;
}
function monthDayOf(date, calendar) {
    if (calendar === 'lunar') {
        const lunar = solarToLunar(date);
        return { month: lunar.month, day: lunar.day };
    }
    if (calendar !== 'solar') {
        throw new Error(`未知的历法：${String(calendar)}`);
    }
    return { month: date.getMonth() + 1, day: date.getDate() };
}
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function buildResult(mode, input, disclaimer) {
    const { steps, result } = compute(input.month, input.day, input.hour);
    // 报数/随机模式下的 hour 可为任意正整数（公式取模），仅当落在 1–12 时才附时辰名
    const shichen = input.hour >= 1 && input.hour <= 12 ? shichenName(input.hour) : undefined;
    return {
        mode,
        input: { ...input, ...(shichen === undefined ? {} : { shichen }) },
        question: null,
        steps,
        result,
        disclaimer: disclaimer ?? DEFAULT_DISCLAIMER,
    };
}
