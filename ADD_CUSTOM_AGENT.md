# 如何添加自定义 Agent

本文档说明如何在 skill-installer 中添加自定义的内置 agent 配置。

## 📝 步骤说明

### 1. 编辑 `src/agents.ts` 文件

在 `DEFAULT_AGENTS` 对象中添加你的 agent 配置。

### 2. 配置字段说明

每个 agent 配置包含以下字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | `string` | ✅ | agent 的唯一标识符（用作命令行参数） |
| `displayName` | `string` | ✅ | agent 的显示名称（用于 UI 和文档） |
| `skillsDir` | `string` | ✅ | 项目级技能目录（相对于项目根目录） |
| `globalSkillsDir` | `string` | ❌ | 全局技能目录（绝对路径） |
| `detectInstalled` | `async () => boolean` | ❌ | 检测 agent 是否已安装的函数 |

## 🔧 配置示例

### 示例 1：简单的自定义 Agent

假设你的 agent 叫做 "my-agent"，项目级技能目录是 `.my-agent/skills`，全局目录是 `~/.my-agent/skills`：

```typescript
export const DEFAULT_AGENTS: Record<string, AgentConfig> = {
  // ... 其他 agents ...

  'my-agent': {
    name: 'my-agent',
    displayName: 'My Agent',
    skillsDir: '.my-agent/skills',
    globalSkillsDir: join(home, '.my-agent/skills'),
    detectInstalled: async () => {
      return existsSync(join(home, '.my-agent'));
    }
  }
};
```

### 示例 2：支持环境变量的 Agent

如果你的 agent 配置可以通过环境变量自定义：

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

### 示例 3：使用 XDG 标准配置目录

遵循 XDG Base Directory 规范：

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

### 示例 4：不支持的 Global 安装

如果你的 agent 不支持全局安装：

```typescript
'my-agent': {
  name: 'my-agent',
  displayName: 'My Agent',
  skillsDir: '.my-agent/skills',
  // 不设置 globalSkillsDir（即不支持全局安装）
  detectInstalled: async () => {
    return existsSync(join(home, '.my-agent'));
  }
}
```

### 示例 5：始终显示为已安装

如果你的 agent 不需要检测安装状态：

```typescript
'my-agent': {
  name: 'my-agent',
  displayName: 'My Agent',
  skillsDir: '.my-agent/skills',
  globalSkillsDir: join(home, '.my-agent/skills'),
  detectInstalled: async () => true  // 始终返回 true
}
```

## 🎯 完整配置示例

假设你的自研 agent 叫做 "super-agent"，配置如下：

```typescript
export const DEFAULT_AGENTS: Record<string, AgentConfig> = {
  // ... 其他内置 agents ...

  openclaw: { /* ... */ },
  'claude-code': { /* ... */ },
  codex: { /* ... */ },
  cursor: { /* ... */ },
  opencode: { /* ... */ },
  universal: { /* ... */ },

  // 你的自定义 agent
  'super-agent': {
    name: 'super-agent',
    displayName: 'Super Agent',
    skillsDir: '.super-agent/skills',
    globalSkillsDir: join(home, '.super-agent/skills'),
    detectInstalled: async () => {
      // 检查 ~/.super-agent 目录是否存在
      return existsSync(join(home, '.super-agent'));
    }
  }
};
```

## 📦 重新构建项目

修改完成后，需要重新构建项目：

```bash
npm run build
```

## 🧪 测试配置

构建完成后，测试新添加的 agent：

```bash
# 1. 查看所有 agents（应该能看到你的自定义 agent）
node dist/cli.js agents

# 2. 安装技能到你的 agent
node dist/cli.js add fakeAccount-lab/skills-hub --agent super-agent --skill weather --yes

# 3. 查看已安装的技能
node dist/cli.js installed --agent super-agent
```

## 💡 常见配置模式

### 使用标准配置目录

如果你的 agent 使用标准的 `.agents/skills` 目录：

```typescript
'my-agent': {
  name: 'my-agent',
  displayName: 'My Agent',
  skillsDir: '.agents/skills',
  globalSkillsDir: join(configHome, 'agents/skills'),
  detectInstalled: async () => {
    return existsSync(join(configHome, 'my-agent'));
  }
}
```

### 与 OpenClaw 共享技能目录

如果你的 agent 与 OpenClaw 使用相同的技能目录：

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

## 📋 配置检查清单

添加自定义 agent 时，请确认：

- [ ] `name` 字段使用小写字母和连字符（kebab-case）
- [ ] `name` 字段在所有 agents 中是唯一的
- [ ] `displayName` 是用户友好的名称
- [ ] `skillsDir` 路径是相对于项目根目录的
- [ ] `globalSkillsDir` 路径是绝对路径
- [ ] `detectInstalled` 函数能正确检测 agent 是否已安装
- [ ] 重新构建项目（`npm run build`）
- [ ] 使用 `skill-installer agents` 命令验证配置

## 🔍 可用的工具变量

在配置中可以使用以下变量：

| 变量 | 说明 | 示例 |
|------|------|------|
| `home` | 用户主目录 | `/home/user` 或 `C:\Users\user` |
| `configHome` | XDG 配置目录 | `~/.config` |
| `process.env.XXX` | 环境变量 | `process.env.MY_AGENT_HOME` |

## 📌 注意事项

1. **唯一性**：确保 `name` 字段在所有 agents 中是唯一的
2. **路径格式**：使用 `join()` 函数拼接路径，确保跨平台兼容性
3. **环境变量**：使用 `process.env.XXX?.trim()` 来避免空格问题
4. **检测函数**：`detectInstalled` 函数是异步的，必须使用 `async/await`
5. **构建**：修改代码后必须重新构建才能生效

## 🆘 故障排除

### 问题：`skill-installer agents` 看不到新添加的 agent

**解决方案**：
1. 确认已重新构建项目：`npm run build`
2. 确认 `name` 字段是唯一的
3. 检查语法是否有错误

### 问题：安装技能时提示找不到目录

**解决方案**：
1. 检查 `skillsDir` 和 `globalSkillsDir` 路径是否正确
2. 确保路径使用 `join()` 函数拼接
3. 确认目录结构与配置匹配

### 问题：检测 agent 安装状态不准确

**解决方案**：
1. 检查 `detectInstalled` 函数的逻辑
2. 确认检测路径是正确的
3. 使用 `existsSync()` 检查目录或文件是否存在

## 📚 相关文档

- AgentConfig 类型定义：`src/types.ts`
- 配置加载逻辑：`src/config.ts`
- 技能安装逻辑：`src/installer.ts`
