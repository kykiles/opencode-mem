import { describe, it, expect } from "bun:test";
import { buildProviderPreset } from "../src/npx-cli/commands/provider-presets";

describe("installer provider presets", () => {
  it("Qwen preset maps to openrouter + DashScope + qwen-plus", () => {
    const preset = buildProviderPreset("qwen");
    expect(preset).toEqual({
      OPENCODE_MEM_PROVIDER: "openrouter",
      OPENCODE_MEM_OPENROUTER_BASE_URL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
      OPENCODE_MEM_OPENROUTER_MODEL: "qwen-plus",
      label: "Qwen qwen-plus (DashScope)",
      keyEnv: "OPENCODE_MEM_OPENROUTER_API_KEY",
    });
  });

  it("DeepSeek preset maps to openrouter + deepseek-chat", () => {
    const preset = buildProviderPreset("deepseek");
    expect(preset.OPENCODE_MEM_PROVIDER).toBe("openrouter");
    expect(preset.OPENCODE_MEM_OPENROUTER_BASE_URL).toBe("https://api.deepseek.com");
    expect(preset.OPENCODE_MEM_OPENROUTER_MODEL).toBe("deepseek-chat");
    expect(preset.keyEnv).toBe("OPENCODE_MEM_OPENROUTER_API_KEY");
  });

  it("OpenRouter preset uses default endpoint (no base_url)", () => {
    const preset = buildProviderPreset("openrouter");
    expect(preset.OPENCODE_MEM_PROVIDER).toBe("openrouter");
    expect(preset.OPENCODE_MEM_OPENROUTER_BASE_URL).toBeUndefined();
  });

  it("Gemini preset maps to gemini provider", () => {
    const preset = buildProviderPreset("gemini");
    expect(preset.OPENCODE_MEM_PROVIDER).toBe("gemini");
    expect(preset.keyEnv).toBe("OPENCODE_MEM_GEMINI_API_KEY");
  });

  it("Claude preset maps to claude provider with no key env", () => {
    const preset = buildProviderPreset("claude");
    expect(preset.OPENCODE_MEM_PROVIDER).toBe("claude");
    expect(preset.keyEnv).toBe("");
  });
});
