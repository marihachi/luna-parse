import { initInput } from "./input.js";
import { initParse, parse } from "./parse.js";
import { initScan } from "./scan.js";

function main() {
    const input = initInput("a = b");
    const s = initScan(input);
    const p = initParse(s);
    parse(p);
}
main();
