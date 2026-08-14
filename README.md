# MindMap MT

一个围绕 `.mt` 思维导图格式的轻量级开源项目，由三部分组成：

| 组成部分 | 位置 | 说明 |
| --- | --- | --- |
| 在线单文件版 | [`mindmap.html`](./mindmap.html) | 单个 HTML 文件，双击即可在浏览器中使用，零依赖、可离线 |
| VS Code 插件 | [`extensions/mindmap-mt/`](./extensions/mindmap-mt/) | `.mt` 文件的图形化编辑器，支持自动保存 |
| LLM 技能 | [`skills/mindmap-format/`](./skills/mindmap-format/) | 供 LLM 理解 `.mt` 格式的指令说明，让 AI 能生成符合规范的内容 |

## .mt 思维导图格式

`.mt` 是纯文本格式的思维导图文件：

- 文件扩展名为 `.mt`
- 每个节点占一行
- 缩进表示层级，每级缩进 4 个空格
- 多行内容用反引号 `` ` `` 包裹，内容中的反引号需用 `\`` 转义

```mt
根节点
    节点1
    节点2
        子节点2.1
        子节点2.2
```

完整的格式规范见 [`skills/mindmap-format/SKILL.md`](./skills/mindmap-format/SKILL.md)。

## 在线单文件版

`mindmap.html` 是一个独立的 HTML 文件，包含完整的思维导图编辑功能：

- 直接下载并在浏览器中打开即可使用，无需安装任何环境
- 支持编辑、保存、导入导出 `.mt` 文件
- 图形化渲染基于 PixiJS，全部内嵌在单文件中

## VS Code 插件

`extensions/mindmap-mt/` 是一个 VS Code 扩展，提供 `.mt` 文件的图形化编辑体验：

- 在资源管理器中双击 `.mt` 文件默认以图形化编辑器打开
- 支持自动保存，编辑内容实时写回磁盘
- 内置 webview 渲染（复用在线版的核心逻辑）
- 支持"用 MT 编辑器打开 / 以文本方式打开"切换

### 开发与打包

```bash
cd extensions/mindmap-mt
npm i -g @vscode/vsce        # 安装打包工具（如未安装）
npx @vscode/vsce package     # 打包生成 .vsix 文件
```

在 VS Code 中打开 `extensions/mindmap-mt` 目录，按 `F5` 即可启动插件开发调试。

## LLM 技能

`skills/mindmap-format/` 是一个 Agent 技能（Skill），告诉 LLM 如何书写 `.mt` 思维导图格式，配合插件使用：

- 让 LLM 生成、修改、格式化 `.mt` 文件时输出符合规范的文本
- 与 Markdown、MindNode 等格式互转时保证层级与转义正确
- 遵循 Agent Skills 规范，可被支持 Skills 的工具直接加载
