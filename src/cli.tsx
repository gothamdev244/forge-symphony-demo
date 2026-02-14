#!/usr/bin/env bun
/**
 * ABOUTME: CLI entry point for Orbit - AI Agent Loop Orchestrator.
 * Built on Ralph TUI with GitHub Copilot as the primary agent.
 */

import chalk from 'chalk';
import readline from 'readline';
import {
  printTrackerPlugins,
  printAgentPlugins,
  printPluginsHelp,
  executeRunCommand,
  executeStatusCommand,
  executeResumeCommand,
  executeConfigCommand,
  executeSetupCommand,
  executeLogsCommand,
  executeTemplateCommand,
  executeCreatePrdCommand,
  executeConvertCommand,
  executeDocsCommand,
  executeDoctorCommand,
  executeInfoCommand,
  executeSkillsCommand,
  executeRemoteCommand,
} from './commands/index.js';

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

async function showMenu(): Promise<void> {
  console.clear();
  console.log(chalk.bold.cyan(`
  ██████╗ ██╗  ██╗ ██████╗ ███████╗██████╗ ███████╗ ██████╗ ██████╗  █████╗ ██████╗ ██████╗ 
  ██╔══██╗██║  ██║██╔═══██╗██╔════╝██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗
  ██████╔╝███████║██║   ██║█████╗  ██████╔╝█████╗  ██║   ██║██████╔╝██████╔╝██║  ██║██████╔╝
  ██╔═══╝ ██╔══██║██║   ██║██╔══╝  ██╔══██╗██╔══╝  ██║   ██║██╔══██╗██╔══██╗██║  ██║██╔══██╗
  ██║     ██║  ██║╚██████╔╝██║     ██║  ██║███████╗╚██████╔╝██║  ██║██████╔╝██║  ██║██║  ██║
  ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝
  `));
  
  console.log(chalk.bold('\n  AI Agent Loop Orchestrator (Powered by GitHub Copilot)\n'));
  console.log('  What would you like to do?\n');
  console.log(chalk.green('  [1]'), '💬  Chat       - Talk to Orbit directly');
  console.log(chalk.green('  [2]'), '📋  Plan       - Create a task plan');
  console.log(chalk.green('  [3]'), '🔗  Jira       - Load Jira issue');
  console.log(chalk.green('  [4]'), '▶️  Run        - Start execution (Ralph mode)');
  console.log(chalk.gray('  ─────────────────────────────────────'));
  console.log(chalk.green('  [r]  Ralph      - Legacy Ralph TUI mode'));
  console.log(chalk.red('  [q]  Quit       - Exit Orbit\n'));

  const choice = await ask(chalk.cyan('  ➤ '));

  switch (choice.trim()) {
    case '1': await handleChat(); break;
    case '2': await handlePlan(); break;
    case '3': await handleJira(); break;
    case '4': await handleRun(); break;
    case 'r':
    case 'R':
      console.log(chalk.yellow('\n  Launching Ralph TUI...\n'));
      await executeRunCommand([]);
      break;
    case 'q':
    case 'Q':
      console.log(chalk.yellow('\n  Goodbye!'));
      process.exit(0);
    default:
      console.log(chalk.red('\n  Invalid choice.'));
      await new Promise(r => setTimeout(r, 1000));
      await showMenu();
  }
}

async function handleChat(): Promise<void> {
  console.clear();
  console.log(chalk.bold.cyan('\n  💬 Chat Mode\n'));
  console.log(chalk.gray('  Talk to Orbit powered by GitHub Copilot\n'));
  const message = await ask(chalk.cyan('  You: '));
  console.log(chalk.cyan('\n  Orbit: '), 'Processing with GitHub Copilot...');
  console.log(chalk.yellow('\n  [Coming soon - Direct chat with Copilot]\n'));
  await ask(chalk.gray('\n  Press Enter...'));
  await showMenu();
}

async function handlePlan(): Promise<void> {
  console.clear();
  console.log(chalk.bold.cyan('\n  📋 Plan Mode\n'));
  console.log(chalk.gray('  Describe what you want to build\n'));
  const description = await ask(chalk.cyan('  Task: '));
  console.log(chalk.cyan('\n  Orbit: '), `Creating task plan for: "${description}"`);
  console.log(chalk.yellow('\n  [Coming soon - Task decomposition + parallel execution]\n'));
  await ask(chalk.gray('\n  Press Enter...'));
  await showMenu();
}

async function handleJira(): Promise<void> {
  console.clear();
  console.log(chalk.bold.cyan('\n  🔗 Jira Mode\n'));
  console.log(chalk.gray('  Load a Jira issue by URL or ID\n'));
  const issue = await ask(chalk.cyan('  Jira Issue: '));
  console.log(chalk.cyan('\n  Orbit: '), `Fetching issue ${issue}...`);
  console.log(chalk.yellow('\n  [Coming soon - Jira integration]\n'));
  await ask(chalk.gray('\n  Press Enter...'));
  await showMenu();
}

async function handleRun(): Promise<void> {
  console.clear();
  console.log(chalk.bold.cyan('\n  ▶️ Run Mode\n'));
  console.log(chalk.gray('  Starting full execution engine (Ralph TUI)\n'));
  await executeRunCommand([]);
}

