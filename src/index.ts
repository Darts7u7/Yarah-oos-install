#!/usr/bin/env node
import {
  clientNames,
  logger,
  readConfig,
  writeConfig
} from "./utils.js";
import { execSync } from 'child_process';
import os from 'os';
import path from 'path';

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import pc from "picocolors";
import select from "@inquirer/select";
const { green, red, yellow, cyan } = pc;

const LINE = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
function printHeader(text: string): void {
  console.log();
  console.log(LINE);
  console.log(`  ${text}`);
  console.log(LINE);
  console.log();
}

const INSFORGE_LOGO = `
██╗███╗   ██╗███████╗███████╗ ██████╗ ██████╗  ██████╗ ███████╗
██║████╗  ██║██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝ ██╔════╝
██║██╔██╗ ██║███████╗█████╗  ██║   ██║██████╔╝██║  ███╗█████╗
██║██║╚██╗██║╚════██║██╔══╝  ██║   ██║██╔══██╗██║   ██║██╔══╝
██║██║ ╚████║███████║██║     ╚██████╔╝██║  ██║╚██████╔╝███████╗
╚═╝╚═╝  ╚═══╝╚══════╝╚═╝      ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝
`;

const clientDisplayNames: Record<string, string> = {
  "claude-code": "Claude Code",
  "cursor": "Cursor",
  "windsurf": "Windsurf",
  "cline": "Cline",
  "roocode": "Roo Code",
  "trae": "Trae",
  "codex": "Codex",
  "copilot": "GitHub Copilot",
  "qoder": "Qoder",
  "antigravity": "Antigravity",
  "kiro": "Kiro",
  "kimi": "Kimi CLI",
  "opencode": "OpenCode"
};

function printPostInstallMessage(clientName: string): void {
  const displayName = clientDisplayNames[clientName] || clientName;
  console.log(INSFORGE_LOGO);
  console.log(green(`✓ InsForge MCP is now configured for ${cyan(displayName)}!`));
  console.log();
  console.log('Next steps:');
  console.log('  1. Restart your coding agent to load InsForge');
  console.log('  2. Try these commands in your agent:');
  console.log();
  console.log(`     ${yellow('"Create a posts table with title, content, and author"')}`);
  console.log('     (Sets up your database schema)');
  console.log();
  console.log(`     ${yellow('"Add image upload for user profiles"')}`);
  console.log('     (Creates storage bucket and handles file uploads)');
  console.log();
  console.log('Learn more:');
  console.log('  📚 Documentation: https://docs.insforge.dev/introduction');
  console.log('  💬 Discord: https://discord.com/invite/MPxwj5xVvW');
  console.log('  ⭐ GitHub: https://github.com/insforge/insforge');
  console.log();
}

interface InstallArgv {
  client?: string;
  env?: string[];
  dev?: boolean;
  [key: string]: unknown;
}

function builder(y: yargs.Argv): yargs.Argv {
  return y.option("client", {
    type: "string",
    description: "Client to use for installation",
    demandOption: false,
    choices: clientNames
  }).option("env", {
    type: "string",
    description: "Environment variables as key=value pairs (can be used multiple times). API_KEY is required.",
    array: true
  }).option("dev", {
    type: "boolean",
    description: "Install dev version (@insforge/mcp@dev) instead of latest",
    default: false
  });
}

