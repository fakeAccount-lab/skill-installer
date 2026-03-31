import { existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { xdgConfig } from 'xdg-basedir';
import type { AgentConfig } from './types.js';

const home = homedir();
const configHome = xdgConfig || join(home, '.config');

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
  // Test agent with tilde in globalSkillsDir (for testing tilde expansion)
  'test-agent': {
    name: 'test-agent',
    displayName: 'Test Agent',
    skillsDir: '.test-agent/skills',
    globalSkillsDir: '~/.test-agent/skills',
    detectInstalled: async () => {
      return existsSync(join(home, '.test-agent'));
    }
  },
  // 在这里添加你的自定义 agent
  // 'your-agent-id': {
  //   name: 'your-agent-id',
  //   displayName: 'Your Agent Display Name',
  //   skillsDir: '.your-agent/skills',
  //   globalSkillsDir: join(home, '.your-agent/skills'),
  //   detectInstalled: async () => {
  //     return existsSync(join(home, '.your-agent'));
  //   }
  // }
};

function getOpenClawGlobalSkillsDir(): string {
  if (existsSync(join(home, '.openclaw'))) {
    return join(home, '.openclaw/skills');
  }
  if (existsSync(join(home, '.clawdbot'))) {
    return join(home, '.clawdbot/skills');
  }
  return join(home, '.openclaw/skills');
}

export async function detectInstalledAgents(): Promise<string[]> {
  const results: { type: string; installed: boolean }[] = [];
  
  for (const [type, config] of Object.entries(DEFAULT_AGENTS)) {
    const installed = config.detectInstalled ? await config.detectInstalled() : false;
    results.push({ type, installed });
  }
  
  return results.filter(r => r.installed).map(r => r.type);
}
