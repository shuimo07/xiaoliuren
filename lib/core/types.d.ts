/**
 * 小六壬核心类型定义。
 */
/** 起卦方式 */
export type Mode = 'time' | 'numbers' | 'random';
/** 时间起卦所用历法 */
export type Calendar = 'solar' | 'lunar';
/** 随机源：crypto（加密随机，默认）/ math（Math.random）/ { seed }（可复现的确定性随机） */
export type RandomSource = 'crypto' | 'math' | {
    seed: number;
};
/** 六宫数据行（数据即配置：任何流派差异都改这里，算法不硬编码宫位属性） */
export interface Palace {
    /** 宫序（1–6，对应 大安…空亡） */
    index: number;
    /** 宫名 */
    name: string;
    /** 吉凶 */
    auspicious: boolean;
    /** 五行 */
    wuxing: string;
    /** 方位 */
    direction: string;
    /** 神煞 */
    shensha: string;
    /** 白话结论 */
    verdict: string;
    /** 建议 */
    advice: string;
    /** 断辞 */
    verse: string;
    /** 传统释义（断辞的简短白话解释） */
    interpretation: string;
}
/** 最终宫位的展示结果（CastResult.result） */
export interface PalaceResult {
    palace: string;
    index: number;
    auspicious: boolean;
    verdict: string;
    advice: string;
    wuxing: string;
    direction: string;
    shensha: string;
    verse: string;
    interpretation: string;
}
/** 起卦输入 */
export interface CastInput {
    /** 月号（1-based；报数模式可为任意正整数） */
    month: number;
    /** 日号 */
    day: number;
    /** 时号（时辰序 1–12） */
    hour: number;
    /** 时间起卦时的日期（YYYY-MM-DD） */
    date?: string;
    /** 时辰名（子…亥） */
    shichen?: string;
}
/** 逐步排盘的一步 */
export interface Step {
    phase: '月' | '日' | '时';
    /** 本步所数之数（展示保留原数） */
    number: number;
    /** 落到宫名 */
    palace: string;
    /** 落到宫序（1–6） */
    index: number;
}
/** 一次起卦的完整结果（库返回值 = 工具输出 schema 基础） */
export interface CastResult {
    mode: Mode;
    input: CastInput;
    /** 所问之事：只参与表述、不参与数法 */
    question: string | null;
    steps: Step[];
    result: PalaceResult;
    disclaimer: string;
}
/** 农历日期 */
export interface LunarDate {
    year: number;
    month: number;
    day: number;
    /** 是否为闰月 */
    isLeap: boolean;
}
/** 时间 / 报数起卦选项 */
export interface CastOptions {
    /** 使用公历（默认）还是农历 */
    calendar?: Calendar;
    /** 晚子时（23:00–23:59）是否计入次日并让日号 +1，默认 false（不滚日） */
    lateZiShiRollover?: boolean;
    /** 免责声明文案，缺省用 DEFAULT_DISCLAIMER */
    disclaimer?: string;
    /** 可注入的“当前时间”，便于测试；缺省为实际当前时间 */
    now?: Date;
}
/** 随机起卦选项 */
export interface RandomCastOptions {
    /** 随机源，缺省 crypto */
    randomSource?: RandomSource;
    /** 免责声明文案，缺省用 DEFAULT_DISCLAIMER */
    disclaimer?: string;
}
/** 默认免责声明（可被插件配置覆盖） */
export declare const DEFAULT_DISCLAIMER = "\u4EE5\u4E0A\u4E3A\u4F20\u7EDF\u6C11\u4FD7\u6587\u5316\u5A31\u4E50\u53C2\u8003\uFF0C\u4E0D\u6784\u6210\u4EFB\u4F55\u4E13\u4E1A\u5EFA\u8BAE\u3002";
