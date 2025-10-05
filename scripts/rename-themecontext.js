const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

// Step 1: Rename file
const oldPath = path.join(projectRoot, "app", "theme-context.tsx");
const newPath = path.join(projectRoot, "app", "theme-context.tsx");

if (fs.existsSync(oldPath)) {
  fs.renameSync(oldPath, newPath);
  console.log(`✅ Renamed: theme-context.tsx → theme-context.tsx`);
} else {
  console.log("⚠️ theme-context.tsx not found in app/");
}

// Step 2: Update imports
function walk(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk(projectRoot, (file) => {
  if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js")) {
    let content = fs.readFileSync(file, "utf8");

    // fix relative imports
    let updated = content.replace(/(['"])\.\/theme-context\1/g, '$1./theme-context$1');

    // fix alias imports
    updated = updated.replace(/(['"])@\/app\/theme-context\1/g, '$1@/app/theme-context$1');

    if (updated !== content) {
      fs.writeFileSync(file, updated, "utf8");
      console.log(`🔄 Updated import in ${file}`);
    }
  }
});

console.log("🎉 Done! File renamed + imports fixed");
