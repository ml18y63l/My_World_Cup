// Reusable parser: dump every cell of each sheet of a squad Excel.
// Usage: node scripts/parse-squad-xlsx.js <path-to-xlsx>
// Unzips the xlsx (zip+XML) and prints rows as [cell][cell]... per sheet.
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const xlsxPath = process.argv[2];
if (!xlsxPath) {
  console.error("Usage: node scripts/parse-squad-xlsx.js <path-to-xlsx>");
  process.exit(1);
}

const tmpDir = path.join(".tmp_xlsx_parse");
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });
execSync(`unzip -o "${path.resolve(xlsxPath)}" -d "${tmpDir}"`, { stdio: "ignore" });

const xl = path.join(tmpDir, "xl");
const ssRaw = fs.readFileSync(path.join(xl, "sharedStrings.xml"), "utf-8");
const ss = [];
for (const m of ssRaw.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
  ss.push([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join(""));
}

// sheet name order from workbook.xml
const wbRaw = fs.readFileSync(path.join(xl, "workbook.xml"), "utf-8");
const sheetNames = [...wbRaw.matchAll(/<sheet name="([^"]+)"/g)].map((x) => x[1]);

const colNum = (l) => {
  let n = 0;
  for (const c of l) n = n * 26 + (c.charCodeAt(0) - 64);
  return n;
};

function parseSheet(sheetFile) {
  const xml = fs.readFileSync(path.join(xl, "worksheets", sheetFile), "utf-8");
  const rows = {};
  for (const c of xml.matchAll(
    /<c r="([A-Z]+)(\d+)"(?:[^>]*?t="([^"]+)")?[^>]*>(?:<v>([\s\S]*?)<\/v>|<is><t[^>]*>([\s\S]*?)<\/t><\/is>)?<\/c>/g
  )) {
    const col = colNum(c[1]);
    const row = parseInt(c[2], 10);
    const t = c[3];
    const v = c[4];
    const inline = c[5];
    let val;
    if (inline !== undefined) val = inline;
    else if (t === "s") val = ss[parseInt(v, 10)];
    else if (t === "str") val = v;
    else val = v;
    if (val !== undefined) {
      rows[row] = rows[row] || {};
      rows[row][col] = val;
    }
  }
  return rows;
}

sheetNames.forEach((name, i) => {
  const rows = parseSheet(`sheet${i + 1}.xml`);
  console.log(`\n===== SHEET ${i + 1}: ${name} =====`);
  for (const r of Object.keys(rows).map(Number).sort((a, b) => a - b)) {
    const cols = Object.keys(rows[r]).map(Number).sort((a, b) => a - b);
    console.log(`R${r}: ` + cols.map((c) => `[${String(rows[r][c]).replace(/\n/g, " ")}]`).join(" "));
  }
});

fs.rmSync(tmpDir, { recursive: true, force: true });
