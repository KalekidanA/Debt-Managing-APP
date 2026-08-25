import { describe, expect, it } from "vitest";
import { generateSalt, hashPin, verifyPin } from "../appLock";

describe("hashPin", () => {
  it("is deterministic for the same PIN and salt", () => {
    expect(hashPin("1234", "abc")).toBe(hashPin("1234", "abc"));
  });

  it("matches a known SHA-256 vector for its own input format", () => {
    expect(hashPin("9999", "salt123")).toBe(
      "e60bc75e2b1bc97b1fc030662c5ccf6e435f1abef45933a320dd6b709a9cdd18"
    );
  });

  it("differs when the PIN differs", () => {
    expect(hashPin("1234", "abc")).not.toBe(hashPin("4321", "abc"));
  });

  it("differs when the salt differs", () => {
    expect(hashPin("1234", "abc")).not.toBe(hashPin("1234", "xyz"));
  });
});

describe("generateSalt", () => {
  it("produces a non-empty hex string that varies between calls", () => {
    const a = generateSalt();
    const b = generateSalt();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toBe(b);
  });
});

describe("verifyPin", () => {
  it("accepts the correct PIN and rejects a wrong one", () => {
    const salt = generateSalt();
    const hash = hashPin("2468", salt);
    expect(verifyPin("2468", salt, hash)).toBe(true);
    expect(verifyPin("1111", salt, hash)).toBe(false);
  });
});
