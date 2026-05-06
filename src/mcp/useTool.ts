import { useEffect } from 'react';
import type { ToolDescriptor } from './types';

// Register a WebMCP tool while the calling component is mounted.
// On unmount we call unregisterTool so the tool disappears from
// navigator.modelContext.listTools() — that's the per-page contextual
// scoping that makes WebMCP different from server-side MCP. The flight-
// search page exposes searchFlights; results page swaps in setFilter +
// bookFlight. Same idea here: only /transfer page exposes transferFunds.

export function useTool(tool: ToolDescriptor) {
  useEffect(() => {
    if (!navigator.modelContext) {
      console.warn(`[acmebank] navigator.modelContext missing — cannot register "${tool.name}".`);
      return;
    }
    navigator.modelContext.registerTool(tool);
    console.log(`[acmebank] registered tool: ${tool.name}`);
    return () => {
      try {
        navigator.modelContext?.unregisterTool(tool.name);
        console.log(`[acmebank] unregistered tool: ${tool.name}`);
      } catch (err) {
        console.warn(`[acmebank] unregister failed for "${tool.name}":`, err);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.name]);
}
