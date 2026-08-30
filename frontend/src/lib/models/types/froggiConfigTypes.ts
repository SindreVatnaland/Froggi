
export interface Froggi {
  betaOptIn: boolean | undefined;
  version: string | undefined;
  closeAction: 'minimize' | 'quit' | undefined;
  /** undefined = not yet asked, true/false = user's crash-report consent */
  crashReportsEnabled: boolean | undefined;
  /** Lets a local MCP client (Claude Desktop/Code) read app state, logs, and explain setup */
  mcpReadEnabled: boolean | undefined;
  /** Lets a local MCP client mutate overlays, OBS, and automation rules */
  mcpWriteEnabled: boolean | undefined;
  /** Exposes the MCP over the user's Tailscale (tailnet-only HTTPS, never funnel). Off by default. */
  mcpTailscaleEnabled: boolean | undefined;
  /** Auto-inject the toggled overlay set into Dolphin when it connects. undefined = not yet asked. */
  autoInjectEnabled: boolean | undefined;
}