import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync, existsSync } from "fs";

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory() && !e.name.startsWith(".") && e.name !== "node_modules") {
      out.push(...walkTs(p));
    } else if (e.isFile() && e.name.endsWith(".ts")) {
      out.push(p);
    }
  }
  return out;
}

const SRC = walkTs("src");

describe("rebrand guard", () => {
  it("src .ts files discovered", () => {
    expect(SRC.length).toBeGreaterThan(100);
  });

  it("no CLAUDE_MEM_ env prefix remains in src", () => {
    const hits: string[] = [];
    for (const f of SRC) {
      const c = readFileSync(f, "utf-8");
      if (/\bCLAUDE_MEM_[A-Z]/.test(c)) hits.push(f);
    }
    expect(hits, `files still using CLAUDE_MEM_: ${hits.join(", ")}`).toEqual([]);
  });

  it("no .claude-mem data dir remains in src", () => {
    const hits = SRC.filter((f) => readFileSync(f, "utf-8").includes(".claude-mem"));
    expect(hits, `files still using .claude-mem: ${hits.join(", ")}`).toEqual([]);
  });

  it("no functional claude-mem/claude_mem branding in src", () => {
    const hits: string[] = [];
    for (const f of SRC) {
      const c = readFileSync(f, "utf-8");
      // Allowed: "thedotmack/claude-mem" upstream attribution only.
      const stripped = c.replace(/thedotmack\/claude-mem/g, "");
      if (/claude[-_]mem/i.test(stripped)) hits.push(f);
    }
    expect(hits, `files still branded claude-mem: ${hits.join(", ")}`).toEqual([]);
  });
});

describe("rebrand identity specifics", () => {
  it("context tags are opencode-mem", async () => {
    const { CONTEXT_TAG_OPEN, CONTEXT_TAG_CLOSE } = await import(
      "../src/utils/context-injection"
    );
    expect(CONTEXT_TAG_OPEN).toBe("<opencode-mem-context>");
    expect(CONTEXT_TAG_CLOSE).toBe("</opencode-mem-context>");
  });

  it("plugin exports OpenCodeMemPlugin (not ClaudeMemPlugin)", async () => {
    const mod = await import("../src/integrations/opencode-plugin/index");
    expect(typeof mod.OpenCodeMemPlugin).toBe("function");
    expect((mod as unknown as { ClaudeMemPlugin?: unknown }).ClaudeMemPlugin).toBeUndefined();
  });
});

describe("opencode-only", () => {
  it("no foreign IDE installers", () => {
    const foreign = [
      "CursorHooksInstaller",
      "CodexCliInstaller",
      "WindsurfHooksInstaller",
      "OpenClawInstaller",
      "AntigravityCliHooksInstaller",
    ];
    for (const name of foreign) {
      expect(
        existsSync(`src/services/integrations/${name}.ts`),
        `${name}.ts still present`,
      ).toBe(false);
    }
  });

  it("no MCP server artifacts (opencode uses native tool)", () => {
    expect(existsSync("plugin/.mcp.json"), "plugin/.mcp.json still present").toBe(false);
  });

  it("no foreign IDE dirs", () => {
    const dirs = ["cursor-hooks", ".codex-plugin", ".claude-plugin", ".windsurf", ".agents", "openclaw"];
    for (const d of dirs) {
      expect(existsSync(d), `${d}/ still present`).toBe(false);
    }
  });
});
