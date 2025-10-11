// 字句解析 入力文字列をトークン列に変換する

// lexer for luna-parse spec

import { inputLog, lexerLog, parserLog } from "../utils/logger.js";

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

const constantList: { kind: TokenKind; source: string; }[] = [
    { kind: TOKEN.EOF, source: "" },
    { kind: TOKEN.Aste, source: "*" },
    { kind: TOKEN.Plus, source: "+" },
    { kind: TOKEN.Excl, source: "!" },
    { kind: TOKEN.Amp, source: "&" },
    { kind: TOKEN.Ques, source: "?" },
    { kind: TOKEN.Slash, source: "/" },
    { kind: TOKEN.Dot, source: "." },
    { kind: TOKEN.Dollar, source: "$" },
    { kind: TOKEN.Arrow, source: "=>" },
    { kind: TOKEN.Equal, source: "=" },
    { kind: TOKEN.Semi, source: ";" },
    { kind: TOKEN.OpenBracket, source: "{" },
    { kind: TOKEN.CloseBracket, source: "}" },
    { kind: TOKEN.OpenParen, source: "(" },
    { kind: TOKEN.CloseParen, source: ")" },
    { kind: TOKEN.Parser, source: "parser" },
    { kind: TOKEN.Lexer, source: "lexer" },
    { kind: TOKEN.Ignored, source: "ignored" },
    { kind: TOKEN.Token, source: "token" },
    { kind: TOKEN.Expression, source: "expression" },
    { kind: TOKEN.Atom, source: "atom" },
    { kind: TOKEN.Prefix, source: "prefix" },
    { kind: TOKEN.Infix, source: "infix" },
    { kind: TOKEN.Postfix, source: "postfix" },
    { kind: TOKEN.Operator, source: "operator" },
    { kind: TOKEN.Group, source: "group" },
];

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
    getValue(): string {
        parserLog.print("getValue");
        parserLog.enter();
        const token = this.getToken();
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
    expect(kind: TokenKind): void {
        parserLog.print("expect");
        parserLog.enter();
        if (!this.match(kind)) {
            this.throwSyntaxError(`Expected ${getTokenString({ kind })}, but got ${getTokenString({ token: this.getToken() })}`);
        }
        parserLog.leave();
    }

    /** SyntaxErrorを生成します。 */
    throwSyntaxError(message: string): never {
        throw new Error(`${message} (${this.input.getLine()}:${this.input.getColumn()})`);
    }

    private readToken(): Token {
        const input = this.input;

        const tokenList: { kind: TokenKind; source: string; value?: string; }[] = [];
        const spaceList: string[] = [];

        lexerLog.print("readToken");
        lexerLog.enter();

        while (true) {
            let current = input.peek(10);

            if (current.startsWith("\r\n")) {
                input.forward(2);
                input.commit();
                spaceList.push(current.slice(0, 2));
                lexerLog.print("CRLF");
                continue;
            }
            if (current.startsWith("\r") || current.startsWith("\n")) {
                input.forward(1);
                input.commit();
                spaceList.push(current.slice(0, 1));
                lexerLog.print("CR or LF");
                continue;
            }
            if (current.startsWith(" ") || current.startsWith("\t")) {
                input.forward(1);
                input.commit();
                spaceList.push(current.slice(0, 1));
                lexerLog.print("space or tab");
                continue;
            }

            if (current === "") {
                tokenList.push({ kind: 0, source: "" });
                lexerLog.print(() => `found token: kind=${0}(${getTokenString({ kind: 0 })}) source=""`);
            }

            for (let i = 0; i < constantList.length; i++) {
                const constant = constantList[i];
                if (constant.source.length > 0) {
                    if (current.startsWith(constant.source)) {
                        tokenList.push({ kind: constant.kind, source: constant.source });
                        lexerLog.print(() => `found token: kind=${constant.kind}(${getTokenString({ kind: constant.kind })}) source="${constant.source}"`);
                    }
                }
            }

            if (/^[a-zA-Z0-9_]/.test(input.peek(1))) {
                let value = "";
                value += input.peek(1);
                input.forward(1);
                while (!input.eof() && /^[a-zA-Z0-9_]/.test(input.peek(1))) {
                    value += input.peek(1);
                    input.forward(1);
                }
                tokenList.push({ kind: TOKEN.Ident, source: value, value });
                input.reset();
                lexerLog.print(() => `found token: kind=${TOKEN.Ident}(${getTokenString({ kind: TOKEN.Ident })}) source="${value}"`);
            }
            if (input.peek(1) == "\"") {
                let source = "";
                let value = "";
                source += input.peek(1);
                input.forward(1);
                while (!input.eof()) {
                    if (input.peek(1) === "\"") break;
                    source += input.peek(1);
                    value += input.peek(1);
                    input.forward(1);
                }
                if (!input.eof()) {
                    source += input.peek(1);
                    input.forward(1);
                }
                tokenList.push({ kind: TOKEN.Str, source, value });
                input.reset();
                lexerLog.print(() => `found token: kind=${TOKEN.Str}(${getTokenString({ kind: TOKEN.Str })}) source="${source}"`);
            }
            if (current.startsWith("[")) {
                // TODO: CharRange
                let source = "";
                while (!input.eof()) {
                    if (input.peek(1) === "]") break;
                    source += input.peek(1);
                    //value += input.peek(1);
                    input.forward(1);
                }
                if (!input.eof()) {
                    source += input.peek(1);
                    input.forward(1);
                }
                input.reset();
                tokenList.push({ kind: TOKEN.CharRange, source });
                lexerLog.print(() => `found token: kind=${TOKEN.CharRange}(${getTokenString({ kind: TOKEN.CharRange })}) source="${source}"`);
            }

            if (tokenList.length > 0) {
                // マッチしたトークンのうち、最も長いトークンとして読み取る。同じ長さの場合は先に現れたトークンが優先。
                let widestIndex = 0;
                lexerLog.print(() => `found tokens: ${JSON.stringify(tokenList)}`);
                for (let i = 1; i < tokenList.length; i++) {
                    if (tokenList[i].source.length > tokenList[widestIndex].source.length) {
                        widestIndex = i;
                    }
                }
                if (tokenList[widestIndex].source.length > 0) {
                    input.forward(tokenList[widestIndex].source.length);
                    input.commit();
                }
                lexerLog.print(() => `output token: kind=${tokenList[widestIndex].kind}(${getTokenString({ kind: tokenList[widestIndex].kind })}) source="${tokenList[widestIndex].source}"`);
                lexerLog.leave();
                return createToken(tokenList[widestIndex].kind, { value: tokenList[widestIndex].value });
            } else {
                lexerLog.print("unexpected char");
                lexerLog.leave();
                this.throwSyntaxError(`unexpected char '${input.peek(1)}'`);
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

    if (kind === 0) return "EOF";

    const constant = constantList.find(x => x.kind === kind);
    if (constant != null) {
        return `\`${constant.source}\``;
    }

    if (kind === TOKEN.Str && value != null) return `\`"${value}"\``;
    if (kind === TOKEN.CharRange && value != null) return `[${value}]`;
    if (kind === TOKEN.Ident && value != null) return `\`${value}\``;
    if (kind === TOKEN.Str) return `Str`;
    if (kind === TOKEN.CharRange) return `CharRange`;
    if (kind === TOKEN.Ident) return `Ident`;

    throw new Error(`unknown token: ${kind}`);
}

export class Input {
    source: string;
    private workState: {
        index: number;
        line: number;
        column: number;
    };
    private commitState: {
        index: number;
        line: number;
        column: number;
    };

    constructor(source: string) {
        this.source = source;
        this.workState = {
            index: 0,
            line: 1,
            column: 1,
        };
        this.commitState = {
            index: 0,
            line: 1,
            column: 1,
        };
    }

    initialize(source: string) {
        this.source = source;
        this.workState = {
            index: 0,
            line: 1,
            column: 1,
        };
        this.commitState = {
            index: 0,
            line: 1,
            column: 1,
        };
    }

    getLine(): number {
        return this.workState.line;
    }

    getColumn(): number {
        return this.workState.column;
    }

    eof(): boolean {
        return this.workState.index >= this.source.length;
    }

    peek(length: number): string {
        return this.source.slice(this.workState.index, this.workState.index + length);
    }

    forward(length: number): void {
        inputLog.print(() => `Input.forward length=${length}`);
        inputLog.enter();
        while (length > 0) {
            if (this.eof()) {
                throw new Error("End of stream");
            }
            if (this.peek(1) === "\r") {
                // ignore CR
            } else if (this.peek(1) === "\n") {
                this.workState.line++;
                this.workState.column = 1;
            } else {
                this.workState.column++;
            }
            this.workState.index++;
            length--;
        }
        inputLog.leave();
    }

    /** 現在位置を確定させます。 */
    commit(): void {
        this.commitState.index = this.workState.index;
        this.commitState.line = this.workState.line;
        this.commitState.column = this.workState.column;
    }

    /** 前回確定されたポイントまで現在位置を戻します。 */
    reset(): void {
        this.workState.index = this.commitState.index;
        this.workState.line = this.commitState.line;
        this.workState.column = this.commitState.column;
    }
}
