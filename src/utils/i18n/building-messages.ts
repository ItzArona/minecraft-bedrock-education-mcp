/**
 * 建筑工具多语言消息（支持英语、日语、中文）
 *
 * 按语言定义错误消息、成功消息和信息消息，
 * 并在运行时进行切换
 */

import { LocaleMessages, t } from "./locale-manager";

/**
 * 错误消息（英语、日语、中文）
 */
export const BUILD_ERRORS: LocaleMessages = {
  en: {
    // 坐标相关
    INVALID_CENTER:
      "Invalid center position: coordinates must be valid Minecraft world positions",
    EXTENDS_BEYOND_Y_BOUNDS:
      "Shape extends beyond valid Y coordinates (-64 to 320)",
    EXTENDS_BEYOND_WORLD_BOUNDS:
      "Shape extends beyond valid world coordinates (-30000000 to 30000000)",
    COORDINATE_OUT_OF_RANGE: "One or more coordinates are out of valid range",

    // 参数验证
    INVALID_RADIUS:
      "Invalid radius: must be a positive number within allowed limits",
    RADIUS_TOO_LARGE: (max: number) => `Radius must not exceed ${max} blocks`,
    RADIUS_OUT_OF_RANGE: (min: number, max: number) =>
      `Radius must be between ${min} and ${max}`,

    // 数量限制
    TOO_MANY_BLOCKS: (max: number, actual: number) =>
      `Too many blocks to place (${actual.toLocaleString()} > ${max.toLocaleString()} limit)`,
    BLOCKS_EXCEED_SAFETY_LIMIT:
      "Shape would require too many blocks for performance reasons",

    // 形状参数
    INVALID_HEIGHT: "Invalid height: must be a positive number",
    HEIGHT_OUT_OF_RANGE: (min: number, max: number) =>
      `Height must be between ${min} and ${max}`,
    INVALID_WIDTH: "Invalid width: must be a positive number",
    INVALID_LENGTH: "Invalid length: must be a positive number",

    INVALID_MAJOR_RADIUS:
      "Invalid major radius (outer radius): must be positive",
    INVALID_MINOR_RADIUS:
      "Invalid minor radius (inner radius): must be positive and less than major radius",
    MAJOR_RADIUS_TOO_SMALL: "Major radius must be larger than minor radius",

    INVALID_POINTS:
      "Invalid control points: must provide at least 2 points for Bezier curve",
    TOO_MANY_CONTROL_POINTS: (max: number) =>
      `Too many control points (maximum: ${max})`,

    // 材质相关
    INVALID_MATERIAL: "Invalid block type: unknown material",
    MATERIAL_NOT_SPECIFIED: "Material/block type not specified",

    // 方向相关
    INVALID_DIRECTION:
      "Invalid direction: must be +x, +y, +z, -x, -y, -z, or custom",

    // 世界状态
    WORLD_NOT_AVAILABLE:
      "World not available. Ensure Minecraft is connected via WebSocket",
    BUILD_IN_PROGRESS: "Another build operation is in progress",

    // 内部错误
    UNKNOWN_ACTION: (action: string) =>
      `Unknown action: ${action}. Only 'build' is supported`,
    BUILDING_ERROR: "An unexpected error occurred during building",
    ROTATION_FAILED: "Failed to apply rotation transformation",
    COORDINATES_CALCULATION_FAILED: "Failed to calculate shape coordinates",
  },
  ja: {
    // 座標関連
    INVALID_CENTER:
      "無効な中心位置: 座標はMinecraftワールド内の有効な位置である必要があります",
    EXTENDS_BEYOND_Y_BOUNDS: "形状がY座標の有効範囲（-64～320）を超えています",
    EXTENDS_BEYOND_WORLD_BOUNDS:
      "形状がワールド座標の有効範囲（-30000000～30000000）を超えています",
    COORDINATE_OUT_OF_RANGE: "1つ以上の座標が有効範囲外です",

    // パラメータ検証
    INVALID_RADIUS: "無効な半径: 許可された範囲内の正の数である必要があります",
    RADIUS_TOO_LARGE: (max: number) =>
      `半径は${max}ブロック以下である必要があります`,
    RADIUS_OUT_OF_RANGE: (min: number, max: number) =>
      `半径は${min}から${max}の間である必要があります`,

    // サイズ制限
    TOO_MANY_BLOCKS: (max: number, actual: number) =>
      `配置するブロック数が多すぎます（${actual.toLocaleString()} > ${max.toLocaleString()}の制限）`,
    BLOCKS_EXCEED_SAFETY_LIMIT:
      "パフォーマンス上の理由により、形状に必要なブロック数が多すぎます",

    // 形状パラメータ
    INVALID_HEIGHT: "無効な高さ: 正の数である必要があります",
    HEIGHT_OUT_OF_RANGE: (min: number, max: number) =>
      `高さは${min}から${max}の間である必要があります`,
    INVALID_WIDTH: "無効な幅: 正の数である必要があります",
    INVALID_LENGTH: "無効な長さ: 正の数である必要があります",

    INVALID_MAJOR_RADIUS: "無効な外側半径: 正の値である必要があります",
    INVALID_MINOR_RADIUS:
      "無効な内側半径: 正の値で、外側半径より小さい必要があります",
    MAJOR_RADIUS_TOO_SMALL: "外側半径は内側半径より大きい必要があります",

    INVALID_POINTS: "無効な制御点: ベジェ曲線には少なくとも2点が必要です",
    TOO_MANY_CONTROL_POINTS: (max: number) =>
      `制御点が多すぎます（最大: ${max}）`,

    // マテリアル関連
    INVALID_MATERIAL: "無効なブロックタイプ: 未知の素材です",
    MATERIAL_NOT_SPECIFIED: "素材/ブロックタイプが指定されていません",

    // 方向関連
    INVALID_DIRECTION:
      "無効な方向: +x、+y、+z、-x、-y、-z、またはcustomである必要があります",

    // ワールド状態
    WORLD_NOT_AVAILABLE:
      "ワールドが利用できません。MinecraftがWebSocketで接続されているか確認してください",
    BUILD_IN_PROGRESS: "別の建築操作が進行中です",

    // 内部エラー
    UNKNOWN_ACTION: (action: string) =>
      `不明なアクション: ${action}。'build'のみサポートされています`,
    BUILDING_ERROR: "建築中に予期しないエラーが発生しました",
    ROTATION_FAILED: "回転変換の適用に失敗しました",
    COORDINATES_CALCULATION_FAILED: "形状座標の計算に失敗しました",
  },
  zh: {
    // 坐标相关
    INVALID_CENTER: "无效中心位置：坐标必须是有效的 Minecraft 世界位置",
    EXTENDS_BEYOND_Y_BOUNDS: "形状超出了有效的 Y 坐标范围 (-64 到 320)",
    EXTENDS_BEYOND_WORLD_BOUNDS: "形状超出了有效的世界坐标范围 (-30000000 到 30000000)",
    COORDINATE_OUT_OF_RANGE: "一个或多个坐标超出有效范围",

    // 参数验证
    INVALID_RADIUS: "无效半径：必须是允许限制内的正数",
    RADIUS_TOO_LARGE: (max: number) => `半径不得超过 ${max} 个方块`,
    RADIUS_OUT_OF_RANGE: (min: number, max: number) => `半径必须在 ${min} 到 ${max} 之间`,

    // 数量限制
    TOO_MANY_BLOCKS: (max: number, actual: number) => `要放置的方块过多 (${actual.toLocaleString()} > 限制 ${max.toLocaleString()})`,
    BLOCKS_EXCEED_SAFETY_LIMIT: "出于性能原因，该形状需要的方块过多",

    // 形状参数
    INVALID_HEIGHT: "无效高度：必须是正数",
    HEIGHT_OUT_OF_RANGE: (min: number, max: number) => `高度必须在 ${min} 到 ${max} 之间`,
    INVALID_WIDTH: "无效宽度：必须是正数",
    INVALID_LENGTH: "无效长度：必须是正数",

    INVALID_MAJOR_RADIUS: "无效主半径（外半径）：必须是正数",
    INVALID_MINOR_RADIUS: "无效次半径（内半径）：必须是正数且小于主半径",
    MAJOR_RADIUS_TOO_SMALL: "主半径必须大于次半径",

    INVALID_POINTS: "无效控制点：贝塞尔曲线必须提供至少 2 个点",
    TOO_MANY_CONTROL_POINTS: (max: number) => `控制点过多（最大限制：${max}）`,

    // 材质相关
    INVALID_MATERIAL: "无效方块类型：未知材质",
    MATERIAL_NOT_SPECIFIED: "未指定材质/方块类型",

    // 方向相关
    INVALID_DIRECTION: "无效方向：必须是 +x, +y, +z, -x, -y, -z 或 custom",

    // 世界状态
    WORLD_NOT_AVAILABLE: "世界不可用。请确保 Minecraft 已通过 WebSocket 连接",
    BUILD_IN_PROGRESS: "另一个建筑操作正在进行中",

    // 内部错误
    UNKNOWN_ACTION: (action: string) => `未知动作：${action}。仅支持 'build'`,
    BUILDING_ERROR: "建筑过程中发生意外错误",
    ROTATION_FAILED: "应用旋转变换失败",
    COORDINATES_CALCULATION_FAILED: "计算形状坐标失败",
  },
};

