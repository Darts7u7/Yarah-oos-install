# @yarahdev/install

CLI tool for installing Yarah MCP servers across different AI clients.

## Installation & Usage

```bash
# Install for specific clients with required API key and base URL
npx @yarahdev/install --client claude-code --env API_KEY=YOUR_API_KEY --env API_BASE_URL=http://localhost:7130
npx @yarahdev/install --client cursor --env API_KEY=YOUR_API_KEY --env API_BASE_URL=http://localhost:7130
npx @yarahdev/install --client windsurf --env API_KEY=YOUR_API_KEY --env API_BASE_URL=http://localhost:7130
npx @yarahdev/install --client cline --env API_KEY=YOUR_API_KEY --env API_BASE_URL=http://localhost:7130
npx @yarahdev/install --client roocode --env API_KEY=YOUR_API_KEY --env API_BASE_URL=http://localhost:7130
npx @yarahdev/install --client codex --env API_KEY=YOUR_API_KEY --env API_BASE_URL=http://localhost:7130
npx @yarahdev/install --client kimi --env API_KEY=YOUR_API_KEY --env API_BASE_URL=http://localhost:7130
npx @yarahdev/install --client trae --env API_KEY=YOUR_API_KEY --env API_BASE_URL=http://localhost:7130
npx @yarahdev/install --client antigravity --env API_KEY=YOUR_API_KEY --env API_BASE_URL=http://localhost:7130

# Install dev version for testing (uses @yarahdev/mcp@dev)
npx @yarahdev/install --client cursor --env API_KEY=YOUR_API_KEY --env API_BASE_URL=http://localhost:7130 --dev

# With custom base URL (e.g., production server)
npx @yarahdev/install --client cursor --env API_KEY=YOUR_API_KEY --env API_BASE_URL=https://api.yarah.com
```

## Required Configuration

- **API_KEY** (required): Your Yarah API key for authentication
- **API_BASE_URL** (optional): Defaults to `http://localhost:7130`

## Supported Clients

- **claude-code** - Claude Desktop (uses `~/.claude/claude_mcp_config.json`)
- **cursor** - Cursor IDE (uses `~/.cursor/mcp.json`)
- **windsurf** - Windsurf IDE (uses `~/.codeium/windsurf/mcp_config.json`)
- **cline** - Cline VS Code Extension (uses `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` on macOS)
- **roocode** - Roo-Code VS Code Extension (uses `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roocline/settings/mcp_settings.json` on macOS)
- **codex** - Codex CLI (uses `~/.codex/mcp_config.json`)
- **kimi** - Kimi CLI (uses `~/.kimi/mcp.json`)
- **trae** - Trae IDE (uses `~/Library/Application Support/Trae/User/mcp.json` on macOS)
- **qoder** - Qoder IDE (uses `~/Library/Application Support/Qoder/SharedClientCache/mcp.json` on macOS)
- **copilot** - GitHub Copilot (uses `.vscode/mcp.json` in project)
- **antigravity** - Antigravity (uses `~/.gemini/antigravity/mcp_config.json`)

## Options

```
--client <client>         Target AI client (required)
--env KEY=VALUE          Environment variables (can be used multiple times)
                         API_KEY is required
                         API_BASE_URL is optional (default: http://localhost:7130)
--dev                    Install dev version (@yarahdev/mcp@dev) instead of latest
```

## Examples

### Basic Installation
```bash
# Install Yarah MCP for Claude Code
npx @yarahdev/install --client claude-code --env API_KEY=your-api-key-here --env API_BASE_URL=http://localhost:7130

# Install for Windsurf with production server
npx @yarahdev/install --client windsurf --env API_KEY=your-api-key --env API_BASE_URL=https://api.yarah.com

# Install dev version for internal testing
npx @yarahdev/install --client cursor --env API_KEY=your-api-key --env API_BASE_URL=http://localhost:7130 --dev
```

### What This Does

The installer will:
1. Create or update the MCP configuration file for your chosen client
2. Add the Yarah MCP server with your API credentials
3. Configure it to run via `npx @yarahdev/mcp@latest` (or `@yarahdev/mcp@dev` with `--dev` flag)

After installation, restart your AI client to load the Yarah MCP server.

### Dev vs Production Versions

- **Production** (default): `npx @yarahdev/install --client <client> ...`
  - Installs `@yarahdev/mcp@latest` - stable, tested version
  - Recommended for general use

- **Development** (`--dev` flag): `npx @yarahdev/install --client <client> ... --dev`
  - Installs `@yarahdev/mcp@dev` - latest features, may be unstable
  - For team testing and early access to new features

## License

MIT
