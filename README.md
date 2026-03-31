# Skill Installer

从 Git 仓库安装 Agent Skills 的命令行工具。

## 功能特性

- 📦 从 Git 仓库安装技能（GitHub、GitLab 等）
- 🎯 支持多种 Agent（OpenClaw、Claude Code、Codex、Cursor、OpenCode 等）
- 🔗 Symlink 模式（推荐）或 Copy 模式
- 🌍 支持全局和项目级安装
- 🎨 交互式 CLI 界面
- ⚡ 快速浅克隆
- 🔒 路径遍历防护
- 📋 列出仓库中的可用技能
- ⚙️ 支持自定义 Agent 配置

## 安装方式

### 方法一：克隆仓库使用（推荐）

```bash
# 克隆仓库
git clone https://github.com/fakeAccount-lab/skill-installer.git
cd skill-installer

# 安装依赖
npm install

# 构建项目
npm run build

# 使用工具
node dist/cli.js --help
```

### 方法二：创建全局命令（可选）

#### Linux / macOS

```bash
# 克隆仓库
git clone https://github.com/fakeAccount-lab/skill-installer.git
cd skill-installer

# 安装依赖并构建
npm install && npm run build

# 方法 A：使用 npm link（推荐，最简单）
npm link

# 然后可以直接使用
skill-installer --help

# 方法 B：创建符号链接
sudo ln -s $(pwd)/bin/skill-installer.js /usr/local/bin/skill-installer
```

#### Windows

**方法 A：使用 npm link（推荐，最简单）**

```powershell
# 克隆仓库
git clone https://github.com/fakeAccount-lab/skill-installer.git
cd skill-installer

# 安装依赖并构建
npm install && npm run build

# 创建全局链接
npm link

# 然后可以直接使用
skill-installer --help
```

**卸载**：
```powershell
npm unlink -g skill-installer
```

**方法 B：使用批处理文件**

```powershell
# 克隆仓库
git clone https://github.com/fakeAccount-lab/skill-installer.git
cd skill-installer

# 安装依赖并构建
npm install && npm run build

# 项目根目录已经有一个 skill-installer.bat 文件
# 将该文件复制到 PATH 中的任意目录，例如：
# C:\Users\YourName\AppData\Local\Microsoft\WindowsApps

# 或者，创建一个新的目录并添加到 PATH：
# 1. 创建目录：C:\Users\YourName\bin
# 2. 复制文件：copy skill-installer.bat C:\Users\YourName\bin\
# 3. 将 C:\Users\YourName\bin 添加到 PATH 环境变量

# 添加 PATH 后，重启终端，然后可以直接使用
skill-installer --help
```

**添加 PATH 的步骤：**

1. 右键点击"此电脑" → "属性"
2. 点击"高级系统设置"
3. 点击"环境变量"
4. 在"用户变量"或"系统变量"中找到 `Path`，点击"编辑"
5. 点击"新建"，添加你的路径
6. 点击"确定"保存
7. **重启终端**或**重新登录**以使更改生效

**方法 C：使用 PowerShell 别名**

在 PowerShell 配置文件中添加别名：

```powershell
# 编辑 PowerShell 配置文件
notepad $PROFILE

# 添加以下行（替换为你的实际路径）
function skill-installer {
    node C:\Users\YourName\skill-installer\dist\cli.js $args
}

# 保存文件并重启 PowerShell
```

## 使用方法

### 重要提示

**默认使用方式**：所有示例命令都假设你在项目根目录下运行。

如果你已经在项目根目录（包含 `dist/`、`bin/` 等目录的目录），使用：

```bash
node dist/cli.js <command>
```

如果你已经配置了全局命令（见下文"创建全局命令"），则可以直接使用：

```bash
skill-installer <command>
```

### 查看帮助

```bash
# 在项目根目录下运行
node dist/cli.js help

# 或（如果配置了全局命令）
skill-installer help
```

### 列出仓库中的可用技能

```bash
# 使用 GitHub 简写格式
node dist/cli.js list fakeAccount-lab/skills-hub

# 使用完整 URL
node dist/cli.js list https://github.com/fakeAccount-lab/skills-hub.git

# 使用本地路径
node dist/cli.js list /path/to/local/repo
```

