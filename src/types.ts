export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children?: FileNode[];
}

export interface AgentStep {
  type: "status" | "thought" | "tool_call" | "tool_result" | "done" | "error";
  text?: string;
  name?: string;
  args?: any;
  id?: string;
  output?: string;
  message?: string;
  step?: number;
  timestamp: string;
}

export interface PresetTask {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: "Algorithm" | "Scripting" | "Analysis";
}

export type SandboxTemplate = "default" | "javascript" | "data_science";

export interface FileState {
  path: string;
  contents: string;
  isDirty?: boolean;
}
