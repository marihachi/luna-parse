// 字句解析 入力文字列をトークン列に変換する

export class Input {
    source: string;
    index: number;
    line: number;
    column: number;

    constructor(source: string) {
        this.source = source;
        this.index = 0;
        this.line = 1;
        this.column = 1;
    }

    eof(): boolean {
        return this.index >= this.source.length;
    }

    getChar(): string {
        if (this.eof()) {
            throw new Error("End of stream");
        }
        return this.source[this.index];
    }

    nextChar(): void {
        if (this.eof()) {
            throw new Error("End of stream");
        }
        if (this.getChar() === "\r") {
            // ignore CR
        } else if (this.getChar() === "\n") {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
        this.index++;
    }
}

export class Scan {
    input: Input;

    /** NOTE: undefindはEOFを表します。 */
    token: Token | undefined;

    constructor(source: string) {
        this.input = new Input(source);
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
