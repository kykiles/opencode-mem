import { describe, it, expect } from "bun:test";

describe("install honesty round-trip", () => {
  it("fails install when worker is unreachable", async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      throw Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" });
    }) as typeof fetch;
    try {
      // Re-import fresh so module-level state doesn't leak across tests.
      const mod = await import(`../src/services/integrations/OpenCodeInstaller.ts?t=${Date.now()}`);
      const code = await mod.installOpenCodeIntegration();
      expect(code).not.toBe(0);
      expect(calls).toBeGreaterThan(0);
    } finally {
      globalThis.fetch = original;
    }
  });
});
