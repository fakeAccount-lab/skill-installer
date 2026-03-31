import { mkdir, cp, access, readdir, symlink, rm, readlink, lstat, stat, realpath, readFile } from 'fs/promises';
import { existsSync, readFileSync } from 'fs';
import { join, basename, normalize, resolve, sep, relative, dirname } from 'path';
import { homedir, platform } from 'os';
import matter from 'gray-matter';
import type { Skill, AgentType, InstallMode, InstallResult, AgentConfig } from './types.js';

const EXCLUDE_FILES = new Set(['metadata.json']);
const EXCLUDE_DIRS = new Set(['.git', '__pycache__', '__pypackages__', 'node_modules', 'dist']);

function isExcluded(name: string, isDirectory: boolean = false): boolean {
  if (EXCLUDE_FILES.has(name)) return true;
  if (name.startsWith('.')) return true;
  if (isDirectory && EXCLUDE_DIRS.has(name)) return true;
  return false;
}

/**
 * Expand tilde (~) to home directory
 */
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
  // For ~user/path syntax, we would need to resolve to that user's home directory
  // For now, just return the path as-is (it will be handled by resolve() later)
  return path;
}

/**
 * Sanitize a filename to prevent path traversal attacks
 */
export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, '-')
    .replace(/^[.\-]+|[.\-]+$/g, '')
    .substring(0, 255) || 'unnamed-skill';
}

/**
 * Validate that a path is within an expected base directory
 */
function isPathSafe(basePath: string, targetPath: string): boolean {
  const normalizedBase = normalize(resolve(basePath));
  const normalizedTarget = normalize(resolve(targetPath));
  return normalizedTarget.startsWith(normalizedBase + sep) || normalizedTarget === normalizedBase;
}

/**
 * Get canonical skills directory
 */
function getCanonicalSkillsDir(global: boolean, cwd?: string): string {
  const baseDir = global ? homedir() : cwd || process.cwd();
  return join(baseDir, '.agents', 'skills');
}

/**
 * Get agent's skills directory
 */
function getAgentSkillsDir(agent: AgentConfig, global: boolean, cwd?: string): string {
  const baseDir = global ? homedir() : cwd || process.cwd();
  
  if (global && agent.globalSkillsDir) {
    // Expand tilde to home directory if present
    return expandTilde(agent.globalSkillsDir);
  }
  
  return join(baseDir, agent.skillsDir);
}

/**
 * Resolve a path's parent directory through symlinks
 */
async function resolveParentSymlinks(path: string): Promise<string> {
  const resolved = resolve(path);
  const dir = dirname(resolved);
  const base = basename(resolved);
  
  try {
    const realDir = await realpath(dir);
    return join(realDir, base);
  } catch {
    return resolved;
  }
}

/**
 * Clean and recreate a directory
 */
async function cleanAndCreateDirectory(path: string): Promise<void> {
  try {
    await rm(path, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
  await mkdir(path, { recursive: true });
}

/**
 * Create a symlink, handling cross-platform differences
 */
async function createSymlink(target: string, linkPath: string): Promise<boolean> {
  try {
    const resolvedTarget = resolve(target);
    const resolvedLinkPath = resolve(linkPath);

    const [realTarget, realLinkPath] = await Promise.all([
      realpath(resolvedTarget).catch(() => resolvedTarget),
      realpath(resolvedLinkPath).catch(() => resolvedLinkPath),
    ]);

    if (realTarget === realLinkPath) {
      return true;
    }

    const realTargetWithParents = await resolveParentSymlinks(target);
    const realLinkPathWithParents = await resolveParentSymlinks(linkPath);

    if (realTargetWithParents === realLinkPathWithParents) {
      return true;
    }

    try {
      const stats = await lstat(linkPath);
      if (stats.isSymbolicLink()) {
        const existingTarget = await readlink(linkPath);
        if (resolve(dirname(linkPath), existingTarget) === resolvedTarget) {
          return true;
        }
        await rm(linkPath);
      } else {
        await rm(linkPath, { recursive: true });
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'ELOOP') {
        try {
          await rm(linkPath, { force: true });
        } catch {
          // Continue
        }
      }
    }

    const linkDir = dirname(linkPath);
    await mkdir(linkDir, { recursive: true });

    const realLinkDir = await resolveParentSymlinks(linkDir);
    const relativePath = relative(realLinkDir, target);
    const symlinkType = platform() === 'win32' ? 'junction' : undefined;

    await symlink(relativePath, linkPath, symlinkType);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy directory recursively
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });

  await Promise.all(
    entries
      .filter((entry) => !isExcluded(entry.name, entry.isDirectory()))
      .map(async (entry) => {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);

        if (entry.isDirectory()) {
          await copyDirectory(srcPath, destPath);
        } else {
          try {
            await cp(srcPath, destPath, {
              dereference: true,
              recursive: true,
            });
          } catch (err: unknown) {
            if (err instanceof Error && 'code' in err && err.code === 'ENOENT' && entry.isSymbolicLink()) {
              console.warn(`Skipping broken symlink: ${srcPath}`);
            } else {
              throw err;
            }
          }
        }
      })
  );
}

