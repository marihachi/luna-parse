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

export class Lexer {
    input: Input;

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

    /** 現在のトークンを取得します。 */
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

    /** 現在のトークンに関連している値を取得します。 */
    getValue(offset: number = 0): string {
        const token = this.getToken(offset);
        if (token.value == null) {
            throw new Error("No token value");
        }
        return token.value;
    }

    /** 現在のトークンが指定した条件を満たしているかどうかを返します。 */
    match(kind: TokenKind, offset: number = 0): boolean {
        const current = this.getToken(offset);
        return current.kind === kind;
    }

    /** 次のトークンに進みます。 */
    forward(): Token {
        // 現在のトークンが既に読まれていれば、現在のトークンを破棄
        if (this.tokens.length > 0) {
            const token = this.tokens[0];
            this.tokens.splice(0, 1);
            return token;
        } else {
            throw new Error("No token read");
        }
    }

    /**
     * 現在のトークンが指定した条件を満たしていることを確認し、条件を満たしていれば次のトークンに進みます。
     * 条件を満たしていなければSyntaxErrorを生成します。
    */
    forwardWithExpect(kind: TokenKind): void {
        this.expect(kind);
        this.forward();
    }

    /**
     * 現在のトークンが指定した条件を満たしていることを確認します。
     * 条件を満たしていなければSyntaxErrorを生成します。
    */
    expect(kind: TokenKind, offset: number = 0): void {
        if (!this.match(kind, offset)) {
            this.throwSyntaxError(`Expected ${getTokenString({ kind })}, but got ${getTokenString({ token: this.getToken(offset) })}`);
        }
    }

    /** SyntaxErrorを生成します。 */
    throwSyntaxError(message: string): never {
        throw new Error(`${message} (${this.input.line}:${this.input.column})`);
    }

    private readToken(): Token {
        const input = this.input;

        while (true) {
            if (input.eof()) {
                return CreateToken(TOKEN.EOF);
            } else {
                let char = input.getChar();
                if (/^[a-z0-9]$/i.test(char)) {
                    let buf = "";
                    buf += char;
                    input.nextChar();
                    while (!input.eof() && /^[a-z0-9]$/i.test(input.getChar())) {
                        buf += input.getChar();
                        input.nextChar();
                    }
                    if (buf === "sub1") {
                        return CreateToken(TOKEN.Sub1);
                    } else if (buf === "sub2") {
                        return CreateToken(TOKEN.Sub2);
                    } else if (buf === "continued1") {
                        return CreateToken(TOKEN.Continued1);
                    } else if (buf === "continued2") {
                        return CreateToken(TOKEN.Continued2);
                    }
                }
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

export function CreateToken(kind: TokenKind, opts?: { value?: string; leadingTrivia?: string; }): Token {
    opts = opts || {};
    return {
        kind,
        leadingTrivia: opts.leadingTrivia,
        value: opts.value,
    };
}

export const TOKEN = {
    EOF: 0, Sub1: 1, Sub2: 2, Continued1: 3, Continued2: 4
} as const;
export type TokenKind = typeof TOKEN extends Record<string, infer V> ? V : never;

export type TokenSpecifier = {
    kind: TokenKind;
    token?: undefined;
} | {
    token: Token;
    kind?: undefined;
};

export function getTokenString(specifier: TokenSpecifier): string {
    let kind: TokenKind;
    let value: string | undefined;
    if (specifier.kind != null) {
        kind = specifier.kind;
    } else {
        kind = specifier.token.kind;
        value = specifier.token.value;
    }
    if (kind === TOKEN.EOF) return "EOF";
    if (kind === TOKEN.Sub1) return "`Sub1`";
    if (kind === TOKEN.Sub2) return "`Sub2`";
    if (kind === TOKEN.Continued1) return "`Continued1`";
    if (kind === TOKEN.Continued2) return "`Continued2`";
    return kind;
}
