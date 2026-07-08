export type ProviderPresetId = "qwen" | "deepseek" | "openrouter" | "gemini" | "claude";

export interface ProviderPreset {
  OPENCODE_MEM_PROVIDER: string;
  OPENCODE_MEM_OPENROUTER_BASE_URL?: string;
  OPENCODE_MEM_OPENROUTER_MODEL?: string;
  label: string;
  keyEnv: string;
}

export function buildProviderPreset(id: ProviderPresetId): ProviderPreset {
  switch (id) {
    case "qwen":
      return {
        OPENCODE_MEM_PROVIDER: "openrouter",
        OPENCODE_MEM_OPENROUTER_BASE_URL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
        OPENCODE_MEM_OPENROUTER_MODEL: "qwen-plus",
        label: "Qwen qwen-plus (DashScope)",
        keyEnv: "OPENCODE_MEM_OPENROUTER_API_KEY",
      };
    case "deepseek":
      return {
        OPENCODE_MEM_PROVIDER: "openrouter",
        OPENCODE_MEM_OPENROUTER_BASE_URL: "https://api.deepseek.com",
        OPENCODE_MEM_OPENROUTER_MODEL: "deepseek-chat",
        label: "DeepSeek deepseek-chat",
        keyEnv: "OPENCODE_MEM_OPENROUTER_API_KEY",
      };
    case "openrouter":
      return {
        OPENCODE_MEM_PROVIDER: "openrouter",
        label: "OpenRouter",
        keyEnv: "OPENCODE_MEM_OPENROUTER_API_KEY",
      };
    case "gemini":
      return {
        OPENCODE_MEM_PROVIDER: "gemini",
        label: "Gemini",
        keyEnv: "OPENCODE_MEM_GEMINI_API_KEY",
      };
    case "claude":
      return {
        OPENCODE_MEM_PROVIDER: "claude",
        label: "Claude Agent SDK",
        keyEnv: "",
      };
  }
}
