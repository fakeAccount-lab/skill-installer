# 添加自定义 Agent 示例

## 场景

假设你有一个自研的 agent，叫做 `my-agent`，配置如下：

- **Agent ID**: `my-agent`
- **显示名称**: `My Agent`
- **项目级技能目录**: `.my-agent/skills`
- **全局技能目录**: `~/.my-agent/skills`
- **配置目录**: `~/.my-agent`

## 修改步骤

### 1. 打开文件

编辑 `src/agents.ts` 文件。

### 2. 在 DEFAULT_AGENTS 中添加配置

找到 `universal` 配置，在它后面添加你的配置：

```typescript
export const DEFAULT_AGENTS: Record<string, AgentConfig> = {
  openclaw: {
    name: 'openclaw',
    displayName: 'OpenClaw',
    skillsDir: 'skills',
    globalSkillsDir: getOpenClawGlobalSkillsDir(),
    detectInstalled: async () => {
      return existsSync(join(home, '.openclaw')) ||
             existsSync(join(home, '.clawdbot'));
    }
  },
  'claude-code': {
    name: 'claude-code',
    displayName: 'Claude Code',
    skillsDir: '.claude/skills',
    globalSkillsDir: join(process.env.CLAUDE_CONFIG_DIR?.trim() || join(home, '.claude'), 'skills'),
    detectInstalled: async () => {
      return existsSync(process.env.CLAUDE_CONFIG_DIR?.trim() || join(home, '.claude'));
    }
  },
  codex: {
    name: 'codex',
    displayName: 'Codex',
    skillsDir: '.codex/skills',
    globalSkillsDir: join(process.env.CODEX_HOME?.trim() || join(home, '.codex'), 'skills'),
    detectInstalled: async () => {
      return existsSync(process.env.CODEX_HOME?.trim() || join(home, '.codex'));
    }
  },
  cursor: {
    name: 'cursor',
    displayName: 'Cursor',
    skillsDir: '.cursor/skills',
    globalSkillsDir: join(home, '.cursor/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.cursor'));
    }
  },
  opencode: {
    name: 'opencode',
    displayName: 'OpenCode',
    skillsDir: '.agents/skills',
    globalSkillsDir: join(configHome, 'opencode/skills'),
    detectInstalled: async () => {
      return existsSync(join(configHome, 'opencode'));
    }
  },
  universal: {
    name: 'universal',
    displayName: 'Universal',
    skillsDir: '.agents/skills',
    globalSkillsDir: join(configHome, 'agents/skills'),
    detectInstalled: async () => false
  },
  // ========== 你的自定义 agent ==========
  'my-agent': {
    name: 'my-agent',
    displayName: 'My Agent',
    skillsDir: '.my-agent/skills',
    globalSkillsDir: join(home, '.my-agent/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.my-agent'));
    }
  }
  // ========== 结束 ==========
};
```

### 3. 重新构建项目

```bash
npm run build
```

### 4. 验证配置

#### 4.1 查看所有 agents

```bash
node dist/cli.js agents
```

**预期输出**（应该能看到你的 agent）：

```
┌  🤖 Supported Agents

Found 7 agent(s):

• OpenClaw
  Name: openclaw
  Skills Directory: skills
  Global Skills Directory: /root/.openclaw/skills
  Status: ✓ installed

• My Agent
  Name: my-agent
  Skills Directory: .my-agent/skills
  Global Skills Directory: /root/.my-agent/skills
  Status: not detected

│
└  ✨ Listed 7 agent(s)
```

#### 4.2 安装技能测试

```bash
# 创建测试项目
mkdir test-my-agent && cd test-my-agent

# 初始化 Git 仓库（可选）
git init

# 安装技能
node ../dist/cli.js add fakeAccount-lab/skills-hub --agent my-agent --skill weather --yes
```

**预期输出**：

```
┌  📦 Skill Installer
✓ Cloned repository: https://github.com/fakeAccount-lab/skills-hub.git
Found 3 skill(s)
✓ Installed "weather" to My Agent (symlink)
│
└  ✨ Done! 1 installed, 0 failed
```

