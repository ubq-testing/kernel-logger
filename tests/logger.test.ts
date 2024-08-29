import { Logs } from "../src";

jest.mock("@supabase/supabase-js", () => {
  return {
    createClient: jest.fn(),
  };
});

const supabaseConfig = {
  supabaseUrl: "supabaseUrl",
  supabaseKey: "supabaseKey",
};

describe("Logs", () => {
  let logs: Logs;

  beforeEach(() => {
    logs = new Logs("info", supabaseConfig, "pluginName");
  });

  it("should create an instance of Logs", () => {
    expect(logs).toBeInstanceOf(Logs);
  });

  it("should throw an error if Supabase credentials are not provided", () => {
    expect(() => {
      new Logs(
        "info",
        {
          supabaseKey: "",
          supabaseUrl: "",
        },
        "pluginName"
      );
    }).toThrow("Supabase credentials not found");
  });

  it("should log to Supabase on fatal by default", () => {
    const logMessage = "Test log message";
    const metadata = { key: "value" };

    logs["_logToSupabase"] = jest.fn(async () => Promise.resolve(null));

    logs.error(logMessage, metadata);
    const logReturn = logs.fatal(logMessage, metadata);

    expect(logs["_logToSupabase"]).toHaveBeenCalledWith(expect.objectContaining(logReturn));
    expect(logs["_logToSupabase"]).toHaveBeenCalledTimes(1);
  });

  it("should log to Supabase on any defined levels", () => {
    logs = new Logs("info", supabaseConfig, "pluginName", ["info", "debug", "verbose", "error"]);
    const logMessage = "Test log message";
    const metadata = { key: "value" };

    logs["_logToSupabase"] = jest.fn(async () => Promise.resolve(null));

    logs.info(logMessage, metadata);
    logs.debug(logMessage, metadata);
    logs.verbose(logMessage, metadata);
    const logReturn = logs.error(logMessage, metadata);

    expect(logs["_logToSupabase"]).toHaveBeenCalledWith(expect.objectContaining(logReturn));

    expect(logs["_logToSupabase"]).toHaveBeenCalledTimes(4);
  });
});
