import fs from "node:fs";
import path from "node:path";
import { parse } from "./spec/parser.js";
import { inputLog, lexerLog, parserLog } from "./utils/logger.js";

// load
const resolvedPath = path.resolve("./debug/debug.luna");
let fileContent;
try {
    fileContent = fs.readFileSync(resolvedPath, { encoding: 'utf8' });
} catch (err) {
    throw new Error('Failed to load a spec file.');
}

// parserLog.enabled = true;
// lexerLog.enabled = true;
// inputLog.enabled = true;

const ast = parse(fileContent);
console.log(JSON.stringify(ast, null, "  "));
