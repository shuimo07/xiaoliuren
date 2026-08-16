/** 起卦方式的中文标签 */
const MODE_LABEL = {
    time: '时间',
    numbers: '报数',
    random: '随机',
};
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
export function renderCard(result) {
    const lines = ['【小六壬】结果'];
    if (result.question !== null && result.question !== undefined) {
        lines.push(`所问：${result.question}`);
    }
    const numbersText = result.mode === 'numbers' ? `（${result.input.month}·${result.input.day}·${result.input.hour}）` : '';
    lines.push(`起卦：${MODE_LABEL[result.mode]}${numbersText} → ${result.result.palace}`);
    lines.push(`结论：${result.result.verdict} —— ${result.result.advice}。`);
    lines.push(`（${result.result.auspicious ? '吉' : '凶'}｜${result.result.wuxing}｜${result.result.direction}｜${result.result.shensha}）`);
    lines.push(`※ ${result.disclaimer}`);
    return lines.join('\n');
}
