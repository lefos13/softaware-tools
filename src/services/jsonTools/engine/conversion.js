/*
  Conversion utilities handle structured format transformations between JSON and
  common data representations while preserving deterministic output where possible.
*/
import { BSON } from "bson";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import yaml from "js-yaml";
import Papa from "papaparse";
import { format as formatSql } from "sql-formatter";
import { ApiError } from "./types";
import {
  formatMinifiedJson,
  formatPrettyJson,
  parseCsvValue,
  parseJsonInput,
  parseJsonObjectInput,
} from "./helpers";

const bytesToBase64 = (bytes) => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const base64ToBytes = (base64) => {
  try {
    const binary = atob(base64.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    throw new ApiError("INVALID_BASE64", "Input is not valid Base64", [
      { field: "input", issue: error instanceof Error ? error.message : "Invalid Base64 string" },
    ]);
  }
};

export const convertJsonToYaml = (input, options) => {
  const parsed = parseJsonInput(input);
  return yaml.dump(parsed, {
    indent: Number(options.indent || 2),
    noRefs: true,
    lineWidth: -1,
  });
};

export const convertYamlToJson = (input, options) => {
  try {
    const parsed = yaml.load(input);
    return formatPrettyJson(parsed, Number(options.indent || 2));
  } catch (error) {
    throw new ApiError("INVALID_YAML", "Input is not valid YAML", [
      { field: "input", issue: error instanceof Error ? error.message : "Invalid YAML content" },
    ]);
  }
};

export const convertJsonToXml = (input, options) => {
  const parsed = parseJsonInput(input);
  const rootName = String(options.rootName || "root");
  const builder = new XMLBuilder({
    format: true,
    ignoreAttributes: false,
    suppressBooleanAttributes: false,
  });

  return builder.build({ [rootName]: parsed });
};

export const convertXmlToJson = (input, options) => {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      trimValues: true,
    });
    const parsed = parser.parse(input);
    return formatPrettyJson(parsed, Number(options.indent || 2));
  } catch (error) {
    throw new ApiError("INVALID_XML", "Input is not valid XML", [
      { field: "input", issue: error instanceof Error ? error.message : "Invalid XML content" },
    ]);
  }
};

export const convertJsonToCsv = (input) => {
  const parsed = parseJsonInput(input);
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  return Papa.unparse(rows, { header: true });
};

export const convertCsvToJson = (input, options) => {
  const hasHeader = options.hasHeader !== false;
  const result = Papa.parse(input, {
    header: hasHeader,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0) {
    throw new ApiError("INVALID_CSV", "Input is not valid CSV", [
      {
        field: "input",
        issue: result.errors[0]?.message || "Could not parse CSV",
      },
    ]);
  }

  if (!hasHeader) {
    const rows = result.data.map((row) => row.map((cell) => parseCsvValue(cell)));
    return formatPrettyJson(rows, Number(options.indent || 2));
  }

  const rows = result.data.map((row) => {
    const normalized = {};
    Object.entries(row).forEach(([key, value]) => {
      normalized[key] = parseCsvValue(value);
    });
    return normalized;
  });

  return formatPrettyJson(rows, Number(options.indent || 2));
};

const quoteSql = (value) => {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
};

export const convertJsonToSqlInsert = (input, options) => {
  const parsed = parseJsonInput(input);
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const table = String(options.tableName || "records");

  if (rows.length === 0) {
    throw new ApiError("EMPTY_JSON", "JSON array is empty", [
      { field: "input", issue: "Provide at least one object" },
    ]);
  }

  const keys = Array.from(
    rows.reduce((set, row) => {
      if (row && typeof row === "object" && !Array.isArray(row)) {
        Object.keys(row).forEach((key) => set.add(key));
      }
      return set;
    }, new Set())
  );

  if (keys.length === 0) {
    throw new ApiError("INVALID_JSON_OBJECT", "Rows must be JSON objects", [
      { field: "input", issue: "Provide one or more JSON objects" },
    ]);
  }

  const valuesBlock = rows
    .map((row) => {
      const values = keys.map((key) => quoteSql(row?.[key] ?? null));
      return `(${values.join(", ")})`;
    })
    .join(",\n");

  const sql = `INSERT INTO ${table} (${keys.join(", ")})\nVALUES\n${valuesBlock};`;

  return options.formatSql ? formatSql(sql, { language: "sql" }) : sql;
};

const splitSqlValues = (segment) => {
  const values = [];
  let current = "";
  let inQuote = false;

  for (let i = 0; i < segment.length; i += 1) {
    const char = segment[i];
    const next = segment[i + 1];

    if (char === "'" && inQuote && next === "'") {
      current += "''";
      i += 1;
      continue;
    }

    if (char === "'") {
      inQuote = !inQuote;
      current += char;
      continue;
    }

    if (char === "," && !inQuote) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    values.push(current.trim());
  }

  return values;
};

const parseSqlLiteral = (literal) => {
  const trimmed = literal.trim();
  if (/^null$/i.test(trimmed)) {
    return null;
  }

  if (/^true$/i.test(trimmed)) {
    return true;
  }

  if (/^false$/i.test(trimmed)) {
    return false;
  }

  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }

  if (/^'.*'$/.test(trimmed)) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }

  return trimmed;
};

