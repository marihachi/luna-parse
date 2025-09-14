import fs from "node:fs";
import path from "node:path";
import { parse } from "./spec/parse.js";

// load
const resolvedPath = path.resolve("./debug/debug.spec");
let fileContent;
try {
    fileContent = fs.readFileSync(resolvedPath, { encoding: 'utf8' });
} catch (err) {
    throw new Error('Failed to load a spec file.');
}

console.log(JSON.stringify(parse(fileContent), null, "  "));
