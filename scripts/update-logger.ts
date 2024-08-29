import { run } from "npm-check-updates";
import fs from "fs";
import semver from "semver";
import { writeFile } from "fs/promises";
import { exec } from "child_process";

const LOGGER = "@ubiquity-dao/ubiquibot-logger";

async function updateLogger() {
  const packageFile = "package.json";
  const packageJson = JSON.parse(fs.readFileSync(packageFile, "utf-8"));
  const currentVersion = packageJson.dependencies[LOGGER]

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
  let shouldUpdate = false;
  if (semver.major(latestVersion) > semver.major(currentVersion)) {
    console.warn(`Warning: Major version update available for ${LOGGER} (${currentVersion} -> ${latestVersion}).`);
    codeParts.push(`export const HAS_NEW_MAJOR_VERSION = true;\n`);
  } else if (semver.minor(latestVersion) > semver.minor(currentVersion) || semver.patch(latestVersion) > semver.patch(currentVersion)) {
    console.log(`Updating ${LOGGER} from version ${currentVersion} to ${latestVersion}.`);
    codeParts.push(`export const HAS_NEW_MAJOR_VERSION = false;\n`);
    await run({
      packageFile: packageFile,
      upgrade: true,
      silent: true,
      filter: `/${LOGGER}/`,
    });

    shouldUpdate = true;
  } else {
    console.log(`No updates found for ${LOGGER}.`);
    codeParts.push(`export const HAS_NEW_MAJOR_VERSION = false;\n`);
  }

  const code = codeParts.join("");
  await writeFile("src/logger-version.ts", code);

  if (shouldUpdate) {
    handleInstall();
  }
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

  if (manager === "yarn") {
    exec("yarn install");
  } else if (manager === "npm") {
    exec("npm install");
  } else if (manager === "pnpm") {
    exec("pnpm install");
  } else if (manager === "bun") {
    exec("bun install");
  } else {
    console.error("No lockfile found. Please run `yarn install` or `npm install`.");
  }
}

updateLogger().catch(console.error);
