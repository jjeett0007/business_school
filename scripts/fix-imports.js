// scripts/fix-imports.js
import fs from "fs";
import path from "path";

function fixImports(dir) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
      continue;
    }
    if (!file.endsWith(".js")) continue;

    let content = fs.readFileSync(fullPath, "utf8");

    // Fix imports with 'from'
    content = content.replace(
      /import\s+([^\n]+?)\s+from\s+["'](\.\/.+?)["']/g,
      (_, a, b) => `import ${a} from "${b}.js"`
    );

    // Fix side-effect imports (without 'from')
    content = content.replace(
      /import\s+["'](\.\/.+?)["'];?/g,
      (_, b) => `import "${b}.js";`
    );

    fs.writeFileSync(fullPath, content);
  }
}

fixImports("dist");
