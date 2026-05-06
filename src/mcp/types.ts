// Local type re-exports. The Navigator.modelContext global augmentation
// comes from @mcp-b/webmcp-types — we just import it for its side-effect
// of declaring the global, then re-export a tighter descriptor alias.
//
// Why the local alias: the package's ToolDescriptor has `inputSchema?:
// InputSchema` (optional), but registerTool's three overloads need
// inputSchema to be *definitely present* or *definitely absent*. All our
// tools have an inputSchema, so we tighten it to required to make the
// overload-2 path resolve cleanly.

import '@mcp-b/webmcp-types';
import type {
  ToolDescriptor as PkgToolDescriptor,
  ModelContextClient,
  InputSchema,
} from '@mcp-b/webmcp-types';

export type ToolDescriptor = PkgToolDescriptor<Record<string, unknown>, unknown, string> & {
  inputSchema: InputSchema;
};

export type AgentInteractionAPI = ModelContextClient;

export type StructuredResponse = {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
};
