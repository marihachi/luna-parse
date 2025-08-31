import { Input, eof, getChar, nextChar } from "./input.js";

export type Token = {
    kind: string;
    value?: string;
};

export type Scan = {
    input: Input;
    token: Token | undefined;
};

export function initScan(input: Input): Scan {
    const s: Scan = {
        input,
        token: undefined,
    };
    nextToken(s);
    return s;
}

export function nextToken(self: Scan): void {
    // skip spaces
    while (!eof(self.input)) {
        const char = getChar(self.input);
        if (!(char === " " || char === "\r" || char === "\n" || char === "\t")) {
            break;
        }
    }
    // トークンの種類を判別してセットする
    if (!eof(self.input)) {
        let char = getChar(self.input);
        if (char === "=") {
            nextChar(self.input);
            self.token = { kind: "=" };
        } else if (char === "/") {
            nextChar(self.input);
            self.token = { kind: "/" };
        } else {
            let tokenValue = char;
            nextChar(self.input);
            while (!eof(self.input)) {
                tokenValue += char;
                nextChar(self.input);
            }
            self.token = { kind: "word", value: tokenValue };
        }
    } else {
        self.token = undefined;
    }
}

export function getToken(self: Scan): Token {
    // トークンがundefinedの場合はEOFとして扱う
    if (self.token === undefined) {
        return { kind: "EOF" };
    }
    return self.token;
}

export function is(self: Scan, kind: string): boolean {
    const token = getToken(self);
    return token.kind === kind;
}

export function getValue(self: Scan): string | undefined {
    const token = getToken(self);
    return token.kind === "word" ? token.value : undefined;
}

export function throwIfNotExpected(self: Scan, expectedKind: string): void {
    if (!is(self, expectedKind)) {
        throw new Error(`Expected ${expectedKind}, but got ${getToken(self).kind}`);
    }
}

export function expect(self: Scan, kind: string): void {
    throwIfNotExpected(self, kind);
    nextToken(self);
}
