export const COL = 512;
export const ROW = Math.floor((COL * 9) / 16);
export const MIN = 1

export const BACKEND_PORT = 3200;
export const WEBSOCKET_PORT = 3100;
export const VITE_PORT = 5173;
export const MCP_SERVER_PORT = 3300;
// Namespaced path so the loopback MCP endpoint reads clearly and can coexist with other local
// MCP servers on the same port. Legacy "/mcp" is still served as an alias.
export const MCP_SERVER_PATH = '/froggi/mcp';

export const SCENE_TRANSITION_DELAY = 1000
export const ELEMENT_TRANSITION_LIMIT = 5000


