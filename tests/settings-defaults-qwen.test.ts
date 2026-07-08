import { describe, it, expect } from "bun:test";
import { SettingsDefaultsManager } from "../src/shared/SettingsDefaultsManager";

describe("Qwen default preset", () => {
  it("defaults provider to openrouter with Qwen DashScope", () => {
    expect(SettingsDefaultsManager.get("OPENCODE_MEM_PROVIDER")).toBe("openrouter");
    expect(SettingsDefaultsManager.get("OPENCODE_MEM_OPENROUTER_BASE_URL"))
      .toBe("https://dashscope.aliyuncs.com/compatible-mode/v1");
    expect(SettingsDefaultsManager.get("OPENCODE_MEM_OPENROUTER_MODEL")).toBe("qwen-plus");
  });

  it("keeps claude as a selectable alternative", () => {
    // Claude provider remains available (not removed) — only the default changed.
    const defaults = (SettingsDefaultsManager as unknown as { DEFAULTS: Record<string, string> }).DEFAULTS;
    expect(defaults["OPENCODE_MEM_CLAUDE_AUTH_METHOD"]).toBe("subscription");
    expect(defaults["OPENCODE_MEM_MODEL"]).toBeDefined();
  });
});
