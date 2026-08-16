import z from '@deepseek-ai/schemastery';
export * from './core/index.js';
/** 插件名（DSH 四元组之一） */
export declare const name = "tool-xiaoliuren";
/** 依赖注入的服务（DSH 四元组之一） */
export declare const inject: string[];
/** 插件配置 schema（DSH 四元组之一；Loader 未规范化时也由 resolveConfig 兜底） */
export declare const Config: z<Schemastery.ObjectS<{
    calendar: z<"solar" | "lunar", "solar" | "lunar">;
    randomSource: z<"crypto" | "math", "crypto" | "math">;
    disclaimer: z<string, string>;
}>, Schemastery.ObjectT<{
    calendar: z<"solar" | "lunar", "solar" | "lunar">;
    randomSource: z<"crypto" | "math", "crypto" | "math">;
    disclaimer: z<string, string>;
}>>;
interface PluginConfigInput {
    calendar?: unknown;
    randomSource?: unknown;
    disclaimer?: unknown;
}
/** apply 所需的最小 ctx 结构（systemPrompt + tools），便于独立测试。 */
interface PluginContext {
    systemPrompt: {
        section(section: {
            name: string;
            order: number;
            text: string;
        }): () => void;
    };
    tools: {
        register(tool: unknown): unknown;
    };
}
/** 插件本体：注册系统提示段落 + xiaoliuren 工具（DSH 四元组之一）。 */
export declare function apply(ctx: PluginContext, config?: PluginConfigInput): void;
