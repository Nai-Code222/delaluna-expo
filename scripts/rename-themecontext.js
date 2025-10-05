const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

// Step 1: Rename file
const oldPath = path.join(projectRoot, "app", "themecontext.tsx");
const newPath = path.join(projectRoot, "app", "ThemeContext.tsx");

if (fs.existsSync(oldPath)) {
  fs.renameSync(oldPath, newPath);
  console.log(`✅ Renamed: themecontext.tsx → ThemeContext.tsx`);
} else {
  console.log("⚠️ themecontext.tsx not found in app/");
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
    let updated = content.replace(/(['"])\.\/themecontext\1/g, '$1./ThemeContext$1');

    // fix alias imports
    updated = updated.replace(/(['"])@\/app\/themecontext\1/g, '$1@/app/ThemeContext$1');

    if (updated !== content) {
      fs.writeFileSync(file, updated, "utf8");
      console.log(`🔄 Updated import in ${file}`);
    }
  }
});

console.log("🎉 Done! File renamed + imports fixed");
