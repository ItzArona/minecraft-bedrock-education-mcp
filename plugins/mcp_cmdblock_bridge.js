// LeviLamina / LegacyScriptEngine QuickJS 插件
// 作用：为 MCP 提供真命令 mcpsetcmd，用于直接写入命令方块的 Command NBT 字段。

ll.registerPlugin(
    "MCPCmdBlockBridge",
    "Bridge for MCP to set command block NBT",
    [1, 0, 0],
    { "Author": "MCP" }
);

function setCommandBlockCommand(x, y, z, dimid, command, output) {
    const block = mc.getBlock(x, y, z, dimid);
    if (!block) {
        return output.error(`[MCP Bridge] 无法在 ${x} ${y} ${z} 维度 ${dimid} 获取方块。`);
    }

    if (!block.type || !block.type.includes("command_block")) {
        return output.error(`[MCP Bridge] 目标方块不是命令方块: ${block.type}`);
    }

    const blockEntity = block.getBlockEntity();
    if (!blockEntity) {
        return output.error("[MCP Bridge] 无法获取命令方块实体。请确认区块已加载。");
    }

    const nbt = blockEntity.getNbt();
    if (!nbt) {
        return output.error("[MCP Bridge] 无法读取命令方块 NBT。");
    }

    nbt.setString("Command", command);

    if (!blockEntity.setNbt(nbt)) {
        return output.error("[MCP Bridge] 写回命令方块 NBT 失败。");
    }

    return output.success(`[MCP Bridge] 已更新命令方块 (${x}, ${y}, ${z}, dim ${dimid}) 的命令。`);
}

mc.listen("onServerStarted", () => {
    const cmd = mc.newCommand(
        "mcpsetcmd",
        "设置命令方块内的命令（MCP 专用）",
        PermType.GameMasters
    );

    cmd.mandatory("x", ParamType.Int);
    cmd.mandatory("y", ParamType.Int);
    cmd.mandatory("z", ParamType.Int);
    cmd.mandatory("dimid", ParamType.Int);
    cmd.mandatory("command", ParamType.RawText);
    cmd.overload(["x", "y", "z", "dimid", "command"]);
    cmd.setCallback((_cmd, _origin, output, result) => {
        return setCommandBlockCommand(
            result.x,
            result.y,
            result.z,
            result.dimid,
            result.command,
            output
        );
    });
    cmd.setup();
});

log("[MCP Bridge] 插件已加载，可使用 mcpsetcmd 修改命令方块 NBT。");
