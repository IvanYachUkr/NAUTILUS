import assert from "node:assert/strict";
import test from "node:test";

import { parseCliOptions } from "../src/cli-options.js";

test("CLI options default to the documented loopback proxy topology", () => {
  assert.deepEqual(parseCliOptions([]), {
    host: "127.0.0.1",
    port: 8931,
    upstreamUrl: "http://127.0.0.1:8932/mcp",
  });
});

test("CLI options accept explicit ports and a loopback upstream", () => {
  assert.deepEqual(
    parseCliOptions([
      "--host",
      "localhost",
      "--port",
      "9031",
      "--upstream",
      "http://localhost:9032/mcp",
    ]),
    {
      host: "localhost",
      port: 9031,
      upstreamUrl: "http://localhost:9032/mcp",
    },
  );
});

test("CLI options accept an explicit benchmark audit-log path", () => {
  let options;
  assert.doesNotThrow(() => {
    options = parseCliOptions(["--audit-log", "C:\\benchmark\\run-1\\mcp-audit.jsonl"]);
  });
  assert.deepEqual(options, {
    host: "127.0.0.1",
    port: 8931,
    upstreamUrl: "http://127.0.0.1:8932/mcp",
    auditLogPath: "C:\\benchmark\\run-1\\mcp-audit.jsonl",
  });
});

test("CLI options reject unknown flags and invalid ports", () => {
  assert.throws(() => parseCliOptions(["--wat"]), /unknown option/i);
  assert.throws(() => parseCliOptions(["--port", "eight"]), /port/i);
});
