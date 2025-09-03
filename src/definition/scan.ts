import { Input } from "./input.js";

export class Scan {
    input: Input;

    /** NOTE: undefindはEOFを表します。 */
    token: Token | undefined;

    constructor(input: Input) {
        this.input = input;
        this.token = undefined;
        this.nextToken();
    }

    nextToken() {
        const input = this.input;

        // spaces
        while (!input.eof()) {
            const char = input.getChar();
            if (!(char === " " || char === "\r" || char === "\n" || char === "\t")) {
                break;
            }
        }

        if (!input.eof()) {
           this.token = nextTokenInner(this);
        } else {
            this.token = undefined;
        }
    }

    getToken(): Token {
        if (this.token === undefined) {
            return ["EOF"];
        }
        return this.token;
    }

    is(kind: string): boolean {
        const token = this.getToken();
        return token[0] === kind;
    }

    getValue(): string {
        const token = this.getToken();
        if (token.length < 2) {
            throw new Error("No token value");
        }
        return token[1]!;
    }

    throwIfNotExpected(expectedKind: TokenKind): void {
        if (!this.is(expectedKind)) {
            throw new Error(`Expected ${getTokenName(expectedKind)}, but got ${getTokenName(this.getToken()[0])}`);
        }
    }

    expect(expectedKind: TokenKind): void {
        this.throwIfNotExpected(expectedKind);
        this.nextToken();
    }
}

export type Token = [TokenKind] | [TokenKind, string];

export type TokenKind = "EOF" | "Equal" | "Slash" | "Word";

function nextTokenInner(s: Scan): Token {
    const input = s.input;
    let char = input.getChar();
    if (char === "=") {
        input.nextChar();
        return ["Equal"];
    } else if (char === "/") {
        input.nextChar();
        return ["Slash"];
    } else {
        let tokenValue = char;
        input.nextChar();
        while (!input.eof()) {
            tokenValue += input.getChar();
            input.nextChar();
        }
        return ["Word", tokenValue];
    }
}

export function getTokenName(kind: TokenKind): string {
    if (kind === "Equal") return '=';
    if (kind === "Slash") return '/';
    return kind;
}