/**
 * 成功消息（英语、日语、中文）
 */
export const BUILD_SUCCESS: LocaleMessages = {
  en: {
    SHAPE_PLACED: (shape: string, blocks: number) =>
      `${shape} placed successfully: ${blocks.toLocaleString()} blocks`,
    BUILD_COMPLETE: "Build operation completed",
    OPERATION_QUEUED: "Build operation queued and starting",
  },
  ja: {
    SHAPE_PLACED: (shape: string, blocks: number) =>
      `${shape}の配置が完了しました: ${blocks.toLocaleString()}ブロック`,
    BUILD_COMPLETE: "建築操作が完了しました",
    OPERATION_QUEUED: "建築操作がキューに入り、開始されました",
  },
  zh: {
    SHAPE_PLACED: (shape: string, blocks: number) => `${shape} 已成功放置：${blocks.toLocaleString()} 个方块`,
    BUILD_COMPLETE: "建筑操作已完成",
    OPERATION_QUEUED: "建筑操作已加入队列并开始执行",
  },
};

/**
 * 信息消息（英语、日语、中文）
 */
export const BUILD_INFO: LocaleMessages = {
  en: {
    GENERATING: "Generating shape coordinates...",
    CALCULATING: "Calculating geometry...",
    VALIDATING: "Validating parameters...",
    OPTIMIZING: "Optimizing block placement...",
    BUILDING: "Building shape...",
    BATCH_PROCESSING: "Processing in batches...",
  },
  ja: {
    GENERATING: "形状座標を生成中...",
    CALCULATING: "幾何学計算中...",
    VALIDATING: "パラメータを検証中...",
    OPTIMIZING: "ブロック配置を最適化中...",
    BUILDING: "形状を建築中...",
    BATCH_PROCESSING: "バッチ処理中...",
  },
  zh: {
    GENERATING: "正在生成形状坐标...",
    CALCULATING: "正在进行几何计算...",
    VALIDATING: "正在验证参数...",
    OPTIMIZING: "正在优化方块放置...",
    BUILDING: "正在建造形状...",
    BATCH_PROCESSING: "正在进行分批处理...",
  },
};

