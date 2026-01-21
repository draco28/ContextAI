import { Command } from 'commander';
import chalk from 'chalk';
import { newCommand } from './commands/new.js';
import { initCommand } from './commands/init.js';
import { analyzeCommand } from './commands/analyze.js';

const program = new Command();

// CLI metadata
program
  .name('contextai')
  .description('CLI for scaffolding ContextAI projects and packages')
  .version('0.0.1');

// Register commands
program.addCommand(newCommand);
program.addCommand(initCommand);
program.addCommand(analyzeCommand);

// Custom help formatting
program.configureHelp({
  sortSubcommands: true,
  subcommandTerm: (cmd) => chalk.cyan(cmd.name()),
});

// Error handling
program.exitOverride((err) => {
  if (err.code === 'commander.help') {
    process.exit(0);
  }
  console.error(chalk.red(`Error: ${err.message}`));
  process.exit(1);
});

// Parse and execute
program.parse();
