import type { Palace } from './types.js';
/**
 * 六宫数据表：数法顺序固定，数组下标 0..5 = 宫序 1..6。
 * 数据即配置：任何流派差异（如留连的方位）都修改本表即可，算法不硬编码宫位属性。
 */
export declare const PALACES: readonly Palace[];
/** 按宫序（1-based）取宫位数据，越界抛中文错误。 */
export declare function getPalace(index1based: number): Palace;
