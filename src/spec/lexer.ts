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
        const spaces: string[] = [];

        while (true) {
            if (input.eof()) {
                return TOKEN("EOF");
            } else {
                let char = input.getChar();
                let char2 = input.getChar(2);
                let char4 = input.getChar(4);
                let char5 = input.getChar(5);
                let char6 = input.getChar(6);
                let char7 = input.getChar(7);
                let char8 = input.getChar(8);
                let char10 = input.getChar(10);
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
                    return TOKEN("Aste");
                } else if (char === "+") {
                    input.nextChar();
                    return TOKEN("Plus");
                } else if (char === "!") {
                    input.nextChar();
                    return TOKEN("Excl");
                } else if (char === "&") {
                    input.nextChar();
                    return TOKEN("Amp");
                } else if (char === "?") {
                    input.nextChar();
                    return TOKEN("Ques");
                } else if (char === "/") {
                    input.nextChar();
                    return TOKEN("Slash");
                } else if (char === ".") {
                    input.nextChar();
                    return TOKEN("Dot");
                } else if (char === "$") {
                    input.nextChar();
                    return TOKEN("Dollar");
                } else if (char2 === "=>") {
                    input.nextChar(2);
                    return TOKEN("Arrow");
                } else if (char === "=") {
                    input.nextChar();
                    return TOKEN("Equal");
                } else if (char === ";") {
                    input.nextChar();
                    return TOKEN("Semi");
                } else if (char === "{") {
                    input.nextChar();
                    return TOKEN("OpenBracket");
                } else if (char === "}") {
                    input.nextChar();
                    return TOKEN("CloseBracket");
                } else if (char === "(") {
                    input.nextChar();
                    return TOKEN("OpenParen");
                } else if (char === ")") {
                    input.nextChar();
                    return TOKEN("CloseParen");
                } else if (char6 === "parser") {
                    input.nextChar(6);
                    return TOKEN("Parser");
                } else if (char5 === "lexer") {
                    input.nextChar(5);
                    return TOKEN("Lexer");
                } else if (char7 === "ignored") {
                    input.nextChar(7);
                    return TOKEN("Ignored");
                } else if (char5 === "token") {
                    input.nextChar(5);
                    return TOKEN("Token");
                } else if (char10 === "expression") {
                    input.nextChar(10);
                    return TOKEN("Expression");
                } else if (char4 === "atom") {
                    input.nextChar(4);
                    return TOKEN("Atom");
                } else if (char6 === "prefix") {
                    input.nextChar(6);
                    return TOKEN("Prefix");
                } else if (char5 === "infix") {
                    input.nextChar(5);
                    return TOKEN("Infix");
                } else if (char7 === "postfix") {
                    input.nextChar(7);
                    return TOKEN("Postfix");
                } else if (char8 === "operator") {
                    input.nextChar(8);
                    return TOKEN("Operator");
                } else if (char5 === "group") {
                    input.nextChar(5);
                    return TOKEN("Group");
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
                    return TOKEN("Str", { value: buf });
                } else if (/^[a-z0-9]$/i.test(char)) {
                    let buf = "";
                    buf += char;
                    input.nextChar();
                    while (!input.eof() && /^[a-z0-9]$/i.test(input.getChar())) {
                        buf += input.getChar();
                        input.nextChar();
                    }
                    return TOKEN("Ident", { value: buf });
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

export function TOKEN(kind: TokenKind, opts?: { value?: string; leadingTrivia?: string; }): Token {
    opts = opts || {};
    return {
        kind,
        leadingTrivia: opts.leadingTrivia,
        value: opts.value,
    };
}

export type TokenKind = "EOF" | "Aste" | "Plus" | "Excl" | "Amp" | "Ques" | "Slash" | "Dot" | "Dollar" | "Arrow" |
    "Equal" | "Semi" | "OpenBracket" | "CloseBracket" | "OpenParen" | "CloseParen" | "Parser" | "Lexer" | "Ignored" |
    "Token" | "Expression" | "Atom" | "Prefix" | "Infix" | "Postfix" | "Operator" | "Group" | "Str" | "CharRange" | "Ident";

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
    if (kind === "Aste") return "`*`";
    if (kind === "Plus") return "`+`";
    if (kind === "Excl") return "`!`";
    if (kind === "Amp") return "`&`";
    if (kind === "Ques") return "`?`";
    if (kind === "Slash") return "`/`";
    if (kind === "Dot") return "`.`";
    if (kind === "Dollar") return "`$`";
    if (kind === "Arrow") return "`=>`";
    if (kind === "Equal") return "`=`";
    if (kind === "Semi") return "`;`";
    if (kind === "OpenBracket") return "`{`";
    if (kind === "CloseBracket") return "`}`";
    if (kind === "OpenParen") return "`(`";
    if (kind === "CloseParen") return "`)`";
    if (kind === "Parser") return "`parser`";
    if (kind === "Lexer") return "`lexer`";
    if (kind === "Ignored") return "`ignored`";
    if (kind === "Token") return "`token`";
    if (kind === "Expression") return "`expression`";
    if (kind === "Atom") return "`atom`";
    if (kind === "Prefix") return "`prefix`";
    if (kind === "Infix") return "`infix`";
    if (kind === "Postfix") return "`postfix`";
    if (kind === "Operator") return "`operator`";
    if (kind === "Group") return "`group`";
    if (kind === "Str" && value != null) return `\`"${value}"\``;
    if (kind === "Ident" && value != null) return `\`${value}\``;
    return kind;
}
