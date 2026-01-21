import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import type { PackageType, NewCommandOptions, TemplateContext, ScaffoldResult } from '../types.js';
import { validatePackageName, getPackageNameVariants } from '../utils/validator.js';
import { promptForPackageDetails } from '../utils/prompts.js';
import { scaffoldPackage } from '../utils/file-handler.js';

const PACKAGE_TYPES: PackageType[] = ['provider', 'agent', 'component', 'library'];

/**
 * The `new` command creates a new package in the monorepo
 *
 * Usage:
 *   contextai new provider my-provider
 *   contextai new agent my-agent --yes
 *   contextai new component my-component --dry-run
 */
export const newCommand = new Command('new')
  .description('Create a new package in the monorepo')
  .argument('<type>', `Package type: ${PACKAGE_TYPES.join(', ')}`)
  .argument('<name>', 'Package name in kebab-case (e.g., my-provider)')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('-d, --dry-run', 'Preview files without creating them')
  .option('--description <desc>', 'Package description')
  .action(async (type: string, name: string, options: NewCommandOptions) => {
    // Validate package type
    if (!PACKAGE_TYPES.includes(type as PackageType)) {
      console.error(chalk.red(`Invalid package type: ${type}`));
      console.error(chalk.gray(`Valid types: ${PACKAGE_TYPES.join(', ')}`));
      process.exit(1);
    }

    // Validate package name
    const nameValidation = validatePackageName(name);
    if (!nameValidation.valid) {
      console.error(chalk.red(`Invalid package name: ${nameValidation.error}`));
      process.exit(1);
    }

    const packageType = type as PackageType;

    // Get package name variants (pascal, camel, etc.)
    const variants = getPackageNameVariants(name, packageType);

    // Either prompt for details or use defaults
    let context: TemplateContext;
    if (options.yes) {
      context = {
        name,
        ...variants,
        description: options.description || `ContextAI ${packageType} package`,
        type: packageType,
      };
    } else {
      context = await promptForPackageDetails(name, packageType, variants, options);
    }

    // Show what will be created
    console.log();
    console.log(chalk.bold('Creating package:'));
    console.log(chalk.cyan(`  Name: ${context.packageName}`));
    console.log(chalk.cyan(`  Type: ${context.type}`));
    console.log(chalk.cyan(`  Path: packages/${context.name}/`));
    console.log();

    if (options.dryRun) {
      console.log(chalk.yellow('Dry run - no files will be created'));
      console.log();
      // TODO: Show files that would be created
      return;
    }

    // Scaffold the package
    const spinner = ora('Creating package...').start();

    try {
      const result: ScaffoldResult = await scaffoldPackage(context);
      spinner.succeed(chalk.green('Package created successfully!'));

      console.log();
      console.log(chalk.bold('Files created:'));
      result.files.forEach(file => {
        console.log(chalk.gray(`  ${file}`));
      });

      if (result.warnings.length > 0) {
        console.log();
        console.log(chalk.yellow('Warnings:'));
        result.warnings.forEach(warning => {
          console.log(chalk.yellow(`  ${warning}`));
        });
      }

      console.log();
      console.log(chalk.bold('Next steps:'));
      console.log(chalk.gray('  1. cd packages/' + context.name));
      console.log(chalk.gray('  2. pnpm install'));
      console.log(chalk.gray('  3. pnpm build'));
      console.log();
    } catch (error) {
      spinner.fail(chalk.red('Failed to create package'));
      console.error(chalk.red(error instanceof Error ? error.message : String(error)));
      process.exit(1);
    }
  });
