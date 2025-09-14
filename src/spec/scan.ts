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

    initialize(source: string) {
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
        this.input = new Input(source);
        this.tokens = [];
    }

    initialize(source: string) {
        this.input.initialize(source);
        this.tokens.length = 0;
    }

    getToken(offset: number = 0): Token {
        // 指定位置のトークンまで読まれてなければ読み取る
        while (this.tokens.length <= offset) {
            const token = this.readToken();
            // logger.print(`token ${token.kind} ${token.value}`);
            this.tokens.push(token);
        }
        // 指定位置のトークンを返す
        const resultToken = this.tokens[offset];
        return resultToken;
    }

    getValue(offset: number = 0): string {
        const token = this.getToken(offset);
        if (token.value == null) {
            throw new Error("No token value");
        }
        return token.value;
    }

    /** 現在のトークンが指定した条件のトークンであるかを返す */
    match(token: TokenSpecifier, offset: number = 0): boolean {
        const current = this.getToken(offset);
        if (token.kind != null) {
            return current.kind === token.kind;
        } else if (token.word != null) {
            return current.kind === "Word" && current.value === token.word;
        } else {
            return current.kind === token.token.kind && current.value === token.token.value;
        }
    }

    /** 次に進む */
    forward(): void {
        // 現在のトークンが既に読まれていれば、現在のトークンを破棄
        if (this.tokens.length > 0) {
            this.tokens.splice(0, 1);
        }
    }

    /** 期待した条件のトークンであるかを確認して次に進む */
    forwardWithExpect(token: TokenSpecifier): void {
        this.expect(token);
        this.forward();
    }

    /** 期待したトークンであるかを確認する */
    expect(token: TokenSpecifier, offset: number = 0): void {
        if (!this.match(token, offset)) {
            const current: TokenSpecifier = { token: this.getToken(offset) };
            this.throwSyntaxError(`Expected ${getTokenString(token)}, but got ${getTokenString(current)}`);
        }
    }

    throwSyntaxError(message: string): never {
        throw new Error(`${message} (${this.input.line}:${this.input.column})`);
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
            } else {
                break;
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
                return TOKEN("Pipe");
            } else if (char === "*") {
                input.nextChar();
                return TOKEN("Asterisk");
            } else if (char === "+") {
                input.nextChar();
                return TOKEN("Plus");
            } else if (char === "!") {
                input.nextChar();
                return TOKEN("Exclam");
            } else if (char === "?") {
                input.nextChar();
                return TOKEN("Question");
            } else if (char === "{") {
                input.nextChar();
                return TOKEN("OpenBracket");
            } else if (char === "}") {
                input.nextChar();
                return TOKEN("CloseBracket");
            } else if (/^[a-z0-9]$/i.test(char)) {
                let buf = "";
                buf += char;
                input.nextChar();
                while (!input.eof() && /^[a-z0-9]$/i.test(input.getChar())) {
                    buf += input.getChar();
                    input.nextChar();
                }
                return TOKEN("Word", { value: buf });
            } else if (char === "\"") {
                let buf = "";
                input.nextChar();
                while (!input.eof()) {
                    if (input.getChar() === "\"") break;
                    buf += input.getChar();
                    input.nextChar();
                }
                if (!input.eof()) {
                    input.nextChar();
                }
                return TOKEN("String", { value: buf });
            } else {
                this.throwSyntaxError(`unexpected char '${char}'`);
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

export type TokenKind = "EOF" | "Equal" | "Pipe" | "Asterisk" | "Plus" | "Exclam" | "Question" | "OpenBracket" | "CloseBracket" | "Word" | "String";

export type TokenSpecifier = {
    kind: TokenKind;
    word?: undefined;
    token?: undefined;
} | {
    word: string;
    kind?: undefined;
    token?: undefined;
} | {
    token: Token;
    kind?: undefined;
    word?: undefined;
};

export function getTokenString(specifier: TokenSpecifier): string {
    let kind: TokenKind;
    let value: string | undefined;
    if (specifier.kind != null) {
        kind = specifier.kind;
    } else if (specifier.word != null) {
        kind = "Word";
        value = specifier.word;
    } else {
        kind = specifier.token.kind;
        value = specifier.token.value;
    }
    if (kind === "Equal") return "`=`";
    if (kind === "Pipe") return "`|`";
    if (kind === "Asterisk") return "`*`";
    if (kind === "Plus") return "`+`";
    if (kind === "Exclam") return "`!`";
    if (kind === "Question") return "`?`";
    if (kind === "OpenBracket") return "`{`";
    if (kind === "CloseBracket") return "`}`";
    if (kind === "Word" && value != null) return `\`${value}\``;
    if (kind === "String") return `\`"${value}"\``;
    return kind;
}