### 安装技能

```bash
# 安装到指定 Agent
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill weather --yes

# 全局安装
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill weather --global --yes

# 安装多个技能
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill weather --skill git-helper --yes

# 安装到多个 Agent（建议使用完整 URL）
node dist/cli.js add https://github.com/fakeAccount-lab/skills-hub.git --agent openclaw --agent claude-code --skill weather --yes

# 使用 Copy 模式（而非 Symlink）
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill code-review --mode copy --yes

# 克隆指定分支
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --branch main --skill weather --yes
```

### 查看已安装的技能

```bash
# 查看项目级安装的技能
node dist/cli.js installed --agent openclaw

# 查看全局安装的技能
node dist/cli.js installed --agent openclaw --global
```

## 支持的 Agent

| Agent | 名称 | 项目级路径 | 全局路径 |
|-------|------|-----------|---------|
| OpenClaw | `openclaw` | `./skills/` | `~/.openclaw/skills/` |
| Claude Code | `claude-code` | `./.claude/skills/` | `~/.claude/skills/` |
| Codex | `codex` | `./.codex/skills/` | `~/.codex/skills/` |
| Cursor | `cursor` | `./.cursor/skills/` | `~/.cursor/skills/` |
| OpenCode | `opencode` | `./.agents/skills/` | `~/.config/opencode/skills/` |

## 安装模式

### Symlink 模式（推荐）

- 技能复制到规范位置：`.agents/skills/<skill-name>/`
- 从 Agent 目录创建指向规范位置的符号链接
- 优点：单一数据源、易于更新、节省磁盘空间
- Symlink 失败时自动降级到 Copy 模式

### Copy 模式

- 直接将技能复制到每个 Agent 目录
- 优点：独立副本，适用于不支持 symlink 的系统
- 缺点：占用更多磁盘空间，需要分别更新每个副本

## 配置方式

通过配置文件自定义 Agent 和设置：

```bash
# 配置文件位置
~/.config/skill-installer/config.json
```

配置示例：

```json
{
  "defaultInstallMode": "symlink",
  "defaultAgent": "openclaw",
  "agents": {
    "my-custom-agent": {
      "name": "my-custom-agent",
      "displayName": "我的自定义 Agent",
      "skillsDir": ".my-agent/skills",
      "globalSkillsDir": "~/.my-agent/skills"
    }
  }
}
```

## 仓库 URL 格式

工具支持多种 Git 仓库 URL 格式：

- GitHub 简写：`owner/repo`
- 完整 HTTPS URL：`https://github.com/owner/repo`
- SSH URL：`git@github.com:owner/repo.git`
- 带分支：`owner/repo#branch`
- 本地路径：`./local-repo`

## Skill 格式

技能必须包含 `SKILL.md` 文件，并带有 YAML frontmatter：

```markdown
---
name: my-skill
description: 这个技能的作用和使用场景
---

## 步骤

1. 首先这样做
2. 然后那样做
```

必填字段：
- `name`：唯一标识符（小写，允许连字符）
- `description`：技能功能的简要说明

可选字段：
- `metadata.internal: true` - 标记为内部技能（默认隐藏）

## 技能发现机制

### 优先级

工具按照以下优先级发现技能：

1. **`.skills-hub/index.json`**（推荐，最高优先级）
2. 标准目录扫描
3. 递归搜索（兜底方案）

### 方式 1：使用 `.skills-hub/index.json`（推荐）

在仓库中创建 `.skills-hub/index.json` 配置文件，显式声明技能信息：

```json
{
  "version": "1.0",
  "skills": [
    {
      "name": "weather",
      "description": "Get current weather and forecasts",
      "path": "skills/weather"
    },
    {
      "name": "git-helper",
      "description": "Common Git operations",
      "path": "tools/git-helper"
    }
  ]
}
```

**优点**：
- 稳定可靠，不依赖目录结构
- 技能可以放在任意位置
- 无需遍历整个目录树
- 开发者完全控制技能列表

