/**
 * Token 优化工具
 * 基于 Anthropic 文章 "Code Execution with MCP" 的 Token 削减优化
 *
 * 主要优化方法:
 * 1. 数据过滤 - 仅返回必要信息
 * 2. 摘要化 - 返回统计信息而非详细数据
 * 3. 中间结果压缩 - 总结大量数据
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 */

/**
 * 通用的数据数组摘要函数
 * 将方块、实体等大量数据转换为统计信息
 *
 * @param data - 数据数组
 * @param typeExtractor - 提取类型信息的函数
 * @param customAggregator - 自定义聚合逻辑（可选）
 * @param defaultResult - 默认结果对象
 * @returns 统计摘要
 */
function summarizeData<T, R extends { total: number; byType: Record<string, number> }>(
    data: T[],
    typeExtractor: (item: T) => string,
    customAggregator?: (item: T, result: R) => void,
    defaultResult?: R
): R {
    if (!data || data.length === 0) {
        return defaultResult || { total: 0, byType: {} } as R;
    }

    const result: any = defaultResult || { total: data.length, byType: {} };
    result.total = data.length;

    for (const item of data) {
        // 按类型计数
        const type = typeExtractor(item);
        result.byType[type] = (result.byType[type] || 0) + 1;

        // 自定义聚合逻辑
        if (customAggregator) {
            customAggregator(item, result);
        }
    }

    return result as R;
}

/**
 * 将大量方块数据转换为统计摘要
 *
 * 优化前: 10,000 行方块数据 -> 数万 Token
 * 优化后: 统计摘要 -> 数百 Token (削减 98%+)
 *
 * @param blocks - 方块数据数组
 * @returns 统计摘要
 */
export function summarizeBlockData(blocks: any[]): {
    total: number;
    byType: Record<string, number>;
    bounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
        minZ: number;
        maxZ: number;
    };
    volume: number;
} {
    const defaultResult = {
        total: 0,
        byType: {},
        bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 },
        volume: 0
    };

    if (!blocks || blocks.length === 0) {
        return defaultResult;
    }

    // 用于跟踪边界的初始值
    const boundsTracker = {
        minX: Infinity, maxX: -Infinity,
        minY: Infinity, maxY: -Infinity,
        minZ: Infinity, maxZ: -Infinity
    };

    const result = summarizeData(
        blocks,
        (block) => block.type || block.typeId || 'unknown',
        (block, _res) => {
            // 计算边界
            if (block.location || block.position) {
                const pos = block.location || block.position;
                boundsTracker.minX = Math.min(boundsTracker.minX, pos.x);
                boundsTracker.maxX = Math.max(boundsTracker.maxX, pos.x);
                boundsTracker.minY = Math.min(boundsTracker.minY, pos.y);
                boundsTracker.maxY = Math.max(boundsTracker.maxY, pos.y);
                boundsTracker.minZ = Math.min(boundsTracker.minZ, pos.z);
                boundsTracker.maxZ = Math.max(boundsTracker.maxZ, pos.z);
            }
        },
        { ...defaultResult, bounds: boundsTracker, volume: 0 }
    );

    // 计算体积
    const { minX, maxX, minY, maxY, minZ, maxZ } = boundsTracker;
    result.volume = (maxX - minX + 1) * (maxY - minY + 1) * (maxZ - minZ + 1);
    result.bounds = { minX, maxX, minY, maxY, minZ, maxZ };

    return result;
}

/**
 * 摘要化实体列表
 *
 * @param entities - 实体数组
 * @returns 实体摘要
 */
export function summarizeEntities(entities: any[]): {
    total: number;
    byType: Record<string, number>;
    players: number;
    mobs: number;
    items: number;
} {
    const defaultResult = {
        total: 0,
        byType: {},
        players: 0,
        mobs: 0,
        items: 0
    };

    if (!entities || entities.length === 0) {
        return defaultResult;
    }

    return summarizeData(
        entities,
        (entity) => entity.typeId || entity.type || 'unknown',
        (entity, result) => {
            const type = entity.typeId || entity.type || 'unknown';
            if (type.includes('player')) result.players++;
            else if (type.includes('item')) result.items++;
            else result.mobs++;
        },
        defaultResult
    );
}

/**
 * 优化建筑结果
 * 返回摘要而非详细日志
 *
 * @param result - 建筑结果
 * @returns 优化后的结果
 */
