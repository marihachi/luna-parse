import { Input } from "./input.js";

export type TokenKind = "EOF" | "Equal" | "Slash" | "Word";
export type Token = [TokenKind] | [TokenKind, string];

export class Scan {
    input: Input;
    token: Token | undefined;

    constructor(input: Input) {
        this.input = input;
        this.token = undefined;
        this.nextToken();
    }

    nextToken() {
        const input = this.input;

        // skip spaces
        while (!input.eof()) {
            const char = input.getChar();
            if (!(char === " " || char === "\r" || char === "\n" || char === "\t")) {
                break;
            }
        }
        // トークンの種類を判別してセットする
        if (!input.eof()) {
            let char = input.getChar();
            if (char === "=") {
                input.nextChar();
                this.token = ["Equal"];
            } else if (char === "/") {
                input.nextChar();
                this.token = ["Slash"];
            } else {
                let tokenValue = char;
                input.nextChar();
                while (!input.eof()) {
                    tokenValue += input.getChar();
                    input.nextChar();
                }
                this.token = ["Word", tokenValue];
            }
        } else {
            this.token = undefined;
        }
    }

    getToken(): Token {
        // トークンがundefinedの場合はEOFとして扱う
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

export function getTokenName(kind: TokenKind): string {
    if (kind === "Equal") return '=';
    if (kind === "Slash") return '/';
    return kind;
}
