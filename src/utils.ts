import fs from "fs";
import os from "os";
import path from "path";
import process from "process";
import { createConsola } from "consola";

interface ClientPath {
  type: string;
  path: string;
  localPath?: string;
}

interface PlatformPaths {
  baseDir: string;
  vscodePath: string;
}

interface McpConfig {
  mcpServers?: Record<string, unknown>;
  [key: string]: unknown;
}

export const logger = createConsola({});
const verbose = (msg: string): void => logger.verbose(msg);

const homeDir = os.homedir();
const platformPaths: Record<string, PlatformPaths> = {
  win32: {
    baseDir: process.env.APPDATA || path.join(homeDir, "AppData", "Roaming"),
    vscodePath: path.join("Code", "User", "globalStorage")
  },
  darwin: {
    baseDir: path.join(homeDir, "Library", "Application Support"),
    vscodePath: path.join("Code", "User", "globalStorage")
  },
  linux: {
    baseDir: process.env.XDG_CONFIG_HOME || path.join(homeDir, ".config"),
    vscodePath: path.join("Code/User/globalStorage")
  }
};

const platform = process.platform;
const { baseDir, vscodePath } = platformPaths[platform] ?? platformPaths.linux;

const clientPaths: Record<string, ClientPath> = {
  cursor: {
    type: "file",
    path: path.join(homeDir, ".cursor", "mcp.json"),
    localPath: path.join(process.cwd(), ".cursor", "mcp.json")
  },
  "claude-code": {
    type: "file",
    path: path.join(process.cwd(), ".mcp.json")
  },
  windsurf: {
    type: "file",
    path: path.join(homeDir, ".codeium", "windsurf", "mcp_config.json")
  },
  cline: {
    type: "file",
    path: path.join(baseDir, vscodePath, "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json")
  },
  roocode: {
    type: "file",
    path: path.join(baseDir, vscodePath, "rooveterinaryinc.roo-cline", "settings", "mcp_settings.json")
  },
  trae: {
    type: "file",
    path: path.join(baseDir, "Trae", "User", "mcp.json")
  },
  codex: {
    type: "file",
    path: path.join(homeDir, ".codex", "mcp_config.json")
  },
  copilot: {
    type: "file",
    path: path.join(process.cwd(), ".vscode", "mcp.json")
  },
  qoder: {
    type: "file",
    path: path.join(baseDir, "Qoder", "SharedClientCache", "mcp.json")
  },
  antigravity: {
    type: "file",
    path: path.join(homeDir, ".gemini", "antigravity", "mcp_config.json")
  },
  kiro: {
    type: "file",
    path: path.join(homeDir, ".kiro", "settings", "mcp.json")
  },
  kimi: {
    type: "file",
    path: path.join(homeDir, ".kimi", "mcp.json")
  },
  opencode: {
    type: "file",
    path: path.join(process.cwd(), "opencode.json")
  }
};

export const clientNames: string[] = Object.keys(clientPaths);

function getConfigPath(client: string, local?: boolean): ClientPath {
  const normalizedClient = client?.toLowerCase() || "claude-code";
  verbose(`Getting config path for client: ${normalizedClient}${local ? " (local)" : ""}`);
  const configTarget = clientPaths[normalizedClient];
  if (!configTarget) {
    throw new Error(`Unsupported client: ${client}. Supported clients: ${clientNames.join(", ")}`);
  }
  if (local && configTarget.localPath) {
    verbose(`Using local config path for ${normalizedClient}: ${configTarget.localPath}`);
    return { ...configTarget, path: configTarget.localPath };
  }
  verbose(`Using default config path for ${normalizedClient}: ${configTarget.path}`);
  return configTarget;
}

export function readConfig(client: string, local?: boolean): McpConfig {
  verbose(`Reading config for client: ${client}${local ? " (local)" : ""}`);
  try {
    const configPath = getConfigPath(client, local);
    verbose(`Checking if config file exists at: ${configPath.path}`);
    if (!fs.existsSync(configPath.path)) {
      verbose("Config file not found, returning default empty config");
      return { mcpServers: {} };
    }
    verbose("Reading config file content");
    const rawConfig = JSON.parse(fs.readFileSync(configPath.path, "utf8")) as McpConfig;
    verbose(`Config loaded successfully: ${JSON.stringify(rawConfig, null, 2)}`);
    return rawConfig;
  } catch (error) {
    verbose(`Error reading config: ${error instanceof Error ? error.stack : JSON.stringify(error)}`);
    return { mcpServers: {} };
  }
}

export function writeConfig(config: McpConfig, client: string, local?: boolean): void {
  verbose(`Writing config for client: ${client || "default"}${local ? " (local)" : ""}`);
  verbose(`Config data: ${JSON.stringify(config, null, 2)}`);

  if (!config.mcpServers || typeof config.mcpServers !== "object") {
    verbose("Invalid mcpServers structure in config");
    throw new Error("Invalid mcpServers structure");
  }

  const configPath = getConfigPath(client, local);
  writeConfigFile(config, configPath);
}

function writeConfigFile(config: McpConfig, target: ClientPath): void {
  const configDir = path.dirname(target.path);
  verbose(`Ensuring config directory exists: ${configDir}`);
  if (!fs.existsSync(configDir)) {
    verbose(`Creating directory: ${configDir}`);
    fs.mkdirSync(configDir, { recursive: true });
  }
  let existingConfig: McpConfig = { mcpServers: {} };
  try {
    if (fs.existsSync(target.path)) {
      verbose("Reading existing config file for merging");
      existingConfig = JSON.parse(fs.readFileSync(target.path, "utf8")) as McpConfig;
      verbose(`Existing config loaded: ${JSON.stringify(existingConfig, null, 2)}`);
    }
  } catch (error) {
    verbose(`Error reading existing config for merge: ${error instanceof Error ? error.message : String(error)}`);
  }
  verbose("Merging configs");
  const mergedConfig: McpConfig = {
    ...existingConfig,
    ...config
  };
  verbose(`Merged config: ${JSON.stringify(mergedConfig, null, 2)}`);
  verbose(`Writing config to file: ${target.path}`);
  fs.writeFileSync(target.path, JSON.stringify(mergedConfig, null, 2));
  verbose("Config successfully written");
}
