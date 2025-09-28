// 字句解析 入力文字列をトークン列に変換する

// lexer for luna-parse spec

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
        const spaces: string[] = [];

        while (true) {
            if (input.eof()) {
                return CreateToken(TOKEN.EOF);
            } else {
                let char = input.getChar();
                let char2 = input.getChar(2);
                if (char2 === "\r\n") {
                    input.nextChar(2);
                    spaces.push(char2);
                    continue;
                } else if (["\r", "\n"].includes(char)) {
                    input.nextChar();
                    spaces.push(char);
                    continue;
                } else if ([" ", "\t"].includes(char)) {
                    input.nextChar();
                    spaces.push(char);
                    continue;
                } else if (char === "*") {
                    input.nextChar();
                    return CreateToken(TOKEN.Aste);
                } else if (char === "+") {
                    input.nextChar();
                    return CreateToken(TOKEN.Plus);
                } else if (char === "!") {
                    input.nextChar();
                    return CreateToken(TOKEN.Excl);
                } else if (char === "&") {
                    input.nextChar();
                    return CreateToken(TOKEN.Amp);
                } else if (char === "?") {
                    input.nextChar();
                    return CreateToken(TOKEN.Ques);
                } else if (char === "/") {
                    input.nextChar();
                    return CreateToken(TOKEN.Slash);
                } else if (char === ".") {
                    input.nextChar();
                    return CreateToken(TOKEN.Dot);
                } else if (char === "$") {
                    input.nextChar();
                    return CreateToken(TOKEN.Dollar);
                } else if (char2 === "=>") {
                    input.nextChar(2);
                    return CreateToken(TOKEN.Arrow);
                } else if (char === "=") {
                    input.nextChar();
                    return CreateToken(TOKEN.Equal);
                } else if (char === ";") {
                    input.nextChar();
                    return CreateToken(TOKEN.Semi);
                } else if (char === "{") {
                    input.nextChar();
                    return CreateToken(TOKEN.OpenBracket);
                } else if (char === "}") {
                    input.nextChar();
                    return CreateToken(TOKEN.CloseBracket);
                } else if (char === "(") {
                    input.nextChar();
                    return CreateToken(TOKEN.OpenParen);
                } else if (char === ")") {
                    input.nextChar();
                    return CreateToken(TOKEN.CloseParen);
                } else if (/^[a-z0-9]$/i.test(char)) {
                    let buf = "";
                    buf += char;
                    input.nextChar();
                    while (!input.eof() && /^[a-z0-9]$/i.test(input.getChar())) {
                        buf += input.getChar();
                        input.nextChar();
                    }
                    if (buf === "parser") {
                        return CreateToken(TOKEN.Parser);
                    } else if (buf === "lexer") {
                        return CreateToken(TOKEN.Lexer);
                    } else if (buf === "ignored") {
                        return CreateToken(TOKEN.Ignored);
                    } else if (buf === "token") {
                        return CreateToken(TOKEN.Token);
                    } else if (buf === "expression") {
                        return CreateToken(TOKEN.Expression);
                    } else if (buf === "atom") {
                        return CreateToken(TOKEN.Atom);
                    } else if (buf === "prefix") {
                        return CreateToken(TOKEN.Prefix);
                    } else if (buf === "infix") {
                        return CreateToken(TOKEN.Infix);
                    } else if (buf === "postfix") {
                        return CreateToken(TOKEN.Postfix);
                    } else if (buf === "operator") {
                        return CreateToken(TOKEN.Operator);
                    } else if (buf === "group") {
                        return CreateToken(TOKEN.Group);
                    } else {
                        return CreateToken(TOKEN.Ident, { value: buf });
                    }
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
                    return CreateToken(TOKEN.Str, { value: buf });
                } else if (char === "[") {
                    // TODO: CharRange
                    this.throwSyntaxError(`unexpected char '${char}'`);
                } else {
                    this.throwSyntaxError(`unexpected char '${char}'`);
                }
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
    EOF: 0, Aste: 1, Plus: 2, Excl: 3, Amp: 4, Ques: 5, Slash: 6, Dot: 7, Dollar: 8, Arrow: 9,
    Equal: 10, Semi: 11, OpenBracket: 12, CloseBracket: 13, OpenParen: 14, CloseParen: 15, Parser: 16, Lexer: 17, Ignored: 18, Token: 19,
    Expression: 20, Atom: 21, Prefix: 22, Infix: 23, Postfix: 24, Operator: 25, Group: 26, Str: 27, CharRange: 28, Ident: 29
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
    if (kind === TOKEN.Aste) return "`*`";
    if (kind === TOKEN.Plus) return "`+`";
    if (kind === TOKEN.Excl) return "`!`";
    if (kind === TOKEN.Amp) return "`&`";
    if (kind === TOKEN.Ques) return "`?`";
    if (kind === TOKEN.Slash) return "`/`";
    if (kind === TOKEN.Dot) return "`.`";
    if (kind === TOKEN.Dollar) return "`$`";
    if (kind === TOKEN.Arrow) return "`=>`";
    if (kind === TOKEN.Equal) return "`=`";
    if (kind === TOKEN.Semi) return "`;`";
    if (kind === TOKEN.OpenBracket) return "`{`";
    if (kind === TOKEN.CloseBracket) return "`}`";
    if (kind === TOKEN.OpenParen) return "`(`";
    if (kind === TOKEN.CloseParen) return "`)`";
    if (kind === TOKEN.Parser) return "`parser`";
    if (kind === TOKEN.Lexer) return "`lexer`";
    if (kind === TOKEN.Ignored) return "`ignored`";
    if (kind === TOKEN.Token) return "`token`";
    if (kind === TOKEN.Expression) return "`expression`";
    if (kind === TOKEN.Atom) return "`atom`";
    if (kind === TOKEN.Prefix) return "`prefix`";
    if (kind === TOKEN.Infix) return "`infix`";
    if (kind === TOKEN.Postfix) return "`postfix`";
    if (kind === TOKEN.Operator) return "`operator`";
    if (kind === TOKEN.Group) return "`group`";
    if (kind === TOKEN.Str && value != null) return `\`"${value}"\``;
    if (kind === TOKEN.CharRange && value != null) return `[${value}]`;
    if (kind === TOKEN.Ident && value != null) return `\`${value}\``;
    if (kind === TOKEN.Str) return `Str`;
    if (kind === TOKEN.CharRange) return `CharRange`;
    if (kind === TOKEN.Ident) return `Ident`;
    return kind;
}