async function handler(argv: InstallArgv): Promise<void> {
  let selectedClient = argv.client;

  if (!selectedClient) {
    console.log();
    console.log(LINE);
    console.log(`  ${cyan('InsForge MCP Installer')}`);
    console.log(LINE);
    console.log();

    selectedClient = await select({
      message: 'Select your coding agent:',
      pageSize: 15,
      loop: false,
      choices: clientNames.map(name => ({
        name: clientDisplayNames[name] || name,
        value: name
      }))
    });
  }

  if (!clientNames.includes(selectedClient)) {
    logger.error(`Invalid client: ${selectedClient}. Available clients: ${clientNames.join(", ")}`);
    return;
  }

  argv.client = selectedClient;
  const envVars: Record<string, string> = {};
  if (argv.env && argv.env.length > 0) {
    for (const envVar of argv.env) {
      const [key, ...valueParts] = envVar.split("=");
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join("=");
      } else {
        logger.warn(`Invalid environment variable format: ${envVar}. Expected KEY=VALUE format.`);
      }
    }
  }
  if (!envVars.API_KEY) {
    logger.error("API_KEY environment variable is required. Use --env API_KEY=your_key");
    return;
  }
  if (!envVars.API_BASE_URL) {
    envVars.API_BASE_URL = "http://localhost:7130";
  }
  const name = "insforge";
  const mcpVersion = argv.dev ? "@insforge/mcp@dev" : "@insforge/mcp@latest";
  try {
    printHeader('InsForge MCP Installer');
    logger.info(`Setting up MCP for ${cyan(argv.client)}...`);

    printHeader(`Configuring ${argv.client}`);
    const config = readConfig(argv.client);

    if (argv.client === "claude-code") {
      if (!config.mcpServers) config.mcpServers = {};
      const isWindows = process.platform === 'win32';
      (config.mcpServers as Record<string, unknown>)[name] = isWindows ? {
        command: "cmd",
        args: ["/c", "npx", "-y", mcpVersion],
        env: {
          API_KEY: envVars.API_KEY,
          API_BASE_URL: envVars.API_BASE_URL
        }
      } : {
        command: "npx",
        args: ["-y", mcpVersion],
        env: {
          API_KEY: envVars.API_KEY,
          API_BASE_URL: envVars.API_BASE_URL
        }
      };
      writeConfig(config, argv.client);

      const fs = await import('fs');
      const claudeDir = path.join(process.cwd(), '.claude');
      const settingsPath = path.join(claudeDir, 'settings.local.json');

      if (!fs.existsSync(claudeDir)) {
        fs.mkdirSync(claudeDir, { recursive: true });
      }

      let settings: Record<string, unknown> = {};
      if (fs.existsSync(settingsPath)) {
        try {
          settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        } catch (error) {
          logger.warn(`Could not parse existing settings.local.json: ${(error as Error).message}`);
        }
      }

      if (!settings.enabledMcpjsonServers) {
        settings.enabledMcpjsonServers = [];
      }
      if (!(settings.enabledMcpjsonServers as string[]).includes("insforge")) {
        (settings.enabledMcpjsonServers as string[]).push("insforge");
      }

      if (settings.disabledMcpjsonServers && Array.isArray(settings.disabledMcpjsonServers)) {
        settings.disabledMcpjsonServers = (settings.disabledMcpjsonServers as string[]).filter(
          (server: string) => server !== "insforge"
        );
      }

      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      logger.info("Added \"insforge\" to enabledMcpjsonServers in .claude/settings.local.json");
    } else if (argv.client === "codex") {
      const homeDir = os.homedir();
      const isWindows = process.platform === 'win32';
      const codexPath = isWindows
        ? path.join(homeDir, 'AppData', 'Roaming', 'npm', 'codex.cmd')
        : 'codex';

      const envArgs = Object.entries(envVars)
        .filter(([key]) => key !== 'CLIENT_NAME')
        .map(([key, value]) => `--env ${key}=${value}`)
        .join(' ');

      try {
        try {
          const removeCmd = isWindows ? `"${codexPath}" mcp remove ${name}` : `codex mcp remove ${name}`;
          execSync(removeCmd, { stdio: 'pipe' });
          logger.info("Removed existing insforge MCP installation.");
        } catch {
          logger.info("No existing insforge MCP found");
        }

        const command = isWindows
          ? `"${codexPath}" mcp add ${name} ${envArgs} -- npx -y ${mcpVersion}`
          : `codex mcp add ${name} ${envArgs} -- npx -y ${mcpVersion}`;
        logger.info(`Adding insforge MCP server (${mcpVersion})...`);
        execSync(command, { stdio: 'inherit' });
      } catch (error) {
        throw new Error(`Failed to add MCP server via Codex CLI: ${(error as Error).message}`);
      }
    } else if (argv.client === "kimi") {
      const kimiCmd = "kimi";

      const envArgs = Object.entries(envVars)
        .filter(([key]) => key !== "CLIENT_NAME")
        .map(([key, value]) => `--env ${key}=${value}`)
        .join(" ");

      try {
        try {
          execSync(`${kimiCmd} mcp remove ${name}`, { stdio: "pipe" });
          logger.info("Removed existing insforge MCP installation.");
        } catch {
          logger.info("No existing insforge MCP found");
        }

        const command = `${kimiCmd} mcp add --transport stdio ${envArgs} ${name} -- npx -y ${mcpVersion}`;
        logger.info(`Adding insforge MCP server (${mcpVersion})...`);
        execSync(command, { stdio: "inherit" });
      } catch (error) {
        throw new Error(`Failed to add MCP server via Kimi CLI: ${(error as Error).message}`);
      }
    } else if (argv.client === "cursor") {
      if (!config.mcpServers) config.mcpServers = {};
      (config.mcpServers as Record<string, unknown>)[name] = {
        command: "npx",
        args: ["-y", mcpVersion],
        env: {
          API_KEY: envVars.API_KEY,
          API_BASE_URL: envVars.API_BASE_URL
        }
      };
      writeConfig(config, argv.client);
    } else if (argv.client === "windsurf") {
      if (!config.mcpServers) config.mcpServers = {};
      (config.mcpServers as Record<string, unknown>)[name] = {
        command: "npx",
        args: ["-y", mcpVersion],
        env: {
          API_KEY: envVars.API_KEY,
          API_BASE_URL: envVars.API_BASE_URL
        }
      };
      writeConfig(config, argv.client);
    } else if (argv.client === "cline" || argv.client === "roocode" || argv.client === "trae" || argv.client === "qoder" || argv.client === "kiro") {
      if (!config.mcpServers) config.mcpServers = {};
      (config.mcpServers as Record<string, unknown>)[name] = {
        command: "npx",
        args: ["-y", mcpVersion],
        env: {
          API_KEY: envVars.API_KEY,
          API_BASE_URL: envVars.API_BASE_URL
        }
      };
      writeConfig(config, argv.client);
    } else if (argv.client === "copilot") {
      const fs = await import('fs');
      const vscodeDir = path.join(process.cwd(), '.vscode');
      const mcpConfigPath = path.join(vscodeDir, 'mcp.json');

      if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir, { recursive: true });
      }

      let copilotConfig: { servers: Record<string, unknown> } = { servers: {} };
      if (fs.existsSync(mcpConfigPath)) {
        try {
          copilotConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
          if (!copilotConfig.servers) copilotConfig.servers = {};
        } catch (error) {
          logger.warn(`Could not parse existing mcp.json: ${(error as Error).message}`);
          copilotConfig = { servers: {} };
        }
      }

      copilotConfig.servers[name] = {
        command: "npx",
        args: ["-y", mcpVersion],
        env: {
          API_KEY: envVars.API_KEY,
          API_BASE_URL: envVars.API_BASE_URL
        }
      };

      fs.writeFileSync(mcpConfigPath, JSON.stringify(copilotConfig, null, 2));
      logger.info(`Configured Copilot MCP at: ${mcpConfigPath}`);
    } else if (argv.client === "antigravity") {
      if (!config.mcpServers) config.mcpServers = {};
      (config.mcpServers as Record<string, unknown>)[name] = {
        command: "npx",
        args: [
          "-y",
          mcpVersion,
          "--api_key",
          envVars.API_KEY,
          "--api_base_url",
          envVars.API_BASE_URL
        ],
        env: {}
      };
      writeConfig(config, argv.client);
    } else if (argv.client === "opencode") {
      const fs = await import('fs');
      const opencodeConfigPath = path.join(process.cwd(), 'opencode.json');

      let opencodeConfig: Record<string, unknown> = {};
      if (fs.existsSync(opencodeConfigPath)) {
        try {
          opencodeConfig = JSON.parse(fs.readFileSync(opencodeConfigPath, 'utf8'));
        } catch (error) {
          logger.warn(`Could not parse existing opencode.json: ${(error as Error).message}`);
          opencodeConfig = {};
        }
      }

      if (!opencodeConfig.mcp) opencodeConfig.mcp = {};
      (opencodeConfig.mcp as Record<string, unknown>)[name] = {
        type: "local",
        command: ["npx", "-y", mcpVersion],
        environment: {
          API_KEY: envVars.API_KEY,
          API_BASE_URL: envVars.API_BASE_URL
        }
      };

      fs.writeFileSync(opencodeConfigPath, JSON.stringify(opencodeConfig, null, 2));
      logger.info(`Configured OpenCode MCP at: ${opencodeConfigPath}`);
    }

    // Fetch instructions documentation and save to appropriate files
    let instructionsContent: string | null = null;
    try {
      const fetch = (await import('node-fetch')).default;
      const apiBaseUrl = envVars.API_BASE_URL || "http://localhost:7130";
      const response = await fetch(`${apiBaseUrl}/api/docs/instructions`);

      if (response.ok) {
        const result = await response.json() as { content?: string };
        if (result && result.content) {
          instructionsContent = result.content;
        }
      }
    } catch (fetchError) {
      logger.warn(`Could not download instructions: ${(fetchError as Error).message}`);
    }

    if (instructionsContent) {
      const fs = await import('fs');
      const frontmatter = `---
description: Instructions building apps with MCP
globs: *
alwaysApply: true
---

`;
      const contentWithFrontmatter = frontmatter + instructionsContent;
      const agentsMdPath = path.join(process.cwd(), 'AGENTS.md');
      fs.writeFileSync(agentsMdPath, contentWithFrontmatter, 'utf-8');
      logger.info(`Saved instructions to: ${agentsMdPath}`);
    }

    printHeader('Setup Complete!');
    printPostInstallMessage(argv.client);
  } catch (e) {
    logger.error(red((e as Error).message));
  }
}

const parser = yargs(hideBin(process.argv)).scriptName("@insforge/install").command("install", "Install Insforge MCP server", builder, handler).help().alias("h", "help").version().alias("v", "version");
if (!process.argv.slice(2).length || process.argv[2].startsWith("--")) {
  parser.parse(["install", ...process.argv.slice(2)]);
} else {
  parser.parse();
}
