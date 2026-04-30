// LeviLamina / LegacyScriptEngine QuickJS 插件
// 作用：为 MCP 提供真命令 mcpsetcmd / mcpsetcmd64，用于直接写入命令方块的 Command NBT 字段。

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

const BASE64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function utf8BytesToString(bytes) {
    let result = "";
    let index = 0;

    while (index < bytes.length) {
        const byte1 = bytes[index++];

        if (byte1 < 0x80) {
            result += String.fromCharCode(byte1);
            continue;
        }

        if ((byte1 & 0xe0) === 0xc0) {
            const byte2 = bytes[index++];
            result += String.fromCharCode(((byte1 & 0x1f) << 6) | (byte2 & 0x3f));
            continue;
        }

        if ((byte1 & 0xf0) === 0xe0) {
            const byte2 = bytes[index++];
            const byte3 = bytes[index++];
            result += String.fromCharCode(
                ((byte1 & 0x0f) << 12) |
                ((byte2 & 0x3f) << 6) |
                (byte3 & 0x3f)
            );
            continue;
        }

        if ((byte1 & 0xf8) === 0xf0) {
            const byte2 = bytes[index++];
            const byte3 = bytes[index++];
            const byte4 = bytes[index++];
            let codePoint =
                ((byte1 & 0x07) << 18) |
                ((byte2 & 0x3f) << 12) |
                ((byte3 & 0x3f) << 6) |
                (byte4 & 0x3f);

            codePoint -= 0x10000;
            result += String.fromCharCode(
                0xd800 + ((codePoint >> 10) & 0x3ff),
                0xdc00 + (codePoint & 0x3ff)
            );
            continue;
        }

        throw new Error("无效的 UTF-8 数据。");
    }

    return result;
}

function decodeBase64Url(base64url) {
    const normalized = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    const bytes = [];
    let buffer = 0;
    let bits = 0;

    for (let i = 0; i < padded.length; i++) {
        const char = padded[i];
        if (char === "=") {
            break;
        }

        const value = BASE64_ALPHABET.indexOf(char);
        if (value === -1) {
            throw new Error("无效的 Base64URL 字符串。");
        }

        buffer = (buffer << 6) | value;
        bits += 6;

        if (bits >= 8) {
            bits -= 8;
            bytes.push((buffer >> bits) & 0xff);
        }
    }

    return utf8BytesToString(bytes);
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

    const cmd64 = mc.newCommand(
        "mcpsetcmd64",
        "通过 Base64 设置命令方块内的命令（MCP 专用）",
        PermType.GameMasters
    );

    cmd64.mandatory("x", ParamType.Int);
    cmd64.mandatory("y", ParamType.Int);
    cmd64.mandatory("z", ParamType.Int);
    cmd64.mandatory("dimid", ParamType.Int);
    cmd64.mandatory("base64", ParamType.String);
    cmd64.overload(["x", "y", "z", "dimid", "base64"]);
    cmd64.setCallback((_cmd, _origin, output, result) => {
        try {
            const command = decodeBase64Url(result.base64);
            return setCommandBlockCommand(
                result.x,
                result.y,
                result.z,
                result.dimid,
                command,
                output
            );
        } catch (error) {
            return output.error(`[MCP Bridge] Base64 解码失败: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    cmd64.setup();
});

log("[MCP Bridge] 插件已加载，可使用 mcpsetcmd / mcpsetcmd64 修改命令方块 NBT。");
