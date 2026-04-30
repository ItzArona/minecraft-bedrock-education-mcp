import { Server as SocketBE, ServerEvent, World, Agent } from "socket-be";
import { v4 as uuidv4 } from "uuid";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  ConnectedPlayer,
  ToolCallResult,
} from "./types";

// 高级建筑工具
import { BuildCubeTool } from "./tools/advanced/building/build-cube";
import { BuildLineTool } from "./tools/advanced/building/build-line";
import { BuildSphereTool } from "./tools/advanced/building/build-sphere";
import { BuildParaboloidTool } from "./tools/advanced/building/build-paraboloid";
import { BuildHyperboloidTool } from "./tools/advanced/building/build-hyperboloid";
import { BuildCylinderTool } from "./tools/advanced/building/build-cylinder";
import { BuildTorusTool } from "./tools/advanced/building/build-torus";
import { BuildHelixTool } from "./tools/advanced/building/build-helix";
import { BuildEllipsoidTool } from "./tools/advanced/building/build-ellipsoid";
import { BuildRotateTool } from "./tools/advanced/building/build-rotate";
import { BuildTransformTool } from "./tools/advanced/building/build-transform";
import { BuildBezierTool } from "./tools/advanced/building/build-bezier";

// Socket-BE 核心 API 工具（推荐）
import { AgentTool } from "./tools/core/agent";
import { WorldTool } from "./tools/core/world";
import { PlayerTool } from "./tools/core/player";
import { BlocksTool } from "./tools/core/blocks";
import { SystemTool } from "./tools/core/system";
import { CameraTool } from "./tools/core/camera";
import { SequenceTool } from "./tools/core/sequence";
import { MinecraftWikiTool } from "./tools/core/minecraft-wiki";

import { BaseTool } from "./tools/base/tool";
import { initializeLocale, SupportedLocale, t } from "./utils/i18n/locale-manager";
import { CORE_MESSAGES } from "./utils/i18n/server-messages";
import {
  optimizeBuildResult,
  optimizeCommandResult,
  checkResponseSize,
} from "./utils/token-optimizer";
import { SchemaToZodConverter } from "./utils/schema-converter";
import { enrichErrorWithHints } from "./utils/error-hints";

/**
 * Minecraft 基岩版 MCP 服务器
 *
 * 通过 WebSocket 连接控制 Minecraft 基岩版 (Bedrock Edition) 和 教育版 (Education Edition)，
 * 实现 MCP (Model Context Protocol) 协议，
 * 提供与 AI 客户端（如 Claude Desktop）的集成。
 *
 * @description
 * 该服务器提供以下功能：
 * - 通过 WebSocket 连接 Minecraft 基岩版
 * - 符合 MCP 2.0 协议的 AI 客户端集成
 * - 15 种分层工具（基础操作、复合操作）
 * - 玩家、代理 (Agent)、世界、建筑控制
 *
 * @example
 * ```typescript
 * // 启动服务器
 * const server = new MinecraftMCPServer();
 * server.start(8001);
 *
 * // 从 Minecraft 连接: /connect "localhost:8001/ws"
 * ```
 *
 * @since 1.0.0
 * @author mcbk-mcp contributors
 * @see {@link https://github.com/Mming-Lab/minecraft-bedrock-mcp-server}
 * @see {@link https://modelcontextprotocol.io/} MCP Protocol
 */
export class MinecraftMCPServer {
  private connectedPlayer: ConnectedPlayer | null = null;
  private socketBE: SocketBE | null = null;
  private tools: BaseTool[] = [];
  private currentWorld: World | null = null;
  private currentAgent: Agent | null = null;
  private mcpServer: McpServer;