export const convertSqlInsertToJson = (input, options) => {
  const match = input.match(/insert\s+into\s+[^()]+\(([^)]+)\)\s*values\s*([\s\S]+);?/i);
  if (!match) {
    throw new ApiError("INVALID_SQL_INSERT", "Input is not a supported SQL INSERT statement", [
      { field: "input", issue: "Expected INSERT INTO ... (columns) VALUES (...) format" },
    ]);
  }

  const columns = match[1].split(",").map((column) => column.trim().replace(/[`"']/g, ""));
  const valuesSection = match[2];
  const rowMatches = valuesSection.match(/\(([^()]+)\)/g) || [];

  const rows = rowMatches.map((rowChunk) => {
    const rawValues = splitSqlValues(rowChunk.slice(1, -1));
    const row = {};

    columns.forEach((column, index) => {
      row[column] = parseSqlLiteral(rawValues[index] || "NULL");
    });

    return row;
  });

  return formatPrettyJson(rows, Number(options.indent || 2));
};

export const convertJsonToSqlQuery = (input, options) => {
  const parsed = parseJsonObjectInput(input);
  const table = String(options.tableName || "records");
  const mode = String(options.queryMode || "select");

  const whereClauses = Object.entries(parsed).map(([key, value]) => `${key} = ${quoteSql(value)}`);
  const where = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(" AND ")}` : "";

  if (mode === "delete") {
    return `DELETE FROM ${table}${where};`;
  }

  if (mode === "update") {
    const setClause = Object.entries(parsed)
      .map(([key, value]) => `${key} = ${quoteSql(value)}`)
      .join(", ");
    return `UPDATE ${table} SET ${setClause}${where};`;
  }

  return `SELECT * FROM ${table}${where};`;
};

export const convertJsonToBase64 = (input) => {
  const parsed = parseJsonInput(input);
  return btoa(unescape(encodeURIComponent(formatMinifiedJson(parsed))));
};

export const convertBase64ToJson = (input, options) => {
  try {
    const decoded = decodeURIComponent(escape(atob(input.trim())));
    const parsed = parseJsonInput(decoded);
    return formatPrettyJson(parsed, Number(options.indent || 2));
  } catch (error) {
    throw new ApiError("INVALID_BASE64_JSON", "Input Base64 does not decode to valid JSON", [
      { field: "input", issue: error instanceof Error ? error.message : "Invalid Base64 JSON" },
    ]);
  }
};

export const convertJsonToBson = (input) => {
  const parsed = parseJsonInput(input);
  const bytes = BSON.serialize(parsed);
  return bytesToBase64(bytes);
};

export const convertBsonToJson = (input, options) => {
  const bytes = base64ToBytes(input);

  try {
    const parsed = BSON.deserialize(bytes);
    return formatPrettyJson(parsed, Number(options.indent || 2));
  } catch (error) {
    throw new ApiError("INVALID_BSON", "Input does not contain valid BSON data", [
      { field: "input", issue: error instanceof Error ? error.message : "Invalid BSON payload" },
    ]);
  }
};
