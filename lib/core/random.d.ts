import type { RandomSource } from './types.js';
/**
 * 生成一个返回 [0,1) 随机数的函数（可注入随机源）：
 * - 'crypto'（默认）：crypto.getRandomValues，加密级随机；
 * - 'math'：Math.random；
 * - { seed }：确定性 PRNG，同一种子可复现（供测试）。
 */
export declare function makeRng(source?: RandomSource): () => number;
