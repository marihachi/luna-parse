import { Scan, expect, getValue, is, nextToken, throwIfNotExpected } from "./scan.js";

export type Parse = {
    s: Scan;
};

export function initParse(s: Scan): Parse {
    const p: Parse = {
        s,
    };
    return p;
}

export function parse(p: Parse): void {
    const { s } = p;

    throwIfNotExpected(s, "word");
    const left = getValue(s);
    nextToken(s);

    expect(s, "'='");

    throwIfNotExpected(s, "word");
    const right = getValue(s);
    nextToken(s);
}
