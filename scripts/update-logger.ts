import { run } from "npm-check-updates";
import fs from "fs";
import semver from "semver";
import { writeFile } from "fs/promises";
import { exec } from "child_process";

const LOGGER = "@ubiquity-dao/ubiquibot-logger";

/**
 * Check if there are updates for the logger package
 * and update the logger version in the project.
 */

async function updateLogger() {
  const packageFile = "package.json";
  const packageJson = JSON.parse(fs.readFileSync(packageFile, "utf-8"));
  const currentVersion = packageJson.dependencies[LOGGER];

  if (!currentVersion) {
    console.error(`Package ${LOGGER} is not listed in dependencies.`);
    return;
  }

  const upgraded = await run({
    packageFile: `${packageFile}`,
    upgrade: false, // Don't upgrade yet, just get the latest version info for the logs
    silent: true,
    filter: `/${LOGGER}/`,
  });

  if (!upgraded) {
    console.error("No updates found.");
    return;
  }

  let latestVersion;

  if (Object.keys(upgraded).length > 0 && LOGGER in upgraded) {
    latestVersion = upgraded[LOGGER];
  }

  if (!latestVersion) {
    console.error(`No updates found for ${LOGGER}.`);
    return;
  }

  const codeParts = [`export const UBIQUIBOT_LOGGER_VERSION = "${latestVersion}";\n`];

  if (semver.major(latestVersion) > semver.major(currentVersion)) {
    console.warn(`Warning: Major version update available for ${LOGGER} (${currentVersion} -> ${latestVersion}).`);
    codeParts.push(createHasNewVariable(true));
  } else if (semver.minor(latestVersion) > semver.minor(currentVersion) || semver.patch(latestVersion) > semver.patch(currentVersion)) {
    console.log(`Updating ${LOGGER} from version ${currentVersion} to ${latestVersion}.`);
    codeParts.push(createHasNewVariable(false));

    await run({
      packageFile: packageFile,
      upgrade: true,
      silent: true,
      filter: `/${LOGGER}/`,
    });

    handleInstall().catch(console.error);
  } else {
    console.log(`No updates found for ${LOGGER}.`);
    codeParts.push(createHasNewVariable(false));
  }

  const code = codeParts.join("");
  await writeFile("src/logger-version.ts", code);
}

function createHasNewVariable(hasNewMajorVersion: boolean) {
  return `// eslint-disable-next-line @typescript-eslint/naming-convention
export const HAS_NEW_MAJOR_VERSION = ${hasNewMajorVersion};`;
}
async function handleInstall() {
  let manager = "yarn";

  // find any lockfile
  if (fs.existsSync("yarn.lock")) {
    manager = "yarn";
  } else if (fs.existsSync("package-lock.json")) {
    manager = "npm";
  } else if (fs.existsSync("pnpm-lock.yaml")) {
    manager = "pnpm";
  } else if (fs.existsSync("bun.lockb")) {
    manager = "bun";
  }

  switch (manager) {
    case "yarn":
      exec("yarn install");
      break;
    case "npm":
      exec("npm install");
      break;
    case "pnpm":
      exec("pnpm install");
      break;
    case "bun":
      exec("bun install");
      break;
    default:
      return;
  }
}

updateLogger().catch(console.error);
