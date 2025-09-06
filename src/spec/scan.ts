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

    getChar(length: number = 1): string {
        if (this.eof()) {
            throw new Error("End of stream");
        }
        return this.source.slice(this.index, this.index + length);
    }

    nextChar(length: number = 1): void {
        while (length > 0) {
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
            length--;
        }
    }
}

export class Scan {
    private input: Input;

    // tokens[0]には現在のトークンを格納
    // tokens[1]以降には先読み済みのトークンを格納
    tokens: Token[];

    constructor(source: string) {
        this.initialize(source);
    }

    initialize(source: string) {
        this.input = new Input(source);
        this.tokens = [];
    }

    forwardExpect(expectedToken: TokenKind): void {
        this.throwIfNotExpected(expectedToken);
        this.forward();
    }

    throwIfNotExpected(expectedKind: TokenKind): void {
        if (!this.is(expectedKind)) {
            throw new Error(`Expected ${getTokenString({ kind: expectedKind })}, but got ${getTokenString(this.getToken())}`);
        }
    }

    forward(): void {
        // 現在のトークンが既に読まれていれば、現在のトークンを破棄
        if (this.tokens.length > 0) {
            this.tokens.splice(0, 1);
        }
    }

    getToken(offset: number = 0): Token {
        // 指定位置のトークンまで読まれてなければ読み取る
        while (this.tokens.length <= offset) {
            this.tokens.push(this.readToken());
        }
        // 指定位置のトークンを返す
        return this.tokens[offset];
    }

    getValue(offset: number = 0): string {
        const token = this.getToken(offset);
        if (token.value == null) {
            throw new Error("No token value");
        }
        return token.value;
    }

    is(kind: TokenKind, offset: number = 0): boolean {
        const token = this.getToken(offset);
        return token.kind === kind;
    }

    isWord(word: string, offset: number = 0): boolean {
        const token = this.getToken(offset);
        return token.kind === "Word" && token.value === word;
    }

    forwardExpectWord(expectedWord: string): void {
        this.throwIfNotExpectedWord(expectedWord);
        this.forward();
    }

    throwIfNotExpectedWord(expectedWord: string): void {
        if (!this.isWord(expectedWord)) {
            throw new Error(`Expected ${getTokenString({ value: expectedWord })}, but got ${getTokenString(this.getToken())}`);
        }
    }

    private readToken(): Token {
        const input = this.input;

        // スペース用のキューにスペースをすべて読む
        const spaces: string[] = [];
        while (!this.input.eof()) {
            if ("\r\n" === input.getChar(2)) {
                spaces.push("\r\n");
                input.nextChar(2);
            } else if (["\r", "\n"].includes(input.getChar())) {
                spaces.push(input.getChar());
                input.nextChar();
            } else if ([" ", "\t"].includes(input.getChar())) {
                spaces.push(input.getChar());
                input.nextChar();
            }
        }

        if (input.eof()) {
            return TOKEN("EOF");
        } else {
            let char = input.getChar();
            if (char === "=") {
                input.nextChar();
                return TOKEN("Equal");
            } else if (char === "|") {
                input.nextChar();
                return TOKEN("Or");
            } else {
                let tokenValue = char;
                input.nextChar();
                while (!input.eof()) {
                    tokenValue += input.getChar();
                    input.nextChar();
                }
                return TOKEN("Word", { value: tokenValue });
            }
        }
    }
}

export type Token = {
    kind: TokenKind;
    leadingTrivia?: string;
    value?: string;
};

export function TOKEN(kind: TokenKind, opts?: { value?: string; leadingTrivia?: string; }): Token {
    opts = opts || {};
    return {
        kind,
        leadingTrivia: opts.leadingTrivia,
        value: opts.value,
    };
}

export type TokenKind = "EOF" | "Equal" | "Or" | "Word";

type TokenKindSpecifier = {
    kind?: TokenKind;
    value?: string;
};

export function getTokenString(specifier: TokenKindSpecifier): string {
    let kind: TokenKind;
    let value: string | undefined;
    if (specifier.value) {
        kind = "Word";
        value = specifier.value;
    } else if (specifier.kind) {
        kind = specifier.kind;
    } else {
        throw new Error("invalid arguments");
    }
    if (kind === "Equal") return "'='";
    if (kind === "Or") return "'|'";
    if (kind === "Word" && value != null) return `'${value}'`;
    return kind;
}
