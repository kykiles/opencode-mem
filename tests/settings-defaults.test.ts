import { describe, it, expect } from "bun:test";
import { SettingsDefaultsManager } from "../src/shared/SettingsDefaultsManager";

describe("OpenCode Zen default preset", () => {
  it("defaults provider to openrouter with OpenCode Zen", () => {
    expect(SettingsDefaultsManager.get("OPENCODE_MEM_PROVIDER")).toBe("openrouter");
    expect(SettingsDefaultsManager.get("OPENCODE_MEM_OPENROUTER_BASE_URL"))
      .toBe("https://opencode.ai/zen/v1");
    expect(SettingsDefaultsManager.get("OPENCODE_MEM_OPENROUTER_MODEL")).toBe("deepseek-v4-flash-free");
  });

  it("keeps claude as a selectable alternative", () => {
    // Claude provider remains available (not removed) — only the default changed.
    const defaults = (SettingsDefaultsManager as unknown as { DEFAULTS: Record<string, string> }).DEFAULTS;
    expect(defaults["OPENCODE_MEM_CLAUDE_AUTH_METHOD"]).toBe("subscription");
    expect(defaults["OPENCODE_MEM_MODEL"]).toBeDefined();
  });
});
