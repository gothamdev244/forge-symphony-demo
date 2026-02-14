/**
 * ABOUTME: Orbit Features - Chat, Plan, Jira, and execution orchestration.
 * Provides the core functionality for Orbit's interactive modes.
 */

import chalk from 'chalk';
import readline from 'readline';
import { spawn } from 'node:child_process';
import { homedir, cwd } from 'node:process';
import { join } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export interface OrbitConfig {
  copilotPath?: string;
  defaultModel?: string;
  mcpServers?: MCPServerConfig[];
}

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface Task {
  id: string;
  description: string;
  subagentType: SubagentType;
  status: 'pending' | 'running' | 'complete' | 'failed';
  dependencies: string[];
  result?: string;
}

export type SubagentType = 'explorer' | 'researcher' | 'planner' | 'implementer' | 'reviewer' | 'tester' | 'debugger';

export interface Plan {
  id: string;
  description: string;
  tasks: Task[];
}

export interface JiraIssue {
  key: string;
  summary: string;
  description: string;
  acceptanceCriteria: string[];
}

export interface ChatMessage {
  role: 'user' | 'orbit';
  content: string;
  timestamp: Date;
}

/**
 * Simple readline helper
 */
function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Load Orbit configuration
 */
export async function loadConfig(): Promise<OrbitConfig> {
  const configPath = join(homedir(), '.config', 'orbit', 'config.json');
  
  try {
    if (existsSync(configPath)) {
      const content = await readFile(configPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    // Config doesn't exist, use defaults
  }
  
  return {
    defaultModel: 'gpt-4.1',
    mcpServers: [],
  };
}

/**
 * Save Orbit configuration
 */
export async function saveConfig(config: OrbitConfig): Promise<void> {
  const configDir = join(homedir(), '.config', 'orbit');
  const configPath = join(configDir, 'config.json');
  
  await mkdir(configDir, { recursive: true });
  await writeFile(configPath, JSON.stringify(config, null, 2));
}

/**
 * Execute GitHub Copilot command
 */
export async function executeCopilot(prompt: string, options?: {
  model?: string;
  stream?: boolean;
  onChunk?: (chunk: string) => void;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const args = ['copilot', 'ai', '--prompt', prompt];
    
    if (options?.model) {
      args.push('--model', options.model);
    }
    
    const proc = spawn('npx', args, {
      cwd: cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    let output = '';
    let errorOutput = '';
    
    proc.stdout?.on('data', (data) => {
      const chunk = data.toString();
      output += chunk;
      options?.onChunk?.(chunk);
    });
    
    proc.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(errorOutput || `Copilot exited with code ${code}`));
      }
    });
    
    proc.on('error', reject);
  });
}

/**
 * Decompose a task description into subtasks using Copilot
 */
export async function decomposeTask(description: string): Promise<Task[]> {
  const prompt = `Break down this task into smaller subtasks that can be executed in parallel where possible:

Task: ${description}

Respond with a JSON array of tasks. Each task should have:
- id: unique identifier (e.g., "task-1")
- description: brief description of what this subtask does
- subagentType: one of explorer, researcher, planner, implementer, reviewer, tester, debugger
- dependencies: array of task IDs this depends on (empty if no dependencies)

Return ONLY valid JSON, no other text.`;

  try {
    const result = await executeCopilot(prompt, { 
      model: 'gpt-4.1' 
    });
    
    const tasks = JSON.parse(result) as Task[];
    return tasks.map((task, index) => ({
      ...task,
      id: `task-${index + 1}`,
      status: 'pending' as const,
      dependencies: task.dependencies || [],
    }));
  } catch (error) {
    console.error(chalk.red('Failed to decompose task:'), error);
    // Fallback to simple task
    return [{
      id: 'task-1',
      description,
      subagentType: 'implementer',
      status: 'pending',
      dependencies: [],
    }];
  }
}

/**
 * Fetch Jira issue
 */
export async function fetchJiraIssue(issueKey: string): Promise<JiraIssue> {
  // This is a placeholder - in production, use Jira API
  // For now, simulate fetching
  console.log(chalk.cyan(`Fetching Jira issue: ${issueKey}...`));
  
  // Simulated response
  return {
    key: issueKey,
    summary: `Task for ${issueKey}`,
    description: 'Auto-fetched from Jira',
    acceptanceCriteria: [
      'Implement the feature',
      'Write tests',
      'Update documentation',
    ],
  };
}

/**
 * Interactive chat with Copilot
 */
export async function chatWithCopilot(message: string): Promise<string> {
  console.log(chalk.cyan('Orbit: '), 'Thinking...');
  
  try {
    const response = await executeCopilot(message, {
      model: 'gpt-4.1',
      onChunk: (chunk) => {
        process.stdout.write(chalk.gray(chunk));
      },
    });
    return response;
  } catch (error) {
    return chalk.red(`Error: ${error}`);
  }
}

