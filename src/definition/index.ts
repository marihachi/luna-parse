import { Input } from "./input.js";
import { parse } from "./parse.js";
import { Scan } from "./scan.js";

function main() {
    const input = new Input("a = b");
    const scan = new Scan(input);
    parse(scan);
}
main();
