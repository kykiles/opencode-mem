import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export type ProviderPresetId =
  | "opencode-go"
  | "opencode-zen"
  | "qwen"
  | "deepseek"
  | "openrouter"
  | "gemini"
  | "claude";

export interface ProviderPreset {
  OPENCODE_MEM_PROVIDER: string;
  OPENCODE_MEM_OPENROUTER_BASE_URL?: string;
  OPENCODE_MEM_OPENROUTER_MODEL?: string;
  label: string;
  keyEnv: string;
}

/**
 * Default model for the OpenCode Go subscription preset.
 * deepseek-v4-flash is a free, fast model in the Go catalog; good for the
 * worker's structured-extraction task (title/subtitle/facts/narrative).
 */
const OPENCODE_GO_DEFAULT_MODEL = "deepseek-v4-flash";
const OPENCODE_ZEN_DEFAULT_MODEL = "deepseek-v4-flash-free";

export function buildProviderPreset(id: ProviderPresetId): ProviderPreset {
  switch (id) {
    case "opencode-go":
      return {
        OPENCODE_MEM_PROVIDER: "openrouter",
        OPENCODE_MEM_OPENROUTER_BASE_URL: "https://opencode.ai/zen/go/v1",
        OPENCODE_MEM_OPENROUTER_MODEL: OPENCODE_GO_DEFAULT_MODEL,
        label: "OpenCode Go (deepseek-v4-flash)",
        keyEnv: "OPENCODE_MEM_OPENROUTER_API_KEY",
      };
    case "opencode-zen":
      return {
        OPENCODE_MEM_PROVIDER: "openrouter",
        OPENCODE_MEM_OPENROUTER_BASE_URL: "https://opencode.ai/zen/v1",
        OPENCODE_MEM_OPENROUTER_MODEL: OPENCODE_ZEN_DEFAULT_MODEL,
        label: "OpenCode Zen (deepseek-v4-flash-free)",
        keyEnv: "OPENCODE_MEM_OPENROUTER_API_KEY",
      };
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

/**
 * Read the OpenCode subscription API key from ~/.local/share/opencode/auth.json.
 * Both the "opencode" (Zen) and "opencode-go" subscriptions store the key under
 * `auth.opencode.key`. Returns the key string, or null if the file/entry is
 * missing. Used by the installer to prefill the OpenAI-compatible provider key
 * so the user doesn't have to paste it manually when targeting an OpenCode
 * subscription.
 */
export function readOpenCodeApiKey(authPath?: string): string | null {
  const path = authPath ?? join(homedir(), ".local", "share", "opencode", "auth.json");
  try {
    if (!existsSync(path)) return null;
    const auth = JSON.parse(readFileSync(path, "utf-8")) as { opencode?: { key?: string } };
    const key = auth?.opencode?.key;
    return typeof key === "string" && key.trim().length > 0 ? key.trim() : null;
  } catch {
    return null;
  }
}
