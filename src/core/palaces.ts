import type { Palace } from './types.js'

/**
 * 六宫数据表：数法顺序固定，数组下标 0..5 = 宫序 1..6。
 * 数据即配置：任何流派差异（如留连的方位）都修改本表即可，算法不硬编码宫位属性。
 */
export const PALACES: readonly Palace[] = [
  {
    index: 1,
    name: '大安',
    auspicious: true,
    wuxing: '木',
    direction: '东',
    shensha: '青龙',
    verdict: '所问之事大体安稳顺利，成功可能性较高',
    advice: '按原计划稳步行事，宜早不宜迟',
    verse: '大安事事昌，求谋在坤方；失物去不远，宅舍保安康。',
    interpretation: '大安主安稳：谋事可成，宜按部就班、尽早着手。',
  },
  {
    index: 2,
    name: '留连',
    auspicious: false,
    wuxing: '水',
    direction: '南',
    shensha: '玄武',
    verdict: '所问之事易拖延反复，短期难见结果',
    advice: '暂缓推进，重新审视方案或等时机',
    verse: '留连事难成，求谋日未明；官事只宜缓，去者未回程。',
    interpretation: '留连主阻滞：事多反复难成，宜缓不宜急，静待转机。',
  },
  {
    index: 3,
    name: '速喜',
    auspicious: true,
    wuxing: '火',
    direction: '南',
    shensha: '朱雀',
    verdict: '所问之事进展较快，多有助力，成功在望',
    advice: '抓住时机快速行动，勿错失良机',
    verse: '速喜喜来临，求财向南行；失物申未午，逢人路上寻。',
    interpretation: '速喜主迅捷：谋事顺遂有成，宜当机立断、乘势而上。',
  },
  {
    index: 4,
    name: '赤口',
    auspicious: false,
    wuxing: '金',
    direction: '西',
    shensha: '白虎',
    verdict: '所问之事阻力较大，易有口舌是非或争执',
    advice: '谨言慎行，注意沟通与合同细节',
    verse: '赤口主口舌，官非切要防；失物急去寻，行人有惊慌。',
    interpretation: '赤口主口舌是非：谋事阻碍多，须谨言慎行、防范官非争执。',
  },
  {
    index: 5,
    name: '小吉',
    auspicious: true,
    wuxing: '木',
    direction: '北',
    shensha: '六合',
    verdict: '所问之事大吉，成功可期，诸事顺遂',
    advice: '宜积极行动，趁势而为',
    verse: '小吉最吉昌，路上好商量；阴人来报喜，失物在坤方。',
    interpretation: '小吉主大吉：谋事顺遂可成，宜积极进取、广结善缘。',
  },
  {
    index: 6,
    name: '空亡',
    auspicious: false,
    wuxing: '土',
    direction: '中',
    shensha: '勾陈',
    verdict: '所问之事易落空或变数大，难达预期',
    advice: '宜观望、降低预期或重新规划',
    verse: '空亡事不长，阴人多乖张；求财无利益，行人有灾殃。',
    interpretation: '空亡主落空：谋事难成易变，宜谨慎观望、重新规划。',
  },
]

/** 按宫序（1-based）取宫位数据，越界抛中文错误。 */
export function getPalace(index1based: number): Palace {
  if (!Number.isInteger(index1based) || index1based < 1 || index1based > PALACES.length) {
    throw new Error(`宫序必须在 1–${PALACES.length} 之间，收到：${index1based}`)
  }
  return PALACES[index1based - 1]
}
