import { emit } from "./emit.js";
import { parse } from "./parse.js";
import { lowering } from "./lowering.js";

function main(): void {
    parse("a = b");
    lowering();
    emit();
}
main();
