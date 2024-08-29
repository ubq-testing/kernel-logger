# `@ubiquity-os/kernel-logger`

This package is an extension of `@ubiquity-dao/ubiquibot-logger` which adds built-in support for Supabase and telegram logging.

## Installation

```bash
npm install @ubiquity-os/kernel-logger
```

## Usage

```typescript
import { Logs } from "@ubiquity-os/kernel-logger";

const logs = new Logs(
  "info", // log level
  {
    client: supabaseClient, // Optionally pass a client
    supabaseUrl: "https://...", // Required if client is not passed
    supabaseKey: "key...", // Required if client is not passed
  },
  "start-stop-command", // name of plugin or kernel
  ["error", "fatal"] // log levels to post to supabase
);

logs.info("Hello, world!"); // not posted to supabase
logs.error("Something went wrong!"); // posted to supabase
```
