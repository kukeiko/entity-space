import { execSync } from "child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const DIST_DIR = "dist";
const isDryRun = process.argv.includes("--dry-run");

function publishPackage(pkgDir) {
    const fullPath = join(DIST_DIR, pkgDir);
    const pkgJsonPath = join(fullPath, "package.json");

    if (!existsSync(pkgJsonPath)) {
        console.warn(`⚠️ Skipping ${pkgDir}: no package.json found`);
        return;
    }

    const pkgJson = JSON.parse(readFileSync(pkgJsonPath, "utf8"));

    try {
        if (isDryRun) {
            console.log(`🧪 [Dry Run] Would publish ${pkgJson.name}@${pkgJson.version}`);
        } else {
            console.log(`📦 Publishing ${pkgJson.name}@${pkgJson.version}...`);
            execSync("npm publish --tag=latest --access public", {
                cwd: fullPath,
                stdio: "inherit",
            });
            console.log(`✅ Published ${pkgJson.name}@${pkgJson.version}`);
        }
    } catch (err) {
        console.error(`❌ Failed to publish ${pkgJson.name}@${pkgJson.version}:`, err.message);
    }
}

function main() {
    if (!existsSync(DIST_DIR)) {
        console.error(`❌ dist directory not found at ${DIST_DIR}`);
        process.exit(1);
    }

    const dirs = readdirSync(DIST_DIR).filter(name => {
        const fullPath = join(DIST_DIR, name);
        return statSync(fullPath).isDirectory();
    });

    if (isDryRun) {
        console.log("🧪 Running in dry-run mode — no packages will be actually published.\n");
    }

    for (const dir of dirs) {
        publishPackage(dir);
    }
}

main();
