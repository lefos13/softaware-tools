/*
  Conversion tests verify cross-format transforms and SQL helpers so conversion
  tools remain predictable and reversible for common payloads.
*/
import { describe, expect, it } from "vitest";
import {
  convertBase64ToJson,
  convertBsonToJson,
  convertCsvToJson,
  convertJsonToBase64,
  convertJsonToBson,
  convertJsonToCsv,
  convertJsonToSqlInsert,
  convertJsonToSqlQuery,
  convertJsonToXml,
  convertJsonToYaml,
  convertSqlInsertToJson,
  convertXmlToJson,
  convertYamlToJson,
} from "./conversion";

describe("jsonTools conversion", () => {
  it("converts json <-> yaml", () => {
    const yamlOut = convertJsonToYaml('{"a":1}', { indent: 2 });
    expect(yamlOut).toContain("a: 1");

    const jsonOut = convertYamlToJson("a: 1", { indent: 2 });
    expect(jsonOut).toContain('"a": 1');
  });

  it("converts json <-> xml", () => {
    const xml = convertJsonToXml('{"a":1}', { rootName: "root" });
    expect(xml).toContain("<root>");

    const json = convertXmlToJson("<root><a>1</a></root>", { indent: 2 });
    expect(json).toContain('"root"');
  });

  it("converts json <-> csv", () => {
    const csv = convertJsonToCsv('[{"name":"a"},{"name":"b"}]');
    expect(csv).toContain("name");

    const json = convertCsvToJson("name,age\nfoo,30", { hasHeader: true, indent: 2 });
    expect(json).toContain('"name": "foo"');
  });

  it("converts json <-> base64", () => {
    const encoded = convertJsonToBase64('{"a":1}');
    const decoded = convertBase64ToJson(encoded, { indent: 2 });
    expect(decoded).toContain('"a": 1');
  });

  it("converts json <-> bson", () => {
    const encoded = convertJsonToBson('{"a":1}');
    const decoded = convertBsonToJson(encoded, { indent: 2 });
    expect(decoded).toContain('"a": 1');
  });

  it("converts json to sql insert/query and back", () => {
    const insertSql = convertJsonToSqlInsert('[{"id":1,"name":"Alice"}]', {
      tableName: "users",
      formatSql: false,
    });
    expect(insertSql).toContain("INSERT INTO users");

    const fromInsert = convertSqlInsertToJson(insertSql, { indent: 2 });
    expect(fromInsert).toContain('"name": "Alice"');

    const query = convertJsonToSqlQuery('{"id":1}', { tableName: "users", queryMode: "select" });
    expect(query).toContain("SELECT * FROM users");
  });
});
