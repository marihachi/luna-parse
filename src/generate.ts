import fs from "node:fs";
import path from "node:path";
import { generateCode } from "./spec/index.js";

// load
const resolvedPath = path.resolve("./debug/debug.luna");
let fileContent;
try {
    fileContent = fs.readFileSync(resolvedPath, { encoding: 'utf8' });
} catch (err) {
    throw new Error('Failed to load a spec file.');
}

const code = generateCode(fileContent);

console.log(code);
