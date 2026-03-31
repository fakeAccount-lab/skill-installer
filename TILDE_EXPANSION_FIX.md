# Tilde (~) 展开修复说明

## 问题描述

在自定义 agent 配置中，如果使用 `~/.xxx/skills` 作为 `globalSkillsDir`，工具不会将 `~` 展开为用户主目录，而是创建一个字面路径 `当前目录/~/.xxx/skills`。

### 示例

```typescript
'my-agent': {
  name: 'my-agent',
  displayName: 'My Agent',
  skillsDir: '.my-agent/skills',
  globalSkillsDir: '~/.my-agent/skills',  // ❌ 在修复前，这会创建 ./~/.my-agent/skills
  detectInstalled: async () => {
    return existsSync(join(home, '.my-agent'));
  }
}
```

**修复前**：技能会被安装到 `当前目录/~/.my-agent/skills`

**修复后**：技能会被正确安装到 `/home/用户/.my-agent/skills`

## 解决方案

在 `src/installer.ts` 中添加了 `expandTilde()` 函数，自动展开 `~` 符号：

```typescript
function expandTilde(path: string): string {
  const home = homedir();
  if (!path.startsWith('~')) {
    return path;
  }
  // Replace ~ with home directory
  if (path === '~') {
    return home;
  }
  // Replace ~/path with home/path
  if (path.startsWith('~/')) {
    return join(home, path.substring(2));
  }
  // For ~user/path syntax, return as-is (will be handled by resolve() later)
  return path;
}
```

## 应用位置

`expandTilde()` 函数在以下位置被应用：

1. **`getAgentSkillsDir()`**：获取 agent 的技能目录时
2. **`isSkillInstalled()`**：检查技能是否安装时

## 测试验证

### 测试用例

```bash
# 创建测试 agent
'test-agent': {
  name: 'test-agent',
  displayName: 'Test Agent',
  skillsDir: '.test-agent/skills',
  globalSkillsDir: '~/.test-agent/skills',
  detectInstalled: async () => {
    return existsSync(join(home, '.test-agent'));
  }
}

# 全局安装技能
skill-installer add test-repo --agent test-agent --skill weather --global --yes
```

### 验证结果

✅ **修复前**：
```
当前目录/
├── ~/
│   └── .test-agent/
│       └── skills/
│           └── weather/  ❌ 错误的位置
```

✅ **修复后**：
```
/home/用户/
├── .test-agent/
│   └── skills/
│       └── weather/  ✅ 正确的位置
```

## 使用建议

### 方式 1：使用 `~` 符号（推荐，更简洁）

```typescript
'my-agent': {
  name: 'my-agent',
  displayName: 'My Agent',
  skillsDir: '.my-agent/skills',
  globalSkillsDir: '~/.my-agent/skills',  // ✅ 简洁
  detectInstalled: async () => {
    return existsSync(join(home, '.my-agent'));
  }
}
```

### 方式 2：使用 `join(home, ...)`

```typescript
import { join } from 'path';
import { homedir } from 'os';

const home = homedir();

'my-agent': {
  name: 'my-agent',
  displayName: 'My Agent',
  skillsDir: '.my-agent/skills',
  globalSkillsDir: join(home, '.my-agent/skills'),  // ✅ 显式
  detectInstalled: async () => {
    return existsSync(join(home, '.my-agent'));
  }
}
```

### 方式 3：使用绝对路径

```typescript
'my-agent': {
  name: 'my-agent',
  displayName: 'My Agent',
  skillsDir: '.my-agent/skills',
  globalSkillsDir: '/home/username/.my-agent/skills',  // ✅ 硬编码
  detectInstalled: async () => {
    return existsSync(join(home, '.my-agent'));
  }
}
```

**推荐**：使用方式 1（`~` 符号），因为：
- 更简洁直观
- 符合 Unix/Linux 习惯
- 工具会自动处理跨平台路径

## 影响范围

### 修改的文件

- `src/installer.ts`：
  - 添加 `expandTilde()` 函数
  - 在 `getAgentSkillsDir()` 中应用
  - 在 `isSkillInstalled()` 中应用

- `src/agents.ts`：
  - 添加测试 agent `test-agent` 用于验证

- `ADD_CUSTOM_AGENT.md`：
  - 更新示例，说明支持 `~` 符号

### 不受影响的功能

- 项目级安装（`--global` 未指定时）
- 已有的内置 agent（它们都使用 `join(home, ...)`）
- 所有其他功能

## 常见问题

### Q: 我之前的配置会有问题吗？

A: 如果之前的配置使用了 `~` 符号，会有问题。修复后可以继续使用 `~` 符号，或者改用 `join(home, ...)` 形式。

### Q: 内置 agent 会受影响吗？

A: 不会。内置 agent 都使用 `join(home, ...)` 形式，不会受影响。

### Q: Windows 上能正常工作吗？

A: 能。`homedir()` 函数在 Windows 上也会返回正确的主目录路径。

### Q: 支持 `~user` 格式吗？

A: 暂不支持。`~username/path` 格式会保持原样，由后续的 `resolve()` 函数处理。目前只支持 `~` 和 `~/path` 格式。

## 回归测试

在修改前已进行的所有测试都通过，新功能也经过验证：

- ✅ 标准全局安装（OpenClaw、Claude Code 等）
- ✅ 使用 `~` 符号的自定义 agent
- ✅ 使用 `join(home, ...)` 的自定义 agent
- ✅ 项目级安装
- ✅ 列出已安装技能
- ✅ 移除技能

## 总结

这个修复解决了自定义 agent 配置中 `~` 符号不被展开的问题，使得用户可以使用更简洁直观的方式来配置全局技能目录。