/**
 * Execute a plan with parallel subagents
 */
export async function executePlan(plan: Plan, options?: {
  parallel?: boolean;
  onTaskUpdate?: (task: Task) => void;
}): Promise<void> {
  const { parallel = true } = options || {};
  
  console.log(chalk.cyan(`\nExecuting plan: ${plan.description}`));
  console.log(chalk.gray(`Total tasks: ${plan.tasks.length}\n`));
  
  // Group tasks by dependency level
  const levels = groupTasksByLevel(plan.tasks);
  
  for (let level = 0; level < levels.length; level++) {
    const levelTasks = levels[level];
    
    console.log(chalk.cyan(`\n--- Level ${level + 1} (${levelTasks.length} tasks) ---`));
    
    if (parallel && levelTasks.length > 1) {
      // Execute in parallel
      await Promise.all(
        levelTasks.map(async (task) => {
          task.status = 'running';
          options?.onTaskUpdate?.(task);
          
          try {
            const result = await executeSubagent(task);
            task.result = result;
            task.status = 'complete';
            console.log(chalk.green(`✓ ${task.id}: ${task.description}`));
          } catch (error) {
            task.status = 'failed';
            console.log(chalk.red(`✗ ${task.id}: ${error}`));
          }
          
          options?.onTaskUpdate?.(task);
        })
      );
    } else {
      // Execute sequentially
      for (const task of levelTasks) {
        task.status = 'running';
        options?.onTaskUpdate?.(task);
        
        try {
          const result = await executeSubagent(task);
          task.result = result;
          task.status = 'complete';
          console.log(chalk.green(`✓ ${task.id}: ${task.description}`));
        } catch (error) {
          task.status = 'failed';
          console.log(chalk.red(`✗ ${task.id}: ${error}`));
        }
        
        options?.onTaskUpdate?.(task);
      }
    }
  }
  
  console.log(chalk.cyan('\n--- Execution Complete ---\n'));
}

/**
 * Group tasks by dependency level for parallel execution
 */
function groupTasksByLevel(tasks: Task[]): Task[][] {
  const levels: Task[][] = [];
  const completed = new Set<string>();
  const remaining = [...tasks];
  
  while (remaining.length > 0) {
    const currentLevel: Task[] = [];
    const nextRemaining: Task[] = [];
    
    for (const task of remaining) {
      const depsMet = task.dependencies.every(dep => completed.has(dep));
      
      if (depsMet) {
        currentLevel.push(task);
      } else {
        nextRemaining.push(task);
      }
    }
    
    if (currentLevel.length === 0 && nextRemaining.length > 0) {
      // Circular dependency - just add remaining
      levels.push(nextRemaining);
      break;
    }
    
    for (const task of currentLevel) {
      completed.add(task.id);
    }
    
    levels.push(currentLevel);
    remaining.length = 0;
    remaining.push(...nextRemaining);
  }
  
  return levels;
}

/**
 * Execute a single subagent task
 */
async function executeSubagent(task: Task): Promise<string> {
  const prompt = `Execute this task using the ${task.subagentType} subagent:

Task: ${task.description}

Use appropriate tools and commands to complete this task. Report the results.`;
  
  return executeCopilot(prompt);
}

/**
 * Auto-select MCP servers based on task context
 */
export function selectMCPs(tasks: Task[]): MCPServerConfig[] {
  const neededCapabilities = new Set<string>();
  
  for (const task of tasks) {
    switch (task.subagentType) {
      case 'explorer':
        neededCapabilities.add('filesystem');
        neededCapabilities.add('git');
        break;
      case 'researcher':
        neededCapabilities.add('web-search');
        break;
      case 'implementer':
        neededCapabilities.add('filesystem');
        neededCapabilities.add('git');
        break;
      case 'reviewer':
        neededCapabilities.add('git');
        neededCapabilities.add('linter');
        break;
      case 'tester':
        neededCapabilities.add('filesystem');
        neededCapabilities.add('test-runner');
        break;
      case 'debugger':
        neededCapabilities.add('filesystem');
        neededCapabilities.add('debugger');
        break;
    }
  }
  
  // Return MCP configs based on needed capabilities
  const mcpConfigs: MCPServerConfig[] = [];
  
  if (neededCapabilities.has('filesystem')) {
    mcpConfigs.push({
      name: 'filesystem',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
    });
  }
  
  if (neededCapabilities.has('git')) {
    mcpConfigs.push({
      name: 'git',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-git'],
    });
  }
  
  return mcpConfigs;
}
