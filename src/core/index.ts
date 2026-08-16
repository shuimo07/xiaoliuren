/** 核心库公共 API（零运行时依赖，纯函数；唯一例外是可注入的随机源）。 */

export { PALACES, getPalace } from './palaces.js'
export { advance, renderSteps, compute, validateNumbers, castTime, castNumbers, castRandom } from './cast.js'
export { shichenFromHour, shichenName, solarToLunar } from './time.js'
export { makeRng } from './random.js'
export { DEFAULT_DISCLAIMER } from './types.js'
export type {
  Mode,
  Calendar,
  RandomSource,
  Palace,
  PalaceResult,
  CastInput,
  Step,
  CastResult,
  LunarDate,
  CastOptions,
  RandomCastOptions,
} from './types.js'
