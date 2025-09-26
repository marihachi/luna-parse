import { emit } from "./emit.js";
import { parse } from "./parser.js";
import { analyze } from "./analyze.js";

export function generateCode(specFile: string): string {
    const ast = parse(specFile);
    const irTree = analyze(ast);
    return emit(irTree);
}
