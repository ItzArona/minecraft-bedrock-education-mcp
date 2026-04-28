/**
 * 服务器核心多语言消息（支持英语、日语、中文）
 */

import { LocaleMessages } from "./locale-manager";

/**
 * 核心系统消息
 */
export const CORE_MESSAGES: LocaleMessages = {
  en: {
    SERVER_STARTING: (port: number) => `Starting SocketBE Minecraft WebSocket server on port: ${port}`,
    CONNECT_COMMAND: (port: number) => `Connect from Minecraft: /connect localhost:${port}/ws`,
    SERVER_STARTED: "SocketBE server started",
    PLAYER_JOINED: (name: string) => `New player joined: ${name}`,
    PLAYER_LEFT: (name: string) => `Player disconnected: ${name}`,
    WELCOME_MESSAGE: (name: string) => `§b[MCP Server] §fWelcome ${name}! AI assistant is available.`,
    CONNECTION_COMPLETE: "§a[MCP Server] Connection complete! AI tools are now available.",
    DELAYED_CONNECTION: "§a[MCP Server] Delayed connection complete! AI tools are now available.",
    PLAYER_NOT_CONNECTED: "Error: No player connected",
    SENDING_MESSAGE: (text: string) => `Sending message: ${text}`,
    MESSAGE_SEND_ERROR: "Message send error",
  },
  ja: {
    SERVER_STARTING: (port: number) => `SocketBE Minecraft WebSocketサーバーを起動中 ポート:${port}`,
    CONNECT_COMMAND: (port: number) => `Minecraftから接続: /connect localhost:${port}/ws`,
    SERVER_STARTED: "SocketBEサーバーが開始されました",
    PLAYER_JOINED: (name: string) => `新しいプレイヤーが参加しました: ${name}`,
    PLAYER_LEFT: (name: string) => `プレイヤーが切断されました: ${name}`,
    WELCOME_MESSAGE: (name: string) => `§b[MCP Server] §f${name}さん、ようこそ！AIアシスタントが利用可能です。`,
    CONNECTION_COMPLETE: "§a[MCP Server] 接続完了！AIツールが利用可能になりました。",
    DELAYED_CONNECTION: "§a[MCP Server] 遅延接続完了！AIツールが利用可能になりました。",
    PLAYER_NOT_CONNECTED: "エラー: プレイヤーが接続されていません",
    SENDING_MESSAGE: (text: string) => `メッセージ送信: ${text}`,
    MESSAGE_SEND_ERROR: "メッセージ送信エラー",
  },
  zh: {
    SERVER_STARTING: (port: number) => `正在启动 SocketBE Minecraft WebSocket 服务器，端口：${port}`,
    CONNECT_COMMAND: (port: number) => `请在 Minecraft 中连接：/connect localhost:${port}/ws`,
    SERVER_STARTED: "SocketBE 服务器已启动",
    PLAYER_JOINED: (name: string) => `新玩家已加入：${name}`,
    PLAYER_LEFT: (name: string) => `玩家已断开连接：${name}`,
    WELCOME_MESSAGE: (name: string) => `§b[MCP Server] §f${name}，欢迎！AI 助手已就绪。`,
    CONNECTION_COMPLETE: "§a[MCP Server] 连接成功！AI 工具现在可用。",
    DELAYED_CONNECTION: "§a[MCP Server] 延迟连接成功！AI 工具现在可用。",
    PLAYER_NOT_CONNECTED: "错误：未连接玩家",
    SENDING_MESSAGE: (text: string) => `正在发送消息：${text}`,
    MESSAGE_SEND_ERROR: "发送消息时出错",
  }
};
