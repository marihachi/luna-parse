import { emit } from "./emit.js";
import { parse } from "./parse.js";
import { lowering } from "./lowering.js";

export function generateCode(specFile: string): string {
    parse(specFile);
    lowering();
    return emit();
}