function showHelp(): void {
  console.log(`
Orbit - AI Agent Loop Orchestrator (Powered by GitHub Copilot)

Usage: orbit [command] [options]

Commands:
  (none)              Show interactive menu (default)
  chat [message]     Start a chat session
  plan <description> Create a task plan
  jira <issue>       Load a Jira issue
  run [options]      Start execution (Ralph TUI mode)
  resume [options]   Resume an interrupted session
  status [options]   Check session status
  remote [subcommand] Manage remote servers
  logs [options]     View iteration logs
  setup [options]    Run project setup
  doctor [options]   Diagnose issues
  config show        Display configuration
  template show      Display prompt template
  skills list        List skills
  plugins agents     List agent plugins
  plugins trackers   List tracker plugins
  help, --help, -h  Show this help message
  version, --version, -v Show version number

Examples:
  orbit                    # Show interactive menu
  orbit chat              # Start chat mode
  orbit plan "build OAuth2"  # Create task plan
  orbit jira PROJ-123     # Load Jira issue
  orbit run               # Start execution
  orbit run --prd ./prd.json  # Run with PRD file
  orbit resume            # Resume session
  orbit status            # Check status
  orbit plugins agents    # List agents
`);
}

async function handleSubcommand(args: string[]): Promise<boolean> {
  const command = args[0];

  if (command === 'version' || command === '--version' || command === '-v') {
    const pkg = await import('../package.json', { with: { type: 'json' } });
    console.log(`orbit ${pkg.default.version}`);
    return true;
  }

  if (command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return true;
  }

  // Chat command
  if (command === 'chat') {
    const message = args.slice(1).join(' ');
    if (message) {
      console.log(chalk.cyan('Orbit: '), `Processing: "${message}"`);
      console.log(chalk.yellow('\n  [Coming soon - Direct chat with Copilot]\n'));
    } else {
      await handleChat();
    }
    return true;
  }

  // Plan command
  if (command === 'plan') {
    const description = args.slice(1).join(' ');
    if (description) {
      console.log(chalk.cyan('Orbit: '), `Creating plan: ${description}`);
      console.log(chalk.yellow('\n  [Coming soon]\n'));
    } else {
      await handlePlan();
    }
    return true;
  }

  // Jira command
  if (command === 'jira') {
    const issue = args[1];
    if (issue) {
      console.log(chalk.cyan('Orbit: '), `Loading: ${issue}`);
      console.log(chalk.yellow('\n  [Coming soon]\n'));
    } else {
      await handleJira();
    }
    return true;
  }

  // Run command
  if (command === 'run') {
    await executeRunCommand(args.slice(1));
    return true;
  }

  // Resume command
  if (command === 'resume') {
    await executeResumeCommand(args.slice(1));
    return true;
  }

  // Status command
  if (command === 'status') {
    await executeStatusCommand(args.slice(1));
    return true;
  }

  // Logs command
  if (command === 'logs') {
    await executeLogsCommand(args.slice(1));
    return true;
  }

  // Config command
  if (command === 'config') {
    await executeConfigCommand(args.slice(1));
    return true;
  }

  // Setup command
  if (command === 'setup') {
    await executeSetupCommand(args.slice(1));
    return true;
  }

  // Template command
  if (command === 'template') {
    await executeTemplateCommand(args.slice(1));
    return true;
  }

  // Docs command
  if (command === 'docs') {
    await executeDocsCommand(args.slice(1));
    return true;
  }

  // Doctor command
  if (command === 'doctor') {
    await executeDoctorCommand(args.slice(1));
    return true;
  }

  // Info command
  if (command === 'info') {
    await executeInfoCommand(args.slice(1));
    return true;
  }

  // Skills command
  if (command === 'skills') {
    await executeSkillsCommand(args.slice(1));
    return true;
  }

  // Remote command
  if (command === 'remote') {
    await executeRemoteCommand(args.slice(1));
    return true;
  }

  // Plugins commands
  if (command === 'plugins') {
    const subcommand = args[1];
    if (subcommand === 'agents') {
      await printAgentPlugins();
    } else if (subcommand === 'trackers') {
      await printTrackerPlugins();
    } else {
      printPluginsHelp();
    }
    return true;
  }

  // Create-PRD command
  if (command === 'create-prd' || command === 'prime') {
    await executeCreatePrdCommand(args.slice(1));
    return true;
  }

  // Convert command
  if (command === 'convert') {
    await executeConvertCommand(args.slice(1));
    return true;
  }

  // Init command
  if (command === 'init') {
    await executeSetupCommand(args.slice(1));
    return true;
  }

  // Unknown command
  if (command && !command.startsWith('-')) {
    console.error(chalk.red(`Unknown command: `) + command);
    showHelp();
    process.exit(1);
  }

  return false;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const handled = await handleSubcommand(args);
  if (!handled) {
    await showMenu();
  }
}

main().catch((error: unknown) => {
  console.error(chalk.red('Failed to start Orbit:'), error);
  process.exit(1);
});
