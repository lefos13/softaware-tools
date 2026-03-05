/*
  Formatting tests validate normalization, repair, redact, obfuscation, and
  encode/decode flows used by JSON format and protection tools.
*/
import { describe, expect, it } from "vitest";
import {
  beautifyJson,
  decodeJson,
  encodeJson,
  jsonEscape,
  jsonStripslashes,
  jsonUnescape,
  minifyJson,
  obfuscateJson,
  redactJson,
  repairJson,
  sortJson,
  stringifyJson,
  validateJson,
} from "./formatting";

describe("jsonTools formatting", () => {
  it("beautifies and minifies json", () => {
    expect(beautifyJson('{"a":1}', { indent: 2 })).toContain("\n");
    expect(minifyJson('{"a":1}')).toBe('{"a":1}');
  });

  it("validates json in message and normalized modes", () => {
    expect(validateJson('{"a":1}', { mode: "message" })).toBe("Valid JSON");
    expect(validateJson('{"a":1}', { mode: "normalized", indent: 2 })).toContain('"a": 1');
  });

  it("stringify/escape/unescape utilities work", () => {
    expect(stringifyJson("hello")).toBe('"hello"');
    expect(jsonEscape('hello "json"')).toContain('\\"');
    expect(jsonUnescape("hello \\n")).toContain("hello");
    expect(jsonStripslashes("a\\\\b")).toBe("ab");
  });

  it("sorts json keys and arrays", () => {
    const sorted = sortJson('{"b":2,"a":1,"arr":[3,1]}', { arraySortMode: "asc", indent: 2 });
    expect(sorted.indexOf('"a"')).toBeLessThan(sorted.indexOf('"b"'));
    expect(sorted).toContain("1");
  });

  it("repairs malformed json", () => {
    const repaired = repairJson('{name:"John"}', { outputMode: "pretty", indent: 2 });
    expect(repaired).toContain('"name": "John"');
  });

  it("redacts sensitive keys", () => {
    const redacted = redactJson('{"password":"x","nested":{"token":"y"}}', {
      keys: "password,token",
      replacement: "***",
      indent: 2,
    });

    expect(redacted).toContain('"password": "***"');
    expect(redacted).toContain('"token": "***"');
  });

  it("obfuscates values", () => {
    const obfuscated = obfuscateJson('{"name":"Alice","age":35}', { mode: "mask", indent: 2 });
    expect(obfuscated).toContain('"name"');
    expect(obfuscated).toContain('"*****"');
  });

  it("encodes and decodes json in base64", () => {
    const encoded = encodeJson('{"a":1}', { mode: "base64" });
    const decoded = decodeJson(encoded, { mode: "base64", indent: 2 });
    expect(decoded).toContain('"a": 1');
  });
});
