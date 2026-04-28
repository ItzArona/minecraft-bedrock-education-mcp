/**
 * 多语言支持系统 (i18n - Internationalization)
 * 错误消息、成功消息、信息消息的语言切换
 */

/**
 * 支持的语言
 */
export type SupportedLocale = "en" | "ja" | "zh";

/**
 * 消息翻译映射的类型定义
 */
export type TranslationMap = Record<
  string,
  string | ((...args: any[]) => string)
>;

/**
 * 按语言划分的消息集合
 */
export interface LocaleMessages {
  en: TranslationMap;
  ja: TranslationMap;
  zh: TranslationMap;
}

/**
 * 全局语言设置管理器
 */
class LocaleManager {
  private currentLocale: SupportedLocale = "en"; // 默认为英语

  /**
   * 获取当前语言
   */
  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * 设置语言
   * @param locale 要设置的语言 ('en', 'ja' 或 'zh')
   */
  setLocale(locale: SupportedLocale): void {
    this.currentLocale = locale;
  }

  /**
   * 从环境变量中自动检测语言
   */
  detectLocale(): SupportedLocale {
    // 1. 检查环境变量 MINECRAFT_MCP_LANG
    const envLang = process.env.MINECRAFT_MCP_LANG;
    if (envLang === "ja" || envLang === "en" || envLang === "zh") {
      return envLang as SupportedLocale;
    }

    // 2. 检查系统语言
    const systemLang = process.env.LANG || process.env.LANGUAGE || "";
    if (systemLang.startsWith("zh")) {
      return "zh";
    }
    if (systemLang.startsWith("ja")) {
      return "ja";
    }

    // 3. 默认为英语
    return "en";
  }

  /**
   * 应用自动检测到的语言
   */
  autoDetect(): void {
    this.currentLocale = this.detectLocale();
  }
}

/**
 * 全局实例 (单例)
 */
export const localeManager = new LocaleManager();

/**
 * 获取多语言消息的辅助函数
 *
 * @param messages 按语言划分的消息对象
 * @param key 消息键
 * @param args 传递给消息的参数（用于参数化消息）
 * @returns 本地化后的消息
 *
 * @example
 * ```typescript
 * const messages = {
 *   en: { greeting: 'Hello', error: (code: number) => `Error ${code}` },
 *   zh: { greeting: '你好', error: (code: number) => `错误 ${code}` }
 * };
 *
 * t(messages, 'greeting'); // 'Hello' 或 '你好'
 * t(messages, 'error', 404); // 'Error 404' 或 '错误 404'
 * ```
 */
export function t(
  messages: LocaleMessages,
  key: string,
  ...args: any[]
): string {
  const locale = localeManager.getLocale();
  const message = messages[locale]?.[key];

  if (!message) {
    // 回退机制：如果找不到对应语言的键，尝试英语
    const fallbackMessage = messages["en"]?.[key];
    if (!fallbackMessage) {
      return `[Missing translation: ${key}]`;
    }
    return typeof fallbackMessage === "function"
      ? fallbackMessage(...args)
      : fallbackMessage;
  }

  return typeof message === "function" ? message(...args) : message;
}

/**
 * 一次性获取多个消息的辅助函数
 */
export function createTranslator(messages: LocaleMessages) {
  return (key: string, ...args: any[]): string => t(messages, key, ...args);
}

/**
 * 初始化语言设置（在服务器启动时调用）
 */
export function initializeLocale(locale?: SupportedLocale): void {
  if (locale) {
    localeManager.setLocale(locale);
  } else {
    localeManager.autoDetect();
  }
}

/**
 * 获取当前语言的便捷函数
 */
export function getCurrentLocale(): SupportedLocale {
  return localeManager.getLocale();
}

/**
 * 修改语言的便捷函数
 */
export function setLocale(locale: SupportedLocale): void {
  localeManager.setLocale(locale);
}
