import inquirer from 'inquirer';
import type { PackageType, TemplateContext, NewCommandOptions } from '../types.js';

/**
 * Prompts user for package details interactively
 */
export async function promptForPackageDetails(
  name: string,
  type: PackageType,
  variants: {
    pascalName: string;
    camelName: string;
    packageName: string;
    dirName: string;
  },
  options: NewCommandOptions
): Promise<TemplateContext> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Package description:',
      default: options.description || getDefaultDescription(type, name),
    },
    {
      type: 'input',
      name: 'author',
      message: 'Author (optional):',
      default: await getGitAuthor(),
    },
    {
      type: 'confirm',
      name: 'confirm',
      message: `Create ${variants.packageName}?`,
      default: true,
    },
  ]);

  if (!answers.confirm) {
    console.log('Aborted.');
    process.exit(0);
  }

  return {
    name,
    ...variants,
    description: answers.description,
    type,
    author: answers.author || undefined,
  };
}

/**
 * Gets default description based on package type
 */
function getDefaultDescription(type: PackageType, name: string): string {
  const pascalName = name
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  switch (type) {
    case 'provider':
      return `${pascalName} LLM provider for ContextAI`;
    case 'agent':
      return `${pascalName} agent for ContextAI`;
    case 'component':
      return `${pascalName} React component for ContextAI`;
    case 'library':
      return `${pascalName} utility library for ContextAI`;
    default:
      return `ContextAI ${type} package`;
  }
}

/**
 * Attempts to get author from git config
 */
async function getGitAuthor(): Promise<string> {
  try {
    const { execSync } = await import('child_process');
    const name = execSync('git config user.name', { encoding: 'utf-8' }).trim();
    const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
    return name && email ? `${name} <${email}>` : name || '';
  } catch {
    return '';
  }
}

/**
 * Prompts for package type selection
 */
export async function promptForPackageType(): Promise<PackageType> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: 'What type of package do you want to create?',
      choices: [
        { name: 'Provider - LLM provider adapter', value: 'provider' },
        { name: 'Agent - Agent/feature package', value: 'agent' },
        { name: 'Component - React component', value: 'component' },
        { name: 'Library - Utility library', value: 'library' },
      ],
    },
  ]);

  return answers.type;
}