**详细文档**：参见 [SKILL_HUB_CONFIG.md](SKILL_HUB_CONFIG.md)

### 方式 2：标准目录扫描

如果不存在配置文件，工具会扫描以下标准目录（按优先级排序）：

- 根目录 (`/`)
- `skills/`
- `skills/.curated/`
- `skills/.experimental/`
- `skills/.system/`
- `.agents/skills/`
- `.agent/skills/`
- `.claude/skills/`
- `.codex/skills/`
- `.cursor/skills/`
- 其他标准目录...

### 方式 3：递归搜索（兜底方案）

如果标准目录中没有找到技能，工具会：

- 从仓库根目录开始递归遍历
- 查找所有包含 `SKILL.md` 的目录
- 最多搜索 5 层深度
- 跳过：`.git`、`node_modules`、`dist` 等目录
- 跳过隐藏文件和目录

## Skill 发现机制

工具会按以下顺序查找技能：

### 1. 标准目录扫描

首先会在以下标准目录中搜索（按优先级排序）：

- 根目录 (`/`)
- `skills/`
- `skills/.curated/`
- `skills/.experimental/`
- `skills/.system/`
- `.agents/skills/`
- `.agent/skills/`
- `.claude/skills/`
- `.codex/skills/`
- `.cursor/skills/`
- `.cline/skills/`
- `.codebuddy/skills/`
- `.continue/skills/`
- `.crush/skills/`
- `.factory/skills/`
- `.gemini/skills/`
- `.github/skills/`
- `.goose/skills/`
- `.kilocode/skills/`
- `.kiro/skills/`
- `.mcpjam/skills/`
- `.mux/skills/`
- `.openhands/skills/`
- `.opencode/skills/`
- `.pi/skills/`
- `.qoder/skills/`
- `.qwen/skills/`
- `.roo/skills/`
- `.trae/skills/`
- `.windsurf/skills/`
- `.zencoder/skills/`

### 2. 递归搜索（兜底方案）

**如果标准目录中没有找到任何技能，工具会进行递归搜索**：

- 从仓库根目录开始
- 递归遍历所有子目录（最多 5 层深度）
- 在每个目录中查找 `SKILL.md` 文件
- 跳过以下目录：`.git`、`__pycache__`、`__pypackages__`、`node_modules`、`dist`
- 跳过以 `.` 开头的文件和目录

### 3. 去重

如果找到多个同名技能，只保留第一个发现的。

---

## 技能存放结构建议

### ✅ 推荐结构（标准目录）

**方案 A：集中式管理（推荐）**

```
my-skills-repo/
├── skills/                    # 技能集中目录
│   ├── weather/              # 天气技能
│   │   └── SKILL.md
│   ├── git-helper/           # Git 帮助技能
│   │   └── SKILL.md
│   └── code-review/          # 代码审查技能
│       └── SKILL.md
├── README.md
└── package.json
```

**优点**：
- 结构清晰，易于管理
- 查找速度快（直接在标准目录中找到）
- 符合大多数项目的惯例

---

**方案 B：分类管理（适合大量技能）**

```
my-skills-repo/
├── skills/
│   ├── .curated/             # 精选技能
│   │   ├── weather/
│   │   └── git-helper/
│   ├── .experimental/        # 实验性技能
│   │   └── new-feature/
│   └── .system/              # 系统技能
│       └── internal-tool/
├── README.md
└── package.json
```

**优点**：
- 可以按状态分类管理
- 支持版本控制（experimental vs stable）
- 便于团队协作

---

**方案 C：混合式管理（推荐）**

```
my-skills-repo/
├── skills/                   # 主要技能目录
│   ├── weather/
│   │   └── SKILL.md
│   └── git-helper/
│       └── SKILL.md
├── .github/skills/           # GitHub Actions 相关技能
│   └── pr-checker/
│       └── SKILL.md
├── docs/skills/              # 文档生成相关技能
│   └── markdown-helper/
│       └── SKILL.md
├── README.md
└── package.json
```