/**
 * Install a skill to an agent
 */
export async function installSkill(
  skill: Skill,
  agent: AgentConfig,
  options: { global?: boolean; cwd?: string; mode?: InstallMode } = {}
): Promise<InstallResult> {
  const isGlobal = options.global ?? false;
  const cwd = options.cwd || process.cwd();
  const installMode = options.mode ?? 'symlink';

  // Check if agent supports global installation
  if (isGlobal && !agent.globalSkillsDir) {
    return {
      success: false,
      path: '',
      mode: installMode,
      error: `${agent.displayName} does not support global skill installation`,
    };
  }

  // Sanitize skill name
  const skillName = sanitizeName(skill.name);

  // Determine paths
  const canonicalBase = getCanonicalSkillsDir(isGlobal, cwd);
  const canonicalDir = join(canonicalBase, skillName);
  const agentBase = getAgentSkillsDir(agent, isGlobal, cwd);
  const agentDir = join(agentBase, skillName);

  // Validate paths
  if (!isPathSafe(canonicalBase, canonicalDir)) {
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: 'Invalid skill name: potential path traversal detected',
    };
  }

  if (!isPathSafe(agentBase, agentDir)) {
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: 'Invalid skill name: potential path traversal detected',
    };
  }

  try {
    // Copy mode: copy directly to agent location
    if (installMode === 'copy') {
      await cleanAndCreateDirectory(agentDir);
      await copyDirectory(skill.path, agentDir);
      return {
        success: true,
        path: agentDir,
        mode: 'copy',
      };
    }

    // Symlink mode: copy to canonical location and symlink to agent location
    await cleanAndCreateDirectory(canonicalDir);
    await copyDirectory(skill.path, canonicalDir);

    // Check if agent uses universal directory
    const agentUsesUniversal = agent.skillsDir === '.agents/skills';
    if (isGlobal && agentUsesUniversal) {
      return {
        success: true,
        path: canonicalDir,
        canonicalPath: canonicalDir,
        mode: 'symlink',
      };
    }

    // Create symlink
    const symlinkCreated = await createSymlink(canonicalDir, agentDir);

    if (!symlinkCreated) {
      // Symlink failed, fall back to copy
      await cleanAndCreateDirectory(agentDir);
      await copyDirectory(skill.path, agentDir);
      return {
        success: true,
        path: agentDir,
        canonicalPath: canonicalDir,
        mode: 'symlink',
        symlinkFailed: true,
      };
    }

    return {
      success: true,
      path: agentDir,
      canonicalPath: canonicalDir,
      mode: 'symlink',
    };
  } catch (error) {
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if a skill is installed
 */
export async function isSkillInstalled(
  skillName: string,
  agent: AgentConfig,
  options: { global?: boolean; cwd?: string } = {}
): Promise<boolean> {
  const sanitized = sanitizeName(skillName);

  if (options.global && !agent.globalSkillsDir) {
    return false;
  }

  const targetBase = options.global
    ? expandTilde(agent.globalSkillsDir!)
    : join(options.cwd || process.cwd(), agent.skillsDir);
  const skillDir = join(targetBase, sanitized);

  if (!isPathSafe(targetBase, skillDir)) {
    return false;
  }

  try {
    await access(skillDir);
    return true;
  } catch {
    return false;
  }
}

/**
 * Remove a skill from an agent
 */
export async function removeSkill(
  skillName: string,
  agent: AgentConfig,
  options: { global?: boolean; cwd?: string } = {}
): Promise<{ success: boolean; error?: string }> {
  const sanitized = sanitizeName(skillName);
  const isGlobal = options.global ?? false;
  const cwd = options.cwd || process.cwd();

  // Check if agent supports global installation
  if (isGlobal && !agent.globalSkillsDir) {
    return {
      success: false,
      error: `${agent.displayName} does not support global skill installation`,
    };
  }

  const targetBase = getAgentSkillsDir(agent, isGlobal, cwd);
  const skillDir = join(targetBase, sanitized);
  const canonicalDir = join(getCanonicalSkillsDir(isGlobal, cwd), sanitized);

  // Validate paths
  if (!isPathSafe(targetBase, skillDir)) {
    return {
      success: false,
      error: 'Invalid skill name: potential path traversal detected',
    };
  }

  try {
    // Check if skill exists
    const exists = await isSkillInstalled(skillName, agent, { global: isGlobal, cwd });
    if (!exists) {
      return {
        success: false,
        error: `Skill "${skillName}" is not installed for ${agent.displayName}`,
      };
    }

    // Remove agent directory
    await rm(skillDir, { recursive: true, force: true });

    // Check if canonical directory exists and if it's still being used by other agents
    try {
      await access(canonicalDir);
      
      // Check if any other agent is using this canonical directory
      // For now, we'll check if any agent's skills directory has a symlink to this canonical directory
      const agents = Object.values(getAgents ? getAgents() : {}); // We'll need to pass agents or import
      
      // Simple approach: check if canonical dir is a symlink target for any agent
      // For now, just remove canonical dir if it exists
      // A more sophisticated approach would check for other references
      await rm(canonicalDir, { recursive: true, force: true });
    } catch {
      // Canonical directory doesn't exist, nothing to do
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List installed skills for an agent
 */
export async function listInstalledSkills(
  agent: AgentConfig,
  options: { global?: boolean; cwd?: string } = {}
): Promise<Skill[]> {
  const isGlobal = options.global ?? false;
  const cwd = options.cwd || process.cwd();

  const targetBase = getAgentSkillsDir(agent, isGlobal, cwd);

  // Check if skills directory exists
  try {
    await access(targetBase);
  } catch {
    return [];
  }

  const skills: Skill[] = [];

  try {
    const entries = await readdir(targetBase, { withFileTypes: true });

    for (const entry of entries) {
      // Check if it's a directory or a symlink pointing to a directory
      let isDirectory = entry.isDirectory();
      let isSymlink = entry.isSymbolicLink();
      let entryPath = join(targetBase, entry.name);

      if (!isDirectory && isSymlink) {
        try {
          const stats = await stat(entryPath);
          isDirectory = stats.isDirectory();
        } catch {
          // Broken symlink, skip
          continue;
        }
      }

      if (!isDirectory) {
        continue;
      }

      const skillPath = entryPath;
      const skillMdPath = join(skillPath, 'SKILL.md');

      try {
        const content = await readFile(skillMdPath, 'utf-8');
        const { data } = matter(content);

        if (data.name && data.description) {
          // Try to find repository information
          let repository: string | undefined;
          try {
            const gitConfigPath = join(skillPath, '.git', 'config');
            const gitConfig = await readFile(gitConfigPath, 'utf-8');
            const match = gitConfig.match(/url\s*=\s*(.+)/);
            if (match) {
              repository = match[1].trim();
            }
          } catch {
            // Not a git repository or git config not found
          }

          skills.push({
            name: String(data.name),
            description: String(data.description),
            path: skillPath,
            internal: data.metadata?.internal === true || data.internal === true,
            repository,
          });
        }
      } catch {
        // Invalid or missing SKILL.md, skip
        continue;
      }
    }
  } catch {
    // Error reading directory
    return [];
  }

  return skills;
}

// Helper function to get agents (needed for removeSkill)
// This should be imported from config.ts, but we'll handle it differently
import { getAgents as getAgentsFromConfig } from './config.js';

function getAgents() {
  return getAgentsFromConfig();
}