#### 4.3 查看项目结构

```bash
ls -la
```

**预期结构**：

```
test-my-agent/
├── .git/
├── .agents/
│   └── skills/
│       └── weather/          # 规范位置
└── .my-agent/
    └── skills/ -> .agents/skills  # 符号链接
```

#### 4.4 查看已安装的技能

```bash
node ../dist/cli.js installed --agent my-agent
```

**预期输出**：

```
┌  📋 Installed Skills

Agent: My Agent (my-agent)
Path: .my-agent/skills

Found 1 skill(s):

• weather
  Get current weather and forecasts for any location
  Path: /path/to/test-my-agent/.agents/skills/weather

│
└  ✨ Listed 1 skill(s)
```

## 🎯 不同场景的配置模板

### 场景 A：使用环境变量

如果你的 agent 支持通过环境变量配置：

```typescript
'my-agent': {
  name: 'my-agent',
  displayName: 'My Agent',
  skillsDir: '.my-agent/skills',
  globalSkillsDir: join(
    process.env.MY_AGENT_HOME?.trim() || join(home, '.my-agent'),
    'skills'
  ),
  detectInstalled: async () => {
    return existsSync(
      process.env.MY_AGENT_HOME?.trim() || join(home, '.my-agent')
    );
  }
}
```

### 场景 B：使用 XDG 配置目录

遵循 Linux/XDG 标准：

```typescript
'my-agent': {
  name: 'my-agent',
  displayName: 'My Agent',
  skillsDir: '.my-agent/skills',
  globalSkillsDir: join(configHome, 'my-agent/skills'),
  detectInstalled: async () => {
    return existsSync(join(configHome, 'my-agent'));
  }
}
```

### 场景 C：不支持全局安装

如果不需要全局安装：

```typescript
'my-agent': {
  name: 'my-agent',
  displayName: 'My Agent',
  skillsDir: '.my-agent/skills',
  // 不设置 globalSkillsDir
  detectInstalled: async () => {
    return existsSync(join(home, '.my-agent'));
  }
}
```

### 场景 D：与 OpenClaw 共享技能

如果你希望与 OpenClaw 使用相同的技能：

```typescript
'my-agent': {
  name: 'my-agent',
  displayName: 'My Agent',
  skillsDir: 'skills',  // 与 OpenClaw 相同
  globalSkillsDir: join(home, '.openclaw/skills'),
  detectInstalled: async () => {
    return existsSync(join(home, '.openclaw'));
  }
}
```

## 🔧 快速复制粘贴

直接复制以下代码块，替换你的信息：

```typescript
'my-agent': {
  name: 'my-agent',
  displayName: 'My Agent',
  skillsDir: '.my-agent/skills',
  globalSkillsDir: join(home, '.my-agent/skills'),
  detectInstalled: async () => {
    return existsSync(join(home, '.my-agent'));
  }
}
```

替换内容：
- `'my-agent'` (3处) → 你的 agent ID
- `'My Agent'` → 你的显示名称
- `'.my-agent/skills'` → 你的项目级技能目录
- `'.my-agent'` → 你的配置目录

## ✅ 验证清单

添加自定义 agent 后，请确认：

- [ ] 已在 `DEFAULT_AGENTS` 中添加配置
- [ ] `name` 字段使用小写字母和连字符
- [ ] `name` 在所有 agents 中是唯一的
- [ ] 已运行 `npm run build` 重新构建
- [ ] `skill-installer agents` 能看到你的 agent
- [ ] 能成功安装技能到你的 agent
- [ ] 能成功查看已安装的技能
- [ ] 技能目录结构符合预期

## 📞 需要帮助？

如果遇到问题，请检查：

1. **编译错误**：检查语法是否正确
2. **看不到 agent**：确认已重新构建
3. **路径错误**：使用 `join()` 函数拼接路径
4. **检测失败**：检查 `detectInstalled` 函数的逻辑