**优点**：
- 灵活性高
- 可以按功能分组
- 仍能在标准目录中快速找到

---

### ⚠️ 不推荐结构

**散布式管理（虽然支持，但不推荐）**

```
my-skills-repo/
├── src/                      # 源代码
├── utils/                    # 工具函数
├── weather/                  # ❌ 技能散布在各处
│   └── SKILL.md
├── git-helper/               # ❌ 难以维护
│   └── SKILL.md
├── tests/                    # 测试
└── code-review/              # ❌ 混杂在项目中
    └── SKILL.md
```

**缺点**：
- 技能散布在各处，难以管理
- 需要递归搜索（性能较低）
- 容易与项目其他文件混淆
- 维护成本高

---

### 🎯 最佳实践建议

1. **使用 `skills/` 作为主目录**
   - 这是最常见的标准目录
   - 会被优先扫描

2. **按功能或状态分类**
   - 使用 `.curated`、`.experimental`、`.system` 子目录
   - 便于管理和版本控制

3. **避免在根目录散布技能**
   - 虽然工具支持递归搜索，但会影响性能
   - 不利于项目维护

4. **使用有意义的技能名称**
   - 目录名应该反映技能的功能
   - 例如：`weather/`、`git-helper/`、`code-review/`

5. **保持技能独立性**
   - 每个技能应该是一个独立的目录
   - 包含自己的 `SKILL.md` 和相关文件
   - 避免技能之间共享依赖

---

## 常见问题

### Q: 我的技能散布在代码仓各处，工具能检测到吗？

A: **能！** 工具会进行递归搜索（最多 5 层深度），能够找到散布在各处的技能。但为了更好的性能和可维护性，建议使用标准目录结构。

### Q: 递归搜索会影响性能吗？

A: 会。递归搜索需要遍历整个目录树，而标准目录扫描是直接查找。对于大型仓库，建议使用标准目录结构。

### Q: 递归搜索的深度限制可以调整吗？

A: 目前硬编码为 5 层深度。如果需要调整，可以修改 `src/skills.ts` 中的 `maxDepth` 参数。

### Q: 工具会检测到隐藏目录中的技能吗？

A: 不会。默认跳过以 `.` 开头的目录（除了标准目录列表中的那些）。如果需要在隐藏目录中存放技能，请使用标准目录（如 `.agents/skills/`）。

## 冲突解决

当安装同名技能但来源不同时，工具会：

1. 检测到冲突
2. 显示交互式提示，包含以下信息：
   - 技能名称和描述
   - 源仓库
   - 安装状态
3. 让你选择要安装哪一个

## 开发说明

```bash
# 安装依赖
npm install

# 构建
npm run build

# 开发模式运行
npm run dev

# 格式化代码
npm run format

# 类型检查
npm tsc --noEmit
```

## 命令参考

| 命令 | 说明 | 示例 |
|------|------|------|
| `add <repo>` | 从仓库安装技能 | `add fakeAccount-lab/skills-hub` |
| `list <repo>` | 列出仓库中的技能 | `list fakeAccount-lab/skills-hub` |
| `installed` | 列出已安装的技能 | `installed --agent openclaw` |
| `help` | 显示帮助信息 | `help` |

## 选项说明

| 选项 | 说明 | 示例 |
|------|------|------|
| `--agent <name>` | 指定目标 Agent | `--agent openclaw` |
| `--skill <name>` | 指定要安装的技能（可多次使用） | `--skill weather` |
| `--global` | 全局安装而非项目级 | `--global` |
| `--mode <mode>` | 安装模式：symlink 或 copy | `--mode copy` |
| `--branch <branch>` | 克隆指定分支 | `--branch main` |
| `--yes` | 跳过确认提示 | `--yes` |

## 使用示例

### 示例 1：查看帮助信息

```bash
cd skill-installer
node dist/cli.js help
```

### 示例 2：列出仓库中的技能

```bash
# 列出 GitHub 仓库中的技能
node dist/cli.js list fakeAccount-lab/skills-hub
```