export function optimizeBuildResult(result: {
    success: boolean;
    message?: string;
    data?: any;
}): {
    success: boolean;
    message: string;
    summary?: {
        blocksPlaced: number;
        buildTime?: number;
        optimizationRatio?: string;
    };
} {
    if (!result.success || !result.data) {
        return {
            success: result.success,
            message: result.message || 'Build operation completed'
        };
    }

    // 从数据中提取摘要
    const summary: any = {};

    if (result.data.blocksPlaced !== undefined) {
        summary.blocksPlaced = result.data.blocksPlaced;
    } else if (result.data.blocks?.length) {
        summary.blocksPlaced = result.data.blocks.length;
    }

    if (result.data.buildTime !== undefined) {
        summary.buildTime = result.data.buildTime;
    }

    if (result.data.optimizationStats) {
        const stats = result.data.optimizationStats;
        if (stats.before && stats.after) {
            const ratio = ((1 - stats.after / stats.before) * 100).toFixed(1);
            summary.optimizationRatio = `${ratio}% reduction (${stats.before} → ${stats.after})`;
        }
    }

    return {
        success: result.success,
        message: result.message || 'Build completed',
        summary: Object.keys(summary).length > 0 ? summary : undefined
    };
}

/**
 * 优化命令执行结果
 * 将大量的响应数据摘要化
 *
 * @param commandResult - 命令执行结果
 * @returns 优化后的结果
 */
export function optimizeCommandResult(commandResult: any): {
    success: boolean;
    command?: string;
    summary: string;
    details?: any;
} {
    if (!commandResult) {
        return {
            success: false,
            summary: 'No result data'
        };
    }

    // 判定成功/失败
    const success = commandResult.statusCode === 0 ||
                   commandResult.successCount > 0 ||
                   !commandResult.error;

    // 生成摘要
    let summary = success ? 'Command executed successfully' : 'Command failed';

    if (commandResult.successCount !== undefined) {
        summary += ` (${commandResult.successCount} operations)`;
    }

    // 详细数据保持最小化
    const details: any = {};
    if (commandResult.statusMessage) {
        details.status = commandResult.statusMessage;
    }
    if (commandResult.error) {
        details.error = commandResult.error;
    }

    return {
        success,
        command: commandResult.command,
        summary,
        details: Object.keys(details).length > 0 ? details : undefined
    };
}

/**
 * 渐进式披露
 * 起初仅提供摘要，详细信息通过其他动作获取
 *
 * @param data - 原始数据
 * @param detailLevel - 详细程度 ('summary' | 'basic' | 'full')
 * @returns 过滤后的数据
 */
export function progressiveDisclose<T>(
    data: T[],
    detailLevel: 'summary' | 'basic' | 'full' = 'summary'
): T[] | any {
    if (!data || data.length === 0) return [];

    switch (detailLevel) {
        case 'summary':
            // 仅摘要（最小 Token）
            return {
                count: data.length,
                hint: `Use detailLevel='basic' to see first 5 items, or 'full' for all ${data.length} items`
            };

        case 'basic':
            // 仅前 5 条
            return data.slice(0, 5);

        case 'full':
            // 全部数据（注意：消耗大量 Token）
            return data;

        default:
            return data.slice(0, 5);
    }
}

/**
 * 估算 Token 使用量
 *
 * @param text - 文本
 * @returns 估算的 Token 数（1 Token ≈ 4 个英文字符）
 */
export function estimateTokens(text: string): number {
    // 简易估算：英语 4 字符/Token，日语/中文 2 字符/Token
    const asciiChars = (text.match(/[\x00-\x7F]/g) || []).length;
    const nonAsciiChars = text.length - asciiChars;

    return Math.ceil(asciiChars / 4 + nonAsciiChars / 2);
}

/**
 * 检查响应大小并给出警告
 *
 * @param response - 响应对象
 * @param maxTokens - 最大 Token 数（默认：2000）
 * @returns 警告消息（如果有）
 */
export function checkResponseSize(response: any, maxTokens: number = 2000): string | null {
    const responseText = typeof response === 'string'
        ? response
        : JSON.stringify(response);

    const estimatedTokens = estimateTokens(responseText);

    if (estimatedTokens > maxTokens) {
        return `⚠️ Large response (≈${estimatedTokens} tokens). Consider using summary mode to reduce token usage.`;
    }

    return null;
}
