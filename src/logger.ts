import { Logs as Logger, LogLevel, LogReturn, Metadata } from "@ubiquity-dao/ubiquibot-logger";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { UBIQUIBOT_LOGGER_VERSION, HAS_NEW_MAJOR_VERSION } from "./logger-version";

export class Logs extends Logger {
  private _supabase: SupabaseClient;
  pluginName: string;

  constructor(level: LogLevel, supabaseUrl: string, supabaseKey: string, pluginName: string, levelsToLog: LogLevel[] = ["fatal"]) {
    super(level);
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not found");
    }
    this._supabase = createClient(supabaseUrl, supabaseKey);
    this.pluginName = pluginName;

    // Return a proxy and intercept calls for posting to Supabase
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        const origMethod = target[prop as keyof Logs];

        // we auto-update patch and minor versions
        if (HAS_NEW_MAJOR_VERSION) {
          this.info("Major version update available", { latestVersion: UBIQUIBOT_LOGGER_VERSION });
        }

        // Intercept the log methods which are in the levelsToLog array
        if (typeof origMethod === "function" && levelsToLog.includes(prop.toString().toLowerCase() as LogLevel)) {
          return (msg: string, metadata: Metadata) => {
            // Call the original method
            const result: LogReturn = origMethod.apply(target, [msg, metadata]);
            // Log to Supabase
            target._logToSupabase(result).catch(console.error);
            return result;
          };
        }
        // Default behavior for non-intercepted methods
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  private async _logToSupabase(log: LogReturn) {
    const { data, error } = await this._supabase.from("logs").insert([
      {
        log: log.logMessage.raw,
        level: log.logMessage.level,
        metadata: { ...log.metadata, caller: this.pluginName },
      },
    ]);
    // both are null if successful
    return error || data;
  }
}