**预期输出：**
```
┌  📋 Listing Skills

Found 3 skill(s):

• code-review
  Perform code reviews with focus on quality, best practices, and potential issues

• git-helper
  Common Git operations and workflows for version control

• weather
  Get current weather and forecasts for any location

│
└  ✨ Listed 3 skill(s)
```

### 示例 3：安装单个技能

```bash
# 安装 weather 技能到 OpenClaw
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill weather --yes
```

**预期输出：**
```
┌  📦 Skill Installer
✓ Cloned repository: https://github.com/fakeAccount-lab/skills-hub.git
Found 3 skill(s)
✓ Installed "weather" to OpenClaw (symlink)
│
└  ✨ Done! 1 installed, 0 failed
```

### 示例 4：全局安装技能

```bash
# 全局安装 git-helper 技能到 OpenClaw
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill git-helper --global --yes
```

### 示例 5：安装到多个 Agent

```bash
# 安装 weather 技能到 OpenClaw 和 Claude Code
node dist/cli.js add https://github.com/fakeAccount-lab/skills-hub.git --agent openclaw --agent claude-code --skill weather --yes
```

**预期输出：**
```
┌  📦 Skill Installer
✓ Cloned repository: https://github.com/fakeAccount-lab/skills-hub.git
Found 3 skill(s)
✓ Installed "weather" to OpenClaw (symlink)
✓ Installed "weather" to Claude Code (symlink)
│
└  ✨ Done! 2 installed, 0 failed
```

### 示例 6：使用 Copy 模式安装

```bash
# 使用 Copy 模式安装 code-review 技能
node dist/cli.js add fakeAccount-lab/skills-hub --agent openclaw --skill code-review --mode copy --yes
```

**预期输出：**
```
┌  📦 Skill Installer
✓ Cloned repository: https://github.com/fakeAccount-lab/skills-hub.git
Found 3 skill(s)
✓ Installed "code-review" to OpenClaw (copy)
│
└  ✨ Done! 1 installed, 0 failed
```

### 示例 7：查看已安装的技能

```bash
# 查看 OpenClaw 已安装的技能
node dist/cli.js installed --agent openclaw
```

## 注意事项

1. **多 Agent 安装**：当需要安装到多个 Agent 时，建议使用完整的仓库 URL（如 `https://github.com/owner/repo.git`），而不仅仅是简写格式（`owner/repo`），以避免潜在的克隆超时问题。

2. **安装模式**：Symlink 模式是默认和推荐的模式，但如果系统不支持符号链接，工具会自动降级到 Copy 模式。

3. **权限要求**：全局安装需要写入用户主目录的权限，项目级安装需要写入当前项目目录的权限。

4. **覆盖安装**：如果技能已存在，重新安装会覆盖原有内容。

## 常见问题

### Q: 为什么有时克隆会超时？

A: 这通常发生在：
- 使用 GitHub 简写格式（`owner/repo`）时
- 网络连接不稳定
- 仓库体积较大

**解决方法：**
- 使用完整的仓库 URL（`https://github.com/owner/repo.git`）
- 使用 `--single-branch` 标志（工具已自动添加）
- 检查网络连接

### Q: 如何卸载已安装的技能？

A: 目前工具没有提供卸载命令，需要手动删除：

```bash
# 项目级安装
rm -rf skills/<skill-name> .agents/skills/<skill-name>

# 全局安装
rm -rf ~/.openclaw/skills/<skill-name>
```

### Q: Symlink 和 Copy 模式有什么区别？

A: 
- **Symlink 模式**：技能文件存储在 `.agents/skills/<skill-name>`，各 Agent 目录通过符号链接指向该位置。节省空间，易于更新。
- **Copy 模式**：每个 Agent 都有独立的技能文件副本。占用更多空间，但适用于不支持符号链接的系统。

## 许可证

MIT

## 贡献

欢迎贡献！请提交 Issue 或 Pull Request。

## 相关链接

- **项目仓库**：https://github.com/fakeAccount-lab/skill-installer
- **测试技能仓库**：https://github.com/fakeAccount-lab/skills-hub
- **问题反馈**：https://github.com/fakeAccount-lab/skill-installer/issues
