export function parseCliOptions(args) {
  const options = {
    host: "127.0.0.1",
    port: 8931,
    upstreamUrl: "http://127.0.0.1:8932/mcp",
  };

  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    const value = args[index + 1];
    if (!["--host", "--port", "--upstream", "--audit-log"].includes(flag)) {
      throw new Error(`Unknown option: ${flag}`);
    }
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for ${flag}.`);
    }
    index += 1;

    if (flag === "--host") options.host = value;
    if (flag === "--upstream") options.upstreamUrl = value;
    if (flag === "--audit-log") options.auditLogPath = value;
    if (flag === "--port") {
      const port = Number(value);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("port must be an integer between 1 and 65535.");
      }
      options.port = port;
    }
  }
  return options;
}
