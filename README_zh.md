# Minecraft Bedrock MCP Server

[English README here](README.md) | [日本語版 README はこちら](README_ja.md)

一个基于 TypeScript 的 MCP 服务器，用于控制 Minecraft 基岩版 (Bedrock Edition) 和 教育版 (Education Edition)。

<a href="https://glama.ai/mcp/servers/@Mming-Lab/minecraft-bedrock-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@Mming-Lab/minecraft-bedrock-mcp-server/badge" alt="Minecraft Bedrock Education MCP server" />
</a>

## 功能特性

- **核心工具**：玩家、代理 (Agent)、方块、世界、摄像机、系统控制
- **高级建筑**：12 种三维几何形状工具（立方体、球体、螺旋、环面、贝塞尔曲线等）
- **Wiki 集成**：搜索 Minecraft Wiki 获取准确信息
- **序列系统**：自动链式执行多个操作
- **自然语言**：通过自然语言控制 Minecraft

## 快速开始

### 1. 安装

```bash
git clone https://github.com/ItzArona/minecraft-bedrock-education-mcp.git
cd minecraft-bedrock-education-mcp
npm install
npm run build
npm start
```

### 2. Minecraft 连接

在 Minecraft 中打开一个世界（需启用作弊），然后在聊天栏输入：
```
/connect "localhost:8001/ws"
```

如果 Minecraft 立即提示连接已关闭，请使用 `node dist/server.js --debug-ws` 重新启动 MCP 服务器后再尝试同一条命令。调试日志会显示 Minecraft 是否真正连到了 WebSocket 服务以及关闭码。也可以测试 `node dist/server.js --disable-encryption --debug-ws`；禁用加密只建议在可信本机或局域网环境中使用。

对于较旧或较新的 Bedrock 客户端，请优先测试 `node dist/server.js --disable-encryption --debug-ws --minecraft-version=1.26.10`。如仍有问题，再尝试 `--command-version=35`、`--command-version=34`、`--command-version=36` 或 `--command-version=42`。

为了把连接问题和 Socket-BE 的自动玩家列表轮询隔离开，也可以使用 `node dist/server.js --disable-encryption --debug-ws --no-player-list-poll` 启动服务端。

### 3. AI 助手设置

将以下配置添加到您的 MCP 客户端配置中（例如 Claude Desktop）：

```json
{
  "mcpServers": {
    "minecraft-bedrock": {
      "command": "node",
      "args": ["C:/项目路径/minecraft-bedrock-education-mcp/dist/server.js"]
    }
  }
}
```

**Claude Desktop 配置路径**：`%APPDATA%\Claude\claude_desktop_config.json` (Windows)
其他 MCP 客户端请参考其相应文档。

## 可用工具

### 核心工具
- `player` - 玩家管理（位置、物品、能力）
- `agent` - 代理控制（移动、旋转、库存）
- `blocks` - 方块操作（放置、移除、填充）
- `world` - 世界控制（时间、天气、游戏规则）
- `camera` - 摄像机控制（视角、淡入淡出、电影级摄像机）
- `system` - 计分板和 UI 显示
- `minecraft_wiki` - Wiki 搜索
- `sequence` - 多工具链式执行

### LeviLamina 命令方块桥接插件

仓库内的 `plugins/mcp_cmdblock_bridge/` 是可选的 LeviLamina / LegacyScriptEngine QuickJS 插件，用于让 MCP 写入命令方块的 `Command` NBT 字段。原版 Bedrock 命令无法直接写入命令方块内部指令，启用该插件后可以使用 `blocks` 工具的 `set_command_block` 动作。

使用方式：将 `plugins/mcp_cmdblock_bridge/` 文件夹安装到你的 LeviLamina / LegacyScriptEngine 插件加载目录后重启服务器。MCP 侧仍然只需要连接 WebSocket，调用 `blocks` 时使用 `action: "set_command_block"`、`x/y/z`、`command`，可选 `dimid`（`0` 主世界，`1` 下界，`2` 末地）。现在 `command` 会通过 Base64URL 桥接无损传输，空格、引号、反斜杠、选择器和 JSON 文本都不需要手工转义。

### 建筑工具 (12 种)
- `build_cube` - 立方体（空心/实心）
- `build_sphere` - 球体
- `build_cylinder` - 圆柱体
- `build_line` - 线段
- `build_torus` - 环面（甜甜圈）
- `build_helix` - 螺旋（弹簧）
- `build_ellipsoid` - 椭球体
- `build_paraboloid` - 抛物面
- `build_hyperboloid` - 双曲面
- `build_bezier` - 贝塞尔曲线
- `build_rotate` - 旋转变换
- `build_transform` - 坐标变换

## 使用示例

### 基础用法

直接以自然语言与 AI 助手对话：

```
告诉我当前的坐标
→ 获取玩家位置

在我面前放一个钻石块
→ 放置方块

建造一个半径为 10 的玻璃穹顶
→ 球体建筑（空心）

用石砖建一个螺旋楼梯
→ 螺旋建筑

附近有多少村民？
→ 实体搜索
```

### 复杂建筑

```
我想建一座城堡
→ AI 会自动组合多个工具进行建造

使用贝塞尔曲线创建一个平滑的桥
→ 使用贝塞尔工具生成自然弯曲的桥梁

把时间设为夜晚并开始下雨
→ 世界控制（时间与天气）
```

### 自动错误纠正

```
用户: "放置一个 daimond_block"
系统: ❌ 未知方块: minecraft:daimond_block
        💡 使用 minecraft_wiki 工具搜索正确的方块 ID

AI: 让我搜索一下 Wiki 以获取正确的 ID...
    → 自动搜索并纠正为 "diamond_block"
```

## 技术规格

- **Token 优化**：自动数据压缩（削减 98% 以上）
- **错误自动纠正**：AI 自动检测并修复错误
- **多语言**：支持中文/日语/英语

## 运行要求

- **Node.js** 16 或更高版本
- **Minecraft 基岩版 (Bedrock Edition)** 或 **教育版 (Education Edition)**
- 开启了**作弊功能**的世界
- **MCP 客户端** (如 Claude Desktop)

## 开源协议

GPL-3.0

## 致谢

- [SocketBE](https://github.com/tutinoko2048/SocketBE) - Minecraft 基岩版 WebSocket 集成库
- [Model Context Protocol](https://modelcontextprotocol.io) - AI 集成协议规范
- [Anthropic](https://www.anthropic.com) - Claude AI 和 MCP TypeScript SDK

## 相关链接

- [MCP 官方规范](https://modelcontextprotocol.io)
- [Socket-BE GitHub](https://github.com/tutinoko2048/SocketBE)
- [Minecraft Wiki](https://minecraft.wiki)
- [Glama MCP 服务器列表](https://glama.ai/mcp/servers)
