import { inputLog, lexerLog, parserLog } from "../utils/logger.js";

// 字句解析 入力文字列をトークン列に変換する

// lexer for luna-parse spec

export const TOKEN = {
    EOF: 0, Aste: 1, Plus: 2, Excl: 3, Amp: 4, Ques: 5, Slash: 6, Dot: 7, Dollar: 8, Arrow: 9,
    Equal: 10, Semi: 11, OpenBracket: 12, CloseBracket: 13, OpenParen: 14, CloseParen: 15, Parser: 16, Lexer: 17, Ignored: 18, Token: 19,
    Expression: 20, Atom: 21, Prefix: 22, Infix: 23, Postfix: 24, Operator: 25, Group: 26, Str: 27, CharRange: 28, Ident: 29
} as const;
export type TokenKind = typeof TOKEN extends Record<string, infer V> ? V : never;

export type Token = {
    kind: TokenKind;
    leadingTrivia?: string;
    value?: string;
};

export function createToken(kind: TokenKind, opts?: { value?: string; leadingTrivia?: string; }): Token {
    opts = opts || {};
    return {
        kind,
        leadingTrivia: opts.leadingTrivia,
        value: opts.value,
    };
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
        parserLog.print("getToken");
        parserLog.enter();
        // 指定位置のトークンまで読まれてなければ読み取る
        while (this.tokens.length <= offset) {
            const token = this.readToken();
            this.tokens.push(token);
        }
        // 指定位置のトークンを返す
        const resultToken = this.tokens[offset];
        parserLog.leave();
        return resultToken;
    }

    /** 現在のトークンに関連している値を取得します。 */
    getValue(offset: number = 0): string {
        parserLog.print("getValue");
        parserLog.enter();
        const token = this.getToken(offset);
        if (token.value == null) {
            throw new Error("No token value");
        }
        parserLog.leave();
        return token.value;
    }

    /** 現在のトークンが指定した条件を満たしているかどうかを返します。 */
    match(kind: TokenKind, offset: number = 0): boolean {
        parserLog.print("match");
        parserLog.enter();
        const current = this.getToken(offset);
        parserLog.leave();
        return current.kind === kind;
    }

    /** 次のトークンに進みます。 */
    forward(): Token {
        parserLog.print("forward");
        parserLog.enter();
        // 現在のトークンが既に読まれていれば、現在のトークンを破棄
        if (this.tokens.length > 0) {
            const token = this.tokens[0];
            this.tokens.splice(0, 1);
            parserLog.leave();
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
        parserLog.print("forwardWithExpect");
        parserLog.enter();
        this.expect(kind);
        this.forward();
        parserLog.leave();
    }

    /**
     * 現在のトークンが指定した条件を満たしていることを確認します。
     * 条件を満たしていなければSyntaxErrorを生成します。
    */
    expect(kind: TokenKind, offset: number = 0): void {
        parserLog.print("expect");
        parserLog.enter();
        if (!this.match(kind, offset)) {
            this.throwSyntaxError(`Expected ${getTokenString({ kind })}, but got ${getTokenString({ token: this.getToken(offset) })}`);
        }
        parserLog.leave();
    }

    /** SyntaxErrorを生成します。 */
    throwSyntaxError(message: string): never {
        throw new Error(`${message} (${this.input.line}:${this.input.column})`);
    }

    private readToken(): Token {
        const input = this.input;

        const tokenList: { kind: TokenKind; source: string; value?: string; }[] = [];
        const spaceList: string[] = [];

        const constantList: [TokenKind, string][] = [
            [TOKEN.EOF, ""],
            [TOKEN.Aste, "*"],
            [TOKEN.Plus, "+"],
            [TOKEN.Excl, "!"],
            [TOKEN.Amp, "&"],
            [TOKEN.Ques, "?"],
            [TOKEN.Slash, "/"],
            [TOKEN.Dot, "."],
            [TOKEN.Dollar, "$"],
            [TOKEN.Arrow, "=>"],
            [TOKEN.Equal, "="],
            [TOKEN.Semi, ";"],
            [TOKEN.OpenBracket, "{"],
            [TOKEN.CloseBracket, "}"],
            [TOKEN.OpenParen, "("],
            [TOKEN.CloseParen, ")"],
            [TOKEN.Parser, "parser"],
            [TOKEN.Lexer, "lexer"],
            [TOKEN.Ignored, "ignored"],
            [TOKEN.Token, "token"],
            [TOKEN.Expression, "expression"],
            [TOKEN.Atom, "atom"],
            [TOKEN.Prefix, "prefix"],
            [TOKEN.Infix, "infix"],
            [TOKEN.Postfix, "postfix"],
            [TOKEN.Operator, "operator"],
            [TOKEN.Group, "group"],
        ];

        lexerLog.print("readToken");
        lexerLog.enter();

        while (true) {
            let char10 = input.getString(10);

            if (char10.startsWith("\r\n")) {
                input.nextChar(2);
                spaceList.push(char10.slice(0, 2));
                lexerLog.print("CRLF");
                continue;
            }
            if (char10.startsWith("\r") || char10.startsWith("\n")) {
                input.nextChar();
                spaceList.push(char10.slice(0, 1));
                lexerLog.print("CR or LF");
                continue;
            }
            if (char10.startsWith(" ") || char10.startsWith("\t")) {
                input.nextChar();
                spaceList.push(char10.slice(0, 1));
                lexerLog.print("space or tab");
                continue;
            }

            for (let i = 0; i < constantList.length; i++) {
                const constant = constantList[i];
                if (constant[1].length === 0) {
                    if (char10 === "") {
                        tokenList.push({ kind: constant[0], source: constant[1] });
                        lexerLog.print("found token: EOF");
                    }
                } else {
                    if (char10.startsWith(constant[1])) {
                        tokenList.push({ kind: constant[0], source: constant[1] });
                        lexerLog.print(`found token: kind=${constant[0]}(${getTokenString({ kind: constant[0] })}) source="${constant[1]}"`);
                    }
                }
            }

            if (/^[a-zA-Z0-9_]/.test(input.getChar())) {
                let value = "";
                value += input.getChar(0);
                let offset = 1;
                while (!input.eof() && /^[a-zA-Z0-9_]/.test(input.getChar(offset))) {
                    value += input.getChar(offset);
                    offset++;
                }
                tokenList.push({ kind: TOKEN.Ident, source: value, value });
                lexerLog.print(`found token: kind=${TOKEN.Ident}(${getTokenString({ kind: TOKEN.Ident })}) source="${value}"`);
            }
            if (input.getChar() == "\"") {
                let source = "";
                let value = "";
                let offset = 0;
                source += input.getChar(offset);
                offset++;
                while (!input.eof()) {
                    if (input.getChar(offset) === "\"") break;
                    source += input.getChar(offset);
                    value += input.getChar(offset);
                    offset++;
                }
                if (!input.eof()) {
                    source += input.getChar(offset);
                    offset++;
                }
                tokenList.push({ kind: TOKEN.Str, source, value });
                lexerLog.print(`found token: kind=${TOKEN.Str}(${getTokenString({ kind: TOKEN.Str })}) source="${source}"`);
            }
            if (char10.startsWith("[")) {
                // TODO: CharRange
                lexerLog.leave();
                this.throwSyntaxError("not implemented yet");
            }

            if (tokenList.length >= 0) {
                // マッチしたトークンのうち、最も長いトークンとして読み取る。
                let widestIndex = 0;
                for (let i = 1; i < tokenList.length; i++) {
                    if (tokenList[i].source.length > tokenList[widestIndex].source.length) {
                        widestIndex = i;
                    }
                }
                if (tokenList[widestIndex].source.length > 0) {
                    input.nextChar(tokenList[widestIndex].source.length);
                }
                lexerLog.print(`output token: kind=${tokenList[widestIndex].kind}(${getTokenString({ kind: tokenList[widestIndex].kind })}) source="${tokenList[widestIndex].source}"`);
                lexerLog.leave();
                return createToken(tokenList[widestIndex].kind, { value: tokenList[widestIndex].value });
            } else {
                lexerLog.print("unexpected char");
                lexerLog.leave();
                this.throwSyntaxError(`unexpected char '${input.getString(1)}'`);
            }
        }
    }
}

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

    getChar(offset: number = 0): string {
        return this.source.slice(this.index + offset, this.index + offset + 1);
    }

    getString(length: number): string {
        return this.source.slice(this.index, this.index + length);
    }

    nextChar(length: number = 1): void {
        inputLog.print(`nextChar length=${length}`);
        inputLog.enter();
        while (length > 0) {
            if (this.eof()) {
                throw new Error("End of stream");
            }
            if (this.getString(1) === "\r") {
                // ignore CR
            } else if (this.getString(1) === "\n") {
                this.line++;
                this.column = 1;
            } else {
                this.column++;
            }
            this.index++;
            length--;
        }
        inputLog.leave();
    }
}