  constructor() {
    // 初始化 MCP 官方 SDK 服务器
    this.mcpServer = new McpServer(
      {
        name: "minecraft-bedrock-education-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  /**
   * 启动 MCP 服务器
   *
   * 初始化 WebSocket 服务器和 MCP 接口，
   * 等待来自 Minecraft 客户端的连接。
   *
   * @param port - WebSocket 服务器端口号（默认：8001）
   * @throws 启动 WebSocket 服务器失败时抛出异常
   *
   * @example
   * ```typescript
   * const server = new MinecraftMCPServer();
   * server.start(8001); // 在 8001 端口启动
   *
   * // 从 Minecraft 连接：
   * // /connect "localhost:8001/ws"
   * ```
   */
  public async start(
    port: number = 8001,
    locale?: SupportedLocale,
    disableEncryption: boolean = false,
    debugWs: boolean = false,
    commandVersion?: number,
    disablePlayerListPoll: boolean = false,
    minecraftVersion?: string
  ): Promise<void> {
    // 初始化语言设置
    initializeLocale(locale);

    // 初始化 MCP 及其工具
    await this.setupMCPServer();

    // 启动 Socket-BE 服务器
    this.setupSocketBEServer(port, disableEncryption, debugWs, commandVersion, disablePlayerListPoll, minecraftVersion);

    // 注册事件处理程序
    this.setupEventHandlers();
  }

  /**
   * 初始化 MCP 服务器和工具
   * @private
   */
  private async setupMCPServer(): Promise<void> {
    // 初始化工具
    this.initializeTools();

    // 注册基础工具
    this.registerBasicTools();

    // 注册模块化工具
    this.registerModularTools();

    // 连接到 MCP Stdio 传输层
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
  }

  /**
   * 启动 Socket-BE 服务器
   * @private
   */
  private setupSocketBEServer(
    port: number,
    disableEncryption: boolean,
    debugWs: boolean,
    commandVersion?: number,
    disablePlayerListPoll: boolean = false,
    minecraftVersion?: string
  ): void {
    // 启动 Socket-BE Minecraft 服务器
    this.socketBE = new SocketBE({ port, disableEncryption, commandVersion });

    this.patchSocketBEWorldCommands(disablePlayerListPoll, minecraftVersion);

    if (debugWs) {
      this.attachWebSocketDebugLogging();
    }

    // 仅在非 MCP 模式（有 TTY）时输出日志到 stderr
    if (process.stdin.isTTY !== false) {
      console.error(t(CORE_MESSAGES, "SERVER_STARTING", port));
      console.error(t(CORE_MESSAGES, "CONNECT_COMMAND", port));
      if (disableEncryption) {
        console.error(t(CORE_MESSAGES, "ENCRYPTION_DISABLED"));
      }
      if (debugWs) {
        console.error(t(CORE_MESSAGES, "WS_DEBUG_ENABLED"));
      }
      if (commandVersion !== undefined) {
        console.error(t(CORE_MESSAGES, "COMMAND_VERSION", commandVersion));
      }
      if (disablePlayerListPoll) {
        console.error(t(CORE_MESSAGES, "PLAYER_LIST_POLL_DISABLED"));
      }
      if (minecraftVersion) {
        console.error(t(CORE_MESSAGES, "MINECRAFT_VERSION", minecraftVersion));
      }
    }
  }

  private patchSocketBEWorldCommands(disablePlayerListPoll: boolean = false, minecraftVersion?: string): void {
    const worlds = (this.socketBE as any)?.worlds;
    const originalSet = worlds?.set?.bind(worlds);
    if (!worlds || !originalSet || (worlds as any).__mcpPatched) return;

    (worlds as any).__mcpPatched = true;

    worlds.set = (connection: any, world: any) => {
      const originalRunCommand = world.runCommand?.bind(world);

      if (originalRunCommand) {
        world.runCommand = async (command: string, options?: any) => {
          const requestId = uuidv4();
          const body: Record<string, unknown> = {
            commandLine: command,
            origin: { type: "player" }
          };

          const version = options?.minecraftVersion ?? minecraftVersion;
          if (typeof version === "string" && version.trim().length > 0) {
            body.version = version;
          }

          const payload = JSON.stringify({
            header: {
              version: 1,
              requestId,
              messageType: "commandRequest",
              messagePurpose: "commandRequest"
            },
            body
          });

          if (options?.noResponse) {
            world.connection.send(payload);
            return { statusCode: 0, statusMessage: "" };
          }

          const pendingResponse = world.connection.awaitResponse(requestId, options?.timeout);
          world.connection.send(payload);
          const response = await pendingResponse;
          return response.toCommandResult();
        };
      }

      if (disablePlayerListPoll) {
        world.startInterval = () => undefined;
        world.updatePlayerList = async () => undefined;
      }

      return originalSet(connection, world);
    };
  }

  private attachWebSocketDebugLogging(): void {
    const webSocketServer = (this.socketBE as any)?.network?.wss;
    if (!webSocketServer) return;

    webSocketServer.on("connection", (ws: any, request: any) => {
      const remote = `${request?.socket?.remoteAddress ?? "unknown"}:${request?.socket?.remotePort ?? "unknown"}`;
      const url = request?.url ?? "unknown";
      console.error(`[SocketBE debug] WebSocket connected from ${remote} path=${url}`);

      let outboundCount = 0;
      const originalSend = ws.send.bind(ws);
      ws.send = (data: any, ...args: any[]) => {
        outboundCount += 1;
        if (outboundCount <= 20) {
          const text = Buffer.isBuffer(data) ? data.toString("utf8") : String(data);
          console.error(`[SocketBE debug] Server packet #${outboundCount}: ${text.slice(0, 500)}`);
        }
        return originalSend(data, ...args);
      };

      let inboundCount = 0;
      ws.on("message", (data: Buffer) => {
        inboundCount += 1;
        if (inboundCount <= 20) {
          const text = data.toString("utf8");
          console.error(`[SocketBE debug] Client packet #${inboundCount}: ${text.slice(0, 500)}`);
        }
      });

      ws.once("message", (data: Buffer) => {
        const text = data.toString("utf8");
        console.error(`[SocketBE debug] First client packet: ${text.slice(0, 300)}`);
      });

      ws.on("close", (code: number, reason: Buffer) => {
        console.error(`[SocketBE debug] WebSocket closed code=${code} reason=${reason.toString("utf8")}`);
      });

      ws.on("error", (error: Error) => {
        console.error(`[SocketBE debug] WebSocket error: ${error.message}`);
      });
    });
  }

  /**
   * 注册 Socket-BE 事件处理程序
   * @private
   */
  private setupEventHandlers(): void {
    if (!this.socketBE) return;

    this.socketBE.on(ServerEvent.Open, () => {
      this.handleServerOpen();
    });

    this.socketBE.on(ServerEvent.PlayerJoin, async (ev: any) => {
      await this.handlePlayerJoin(ev);
    });

    this.socketBE.on(ServerEvent.PlayerLeave, (ev: any) => {
      this.handlePlayerLeave(ev);
    });
  }

  /**
   * 服务器开启时的处理
   * @private
   */
  private handleServerOpen(): void {
    if (process.stdin.isTTY !== false) {
      console.error(t(CORE_MESSAGES, "SERVER_STARTED"));
    }

    // 10 秒后强制设置世界和代理
    this.scheduleWorldInitialization(10000);

    // 定期检查世界（每 30 秒）
    this.startPeriodicWorldCheck(30000);
  }

  /**
   * 调度世界初始化
   * @private
   */
  private scheduleWorldInitialization(delayMs: number): void {
    setTimeout(async () => {
      try {
        const worlds = this.socketBE?.worlds;
        if (worlds && worlds instanceof Map && worlds.size > 0) {
          await this.initializeWorld(Array.from(worlds.values())[0]);
        }
      } catch (error) {
        // 强制设置失败时忽略，继续运行服务器
      }
    }, delayMs);
  }

  /**
   * 开始定期检查世界
   * @private
   */
  private startPeriodicWorldCheck(intervalMs: number): void {
    setInterval(async () => {
      if (!this.currentWorld && this.socketBE) {
        const worlds = this.socketBE.worlds;
        if (worlds instanceof Map && worlds.size > 0) {
          await this.initializeWorld(Array.from(worlds.values())[0]);
        }
      }
    }, intervalMs);
  }

  /**
   * 初始化世界和代理，并配置给工具
   * @private
   */
  private async initializeWorld(world: World): Promise<void> {
    this.currentWorld = world;

    // 不在连接初始化时自动创建 agent，避免因权限不足踢掉客户端。
    this.currentAgent = null;

    // 设置临时玩家信息
    if (!this.connectedPlayer) {
      this.connectedPlayer = {
        ws: null,
        name: "MinecraftPlayer",
        id: uuidv4(),
      };
    }

    // 更新所有工具的 Socket-BE 实例
    this.updateToolsWithWorldInstances();
  }

  /**
   * 为所有工具设置世界和代理实例
   * @private
   */
  private updateToolsWithWorldInstances(): void {
    this.tools.forEach((tool) => {
      tool.setSocketBEInstances(this.currentWorld, this.currentAgent);
    });
  }

  /**
   * 向世界发送消息（忽略错误）
   * @private
   */
  private async sendWorldMessage(message: string): Promise<void> {
    try {
      await this.currentWorld?.sendMessage(message);
    } catch (messageError) {
      // 消息发送失败时忽略
    }
  }

  /**
   * 玩家加入时的处理
   * @private
   */
  private async handlePlayerJoin(ev: any): Promise<void> {
    if (process.stdin.isTTY !== false) {
      console.error(t(CORE_MESSAGES, "PLAYER_JOINED", ev.player.name));
    }

    this.connectedPlayer = {
      ws: null, // SocketBE 中不需要直接访问 ws
      name: ev.player.name || "unknown",
      id: uuidv4(),
    };

    this.currentWorld = ev.world;

    this.currentAgent = null;

    // 更新所有工具的 Socket-BE 实例
    this.updateToolsWithWorldInstances();
  }

  /**
   * 玩家退出时的处理
   * @private
   */
  private handlePlayerLeave(ev: any): void {
    if (process.stdin.isTTY !== false) {
      console.error(t(CORE_MESSAGES, "PLAYER_LEFT", ev.player.name));
    }

    this.connectedPlayer = null;
    this.currentWorld = null;
    this.currentAgent = null;

    // 清除所有工具的 Socket-BE 实例
    this.tools.forEach((tool) => {
      tool.setSocketBEInstances(null, null);
    });
  }

  /**
   * 初始化可用工具
   *
   * 注册 Level 1（基础操作）和 Level 2（复合操作）的工具，
   * 为每个工具注入命令执行函数。
   *
   * @internal
   */
  private initializeTools(): void {
    this.tools = [
      // Socket-BE 核心 API 工具（推荐 - 简洁且 AI 易用）
      new AgentTool(),
      new WorldTool(),
      new PlayerTool(),
      new BlocksTool(),
      new SystemTool(),
      new CameraTool(),
      new SequenceTool(),
      new MinecraftWikiTool(),

      // 高级建筑工具（高级建筑功能）
      new BuildCubeTool(), // ✅ 运行正常
      new BuildLineTool(), // ✅ 运行正常
      new BuildSphereTool(), // ✅ 运行正常
      new BuildCylinderTool(), // ✅ 已修复
      new BuildParaboloidTool(), // ✅ 基本可用
      new BuildHyperboloidTool(), // ✅ 基本可用
      new BuildRotateTool(), // ✅ 基本可用
      new BuildTransformTool(), // ✅ 基本可用
      new BuildTorusTool(), // ✅ 已修复
      new BuildHelixTool(), // ✅ 已修复
      new BuildEllipsoidTool(), // ✅ 已修复
      new BuildBezierTool(), // ✅ 新增（多控制点贝塞尔曲线）
    ];

    // 为所有工具设置命令执行函数和 Socket-BE 实例
    const commandExecutor = async (
      command: string
    ): Promise<ToolCallResult> => {
      return this.executeCommand(command);
    };

    this.tools.forEach((tool) => {
      tool.setCommandExecutor(commandExecutor);
      tool.setSocketBEInstances(this.currentWorld, this.currentAgent);
    });

    // 为 SequenceTool 设置工具注册表
    const sequenceTool = this.tools.find(
      (tool) => tool.name === "sequence"
    ) as SequenceTool;
    if (sequenceTool) {
      const toolRegistry = new Map<string, BaseTool>();
      this.tools.forEach((tool) => {
        toolRegistry.set(tool.name, tool);
      });
      sequenceTool.setToolRegistry(toolRegistry);
    }
  }

  /**
   * 在 MCP SDK 中注册基础工具
   */
  private registerBasicTools(): void {
    // send_message 工具
    this.mcpServer.registerTool(
      "send_message",
      {
        title: "Send Message",
        description:
          "Send a chat message to the connected Minecraft player. ALWAYS provide a message parameter. Use this to communicate with the player about build progress or instructions.",
        inputSchema: {
          message: z
            .string()
            .describe(
              "The text message to send to the player (REQUIRED - never call this without a message)"
            ),
        },
      },
      async ({ message }: { message: string }) => {
        const result = await this.sendMessage(message || "Hello from MCP server!");

        let responseText: string;
        if (result.success) {
          responseText = result.message || "Message sent successfully";
        } else {
          // 在错误消息中添加提示
          const errorMsg = result.message || "Failed to send message";
          responseText = `❌ ${enrichErrorWithHints(errorMsg)}`;
        }

        return {
          content: [
            {
              type: "text",
              text: responseText,
            },
          ],
        };
      }
    );

    // execute_command 工具
    this.mcpServer.registerTool(
      "execute_command",
      {
        title: "Execute Command",
        description: "Execute a Minecraft command",
        inputSchema: {
          command: z.string().describe("The Minecraft command to execute"),
        },
      },
      async ({ command }: { command: string }) => {
        const result = await this.executeCommand(command);

        // Token 优化：总结命令执行结果
        const optimized = optimizeCommandResult(result.data);

        let responseText: string;
        if (result.success) {
          responseText = `✅ ${optimized.summary}`;
          if (optimized.details) {
            responseText += `\n\n${JSON.stringify(optimized.details, null, 2)}`;
          }
        } else {
          // 在错误消息中添加提示
          const errorMsg = result.message || "Command execution failed";
          const enrichedError = enrichErrorWithHints(errorMsg);
          responseText = `❌ ${enrichedError}`;
        }

        // 检查响应大小
        const sizeWarning = checkResponseSize(responseText);
        if (sizeWarning) {
          responseText += `\n\n${sizeWarning}`;
        }

        return {
          content: [
            {
              type: "text",
              text: responseText,
            },
          ],
        };
      }
    );
  }

  /**
   * 在 MCP SDK 中注册模块化工具
   */
  private registerModularTools(): void {
    const schemaConverter = new SchemaToZodConverter();

    this.tools.forEach((tool) => {
      // 使用 SchemaToZodConverter 将 inputSchema 转换为 Zod 格式
      const zodSchema = schemaConverter.convert(tool.inputSchema);

      // 注册工具
      this.mcpServer.registerTool(
        tool.name,
        {
          title: tool.name,
          description: tool.description,
          inputSchema: zodSchema,
        },
        async (args: any) => {
          try {
            const result = await tool.execute(args);

            let responseText: string;

            if (result.success) {
              // 建筑工具结果优化
              if (tool.name.startsWith('build_')) {
                const optimized = optimizeBuildResult(result);
                responseText = `✅ ${optimized.message}`;
                if (optimized.summary) {
                  responseText += `\n\n📊 Summary:\n${JSON.stringify(optimized.summary, null, 2)}`;
                }
              } else {
                // 通用工具结果
                responseText = result.message || `Tool ${tool.name} executed successfully`;
                if (result.data) {
                  // 检查数据大小
                  const dataStr = JSON.stringify(result.data, null, 2);
                  const sizeWarning = checkResponseSize(dataStr);

                  if (sizeWarning) {
                    // 数据过大时仅显示类型
                    responseText += `\n\n${sizeWarning}`;
                    responseText += `\nData type: ${Array.isArray(result.data) ? `Array[${result.data.length}]` : typeof result.data}`;
                  } else {
                    responseText += `\n\nData: ${dataStr}`;
                  }
                }
              }
            } else {
              // 在错误消息中添加提示
              const errorMsg = result.message || "Tool execution failed";
              const enrichedError = enrichErrorWithHints(errorMsg);
              responseText = `❌ ${enrichedError}`;
              if (result.data) {
                responseText += `\n\nDetails:\n${JSON.stringify(result.data, null, 2)}`;
              }
            }

            return {
              content: [
                {
                  type: "text",
                  text: responseText,
                },
              ],
            };
          } catch (error) {
            const errorMsg =
              error instanceof Error ? error.message : String(error);
            const errorStack = error instanceof Error ? error.stack : undefined;

            const exceptionMessage = `Tool execution failed with exception: ${errorMsg}${errorStack ? `\n\nStack trace:\n${errorStack}` : ""}`;

            return {
              content: [
                {
                  type: "text",
                  text: `❌ ${exceptionMessage}`,
                },
              ],
            };
          }
        }
      );
    });
  }

  private lastCommandResponse: any = null;

  /**
   * 向连接的 Minecraft 玩家发送消息
   *
   * @param text - 要发送的消息文本
   * @returns 发送结果
   *
   * @example
   * ```typescript
   * const result = server.sendMessage("Hello, Minecraft!");
   * if (result.success) {
   *   console.log("消息发送成功");
   * }
   * ```
   */
  public async sendMessage(text: string): Promise<ToolCallResult> {
    if (!this.currentWorld) {
      if (process.stdin.isTTY !== false) {
        console.error(t(CORE_MESSAGES, "PLAYER_NOT_CONNECTED"));
      }
      return { success: false, message: "No player connected" };
    }

    try {
      if (process.stdin.isTTY !== false) {
        console.error(t(CORE_MESSAGES, "SENDING_MESSAGE", text));
      }

      await this.currentWorld.sendMessage(text);
      return { success: true, message: "Message sent successfully" };
    } catch (error) {
      if (process.stdin.isTTY !== false) {
        console.error(t(CORE_MESSAGES, "MESSAGE_SEND_ERROR"), error);
      }
      return { success: false, message: `Failed to send message: ${error}` };
    }
  }

  /**
   * 执行 Minecraft 命令
   *
   * @param command - 要执行的 Minecraft 命令（无需 "/" 前缀）
   * @returns 命令执行结果
   *
   * @example
   * ```typescript
   * // 传送玩家
   * server.executeCommand("tp @p 100 64 200");
   *
   * // 放置方块
   * server.executeCommand("setblock 0 64 0 minecraft:stone");
   * ```
   */
  public async executeCommand(command: string): Promise<ToolCallResult> {
    if (!this.currentWorld) {
      return { success: false, message: "No player connected" };
    }

    try {
      const result = await this.currentWorld.runCommand(command);

      // 将响应保存到 lastCommandResponse（用于获取位置信息等）
      this.lastCommandResponse = result;

      return {
        success: true,
        message: "Command executed successfully",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Command execution failed: ${error}`,
      };
    }
  }

  /**
   * 获取最新的命令响应（例如位置信息）
   */
  public getLastCommandResponse(): any {
    return this.lastCommandResponse;
  }
}

// 启动服务器
const server = new MinecraftMCPServer();

// 从命令行参数获取端口号
const getPort = (): number => {
  // 从命令行参数获取 (--port=8002)
  const portArg = process.argv.find((arg) => arg.startsWith("--port="));
  if (portArg) {
    const port = parseInt(portArg.split("=")[1]);
    if (!isNaN(port) && port > 0 && port <= 65535) {
      return port;
    }
  }

  // 默认值
  return 8001;
};

// 从命令行参数获取语言设置
const getLocale = (): SupportedLocale | undefined => {
  // 从命令行参数获取 (--lang=ja, --lang=en 或 --lang=zh)
  const langArg = process.argv.find((arg) => arg.startsWith("--lang="));
  if (langArg) {
    const lang = langArg.split("=")[1];
    if (lang === "ja" || lang === "en" || lang === "zh") {
      return lang as SupportedLocale;
    }
  }

  // 默认自动检测 (undefined)
  return undefined;
};

const getDisableEncryption = (): boolean => {
  return process.argv.includes("--disable-encryption");
};

const getDebugWs = (): boolean => {
  return process.argv.includes("--debug-ws");
};

const getCommandVersion = (): number | undefined => {
  const arg = process.argv.find((value) => value.startsWith("--command-version="));
  if (!arg) return undefined;

  const value = Number(arg.split("=")[1]);
  if (!Number.isInteger(value) || value < 1 || value > 42) {
    throw new Error("Invalid --command-version. Use an integer between 1 and 42.");
  }

  return value;
};

const getDisablePlayerListPoll = (): boolean => {
  return process.argv.includes("--no-player-list-poll");
};

const getMinecraftVersion = (): string | undefined => {
  const arg = process.argv.find((value) => value.startsWith("--minecraft-version="));
  if (!arg) return undefined;

  const value = arg.split("=")[1]?.trim();
  if (!value) {
    throw new Error("Invalid --minecraft-version. Use a non-empty version string like 1.26.10.");
  }

  return value;
};

const port = getPort();
const locale = getLocale();
const disableEncryption = getDisableEncryption();
const debugWs = getDebugWs();
const commandVersion = getCommandVersion();
const disablePlayerListPoll = getDisablePlayerListPoll();
const minecraftVersion = getMinecraftVersion();
server.start(port, locale, disableEncryption, debugWs, commandVersion, disablePlayerListPoll, minecraftVersion);

process.on("SIGINT", () => {
  process.exit(0);
});