/**
 * 警告消息（英语、日语、中文）
 */
export const BUILD_WARNINGS: LocaleMessages = {
  en: {
    LARGE_SHAPE: (blocks: number) =>
      `Warning: Large shape with ${blocks.toLocaleString()} blocks may take time to build`,
    PERFORMANCE_CONSIDERATION:
      "Consider using smaller dimensions for better performance",
    PARTIAL_BUILD: "Build operation completed with some blocks skipped",
  },
  ja: {
    LARGE_SHAPE: (blocks: number) =>
      `警告: ${blocks.toLocaleString()}ブロックの大きな形状は建築に時間がかかる場合があります`,
    PERFORMANCE_CONSIDERATION:
      "より良いパフォーマンスのために、より小さなサイズの使用を検討してください",
    PARTIAL_BUILD: "一部のブロックをスキップして建築操作が完了しました",
  },
  zh: {
    LARGE_SHAPE: (blocks: number) => `警告：包含 ${blocks.toLocaleString()} 个方块的大型形状可能需要一些时间来建造`,
    PERFORMANCE_CONSIDERATION: "为了获得更好的性能，请考虑减小尺寸",
    PARTIAL_BUILD: "建筑操作已完成，但跳过了一些方块",
  },
};

/**
 * 坐标验证消息（英语、日语、中文）
 */
