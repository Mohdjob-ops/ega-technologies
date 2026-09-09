import { execFileSync, spawnSync } from "node:child_process";

const projectRoot = process.cwd();

function git(args) {
  return execFileSync("git", args, {
    cwd: projectRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function printStatus() {
  const status = git(["status", "--short"]);
  if (status) {
    console.error("Uncommitted changes detected:");
    console.error(status);
  } else {
    console.log("Working tree is clean.");
  }
}

let hasUncommittedChanges = false;
let hasUnpushedChanges = false;

try {
  hasUncommittedChanges = Boolean(git(["status", "--porcelain"]));
  printStatus();

  const tracking = git(["rev-list", "--left-right", "--count", "HEAD...@{u}"]);
  const [ahead, behind] = tracking.split(/\s+/).map(Number);
  hasUnpushedChanges = ahead > 0;
  console.log(`Remote sync: ${ahead} commit(s) to push, ${behind} commit(s) to pull.`);
} catch (error) {
  console.error("Could not inspect Git synchronization state.");
  console.error(error.message);
  process.exitCode = 1;
}

console.log("Running TypeScript check...");
const typecheck = spawnSync("npm", ["run", "typecheck"], {
  cwd: projectRoot,
  stdio: "inherit",
});
if (typecheck.status !== 0) {
  console.error("TypeScript check failed. Finish-work stopped.");
  process.exitCode = typecheck.status || 1;
}

console.log("Before closing VS Code or shutting down the Mac:");
console.log("- Synchronize the completed commit with GitHub main.");
console.log("- Confirm the connected Vercel project deploys that commit to production.");
console.log("- Verify https://ega-technologies.vercel.app and the Assistant & E8 Activity flow.");
console.log("- This command never installs a shutdown hook or shuts down the computer.");

if (hasUncommittedChanges || hasUnpushedChanges) {
  console.error("Finish-work stopped: commit and push all intended changes, then run it again.");
  process.exitCode = 1;
}