// LiteLoaderBDS / LeviLamina QuickJS Plugin
// 插件名称: MCP Command Block Bridge
// 作用: 为 MCP 提供一个 /mcpsetcmd 命令，允许直接写入命令方块的 NBT (Command 字段)
// 绕过了原版 Bedrock Edition 无法通过命令设置 block entity NBT 的限制。

ll.registerPlugin(
    "MCPCmdBlockBridge",
    "Bridge for MCP to set command block NBT",
    [1, 0, 0],
    {"Author": "MCP"}
);

// 注册控制台命令（由 WebSocket/SocketBE 在后台执行）
mc.regConsoleCmd("mcpsetcmd", "设置命令方块内的命令 (MCP 专用)", function(args) {
    // 预期参数: mcpsetcmd <x> <y> <z> <dimid> <command string...>
    if (args.length < 5) {
        log("[MCP Bridge] 用法: mcpsetcmd <x> <y> <z> <dimid> <command...>");
        return false;
    }

    let x = parseInt(args[0]);
    let y = parseInt(args[1]);
    let z = parseInt(args[2]);
    let dimid = parseInt(args[3]);
    let cmdStr = args.slice(4).join(" ");

    let blk = mc.getBlock(x, y, z, dimid);
    if (!blk) {
        log(`[MCP Bridge] 无法在 ${x} ${y} ${z} 获取方块。`);
        return false;
    }

    if (!blk.name.includes("command_block")) {
        log(`[MCP Bridge] 目标坐标的方块不是命令方块，而是: ${blk.name}`);
        return false;
    }

    let be = blk.getBlockEntity();
    if (!be) {
        log(`[MCP Bridge] 无法获取方块实体。可能它尚未加载或不支持实体。`);
        return false;
    }

    let nbt = be.getNbt();
    if (!nbt) {
        log(`[MCP Bridge] 无法获取 NBT 数据。`);
        return false;
    }

    // 修改 Command 字段
    nbt.setString("Command", cmdStr);
    
    // 尝试写回
    if (be.setNbt(nbt)) {
        log(`[MCP Bridge] 成功更新命令方块 (${x} ${y} ${z}) 的命令为: ${cmdStr}`);
        return true;
    } else {
        log(`[MCP Bridge] 设置 NBT 失败。`);
        return false;
    }
});

log("[MCP Bridge] 插件已加载！可以使用 /mcpsetcmd 命令修改命令方块的NBT了。");