export const COORDINATE_VALIDATION: LocaleMessages = {
  en: {
    X_OUT_OF_RANGE: (x: number) => `X coordinate ${x} is out of valid range`,
    Y_OUT_OF_RANGE: (y: number) =>
      `Y coordinate ${y} is out of valid range (-64 to 320)`,
    Z_OUT_OF_RANGE: (z: number) => `Z coordinate ${z} is out of valid range`,
    NORMALIZED_TO: (original: number, normalized: number) =>
      `Coordinate normalized from ${original} to ${normalized}`,
  },
  ja: {
    X_OUT_OF_RANGE: (x: number) => `X座標 ${x} が有効範囲外です`,
    Y_OUT_OF_RANGE: (y: number) => `Y座標 ${y} が有効範囲外です（-64～320）`,
    Z_OUT_OF_RANGE: (z: number) => `Z座標 ${z} が有効範囲外です`,
    NORMALIZED_TO: (original: number, normalized: number) =>
      `座標が ${original} から ${normalized} に正規化されました`,
  },
  zh: {
    X_OUT_OF_RANGE: (x: number) => `X 坐标 ${x} 超出有效范围`,
    Y_OUT_OF_RANGE: (y: number) => `Y 坐标 ${y} 超出有效范围 (-64 到 320)`,
    Z_OUT_OF_RANGE: (z: number) => `Z 坐标 ${z} 超出有效范围`,
    NORMALIZED_TO: (original: number, normalized: number) => `坐标已从 ${original} 归一化为 ${normalized}`,
  },
};

/**
 * 生成错误响应的辅助函数（多语言支持）
 */
export function createErrorMessage(
  type: "coordinate" | "parameter" | "limit" | "world" | "internal",
  messageKey: string,
  ...args: any[]
): string {
  const prefixMessages: LocaleMessages = {
    en: {
      coordinate: "[Coordinate Error]",
      parameter: "[Parameter Error]",
      limit: "[Limit Error]",
      world: "[World Error]",
      internal: "[Internal Error]",
    },
    ja: {
      coordinate: "[座標エラー]",
      parameter: "[パラメータエラー]",
      limit: "[制限エラー]",
      world: "[ワールドエラー]",
      internal: "[内部エラー]",
    },
    zh: {
      coordinate: "[坐标错误]",
      parameter: "[参数错误]",
      limit: "[限制错误]",
      world: "[世界错误]",
      internal: "[内部错误]",
    },
  };

  const prefix = t(prefixMessages, type);
  return `${prefix} ${messageKey}`;
}

/**
 * 便捷的翻译函数集
 */
export const getErrorMessage = (key: string, ...args: any[]) =>
  t(BUILD_ERRORS, key, ...args);
export const getSuccessMessage = (key: string, ...args: any[]) =>
  t(BUILD_SUCCESS, key, ...args);
export const getInfoMessage = (key: string, ...args: any[]) =>
  t(BUILD_INFO, key, ...args);
export const getWarningMessage = (key: string, ...args: any[]) =>
  t(BUILD_WARNINGS, key, ...args);
export const getCoordinateValidationMessage = (key: string, ...args: any[]) =>
  t(COORDINATE_VALIDATION, key, ...args);
