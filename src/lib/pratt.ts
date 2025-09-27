import { Input } from "./input.js";

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
    match(token: TokenSpecifier, offset: number = 0): boolean {
        const current = this.getToken(offset);
        if (token.kind != null) {
            return current.kind === token.kind;
        } else {
            return current.kind === token.token.kind && current.value === token.token.value;
        }
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
    forwardWithExpect(token: TokenSpecifier): void {
        this.expect(token);
        this.forward();
    }

    /**
     * 現在のトークンが指定した条件を満たしていることを確認します。
     * 条件を満たしていなければSyntaxErrorを生成します。
    */
    expect(token: TokenSpecifier, offset: number = 0): void {
        if (!this.match(token, offset)) {
            const current: TokenSpecifier = { token: this.getToken(offset) };
            this.throwSyntaxError(`Expected ${getTokenString(token)}, but got ${getTokenString(current)}`);
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
                return TOKEN("EOF");
            } else {
                let char = input.getChar();
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

export type TokenKind = "EOF";

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
    return kind;
}

function parseExpr(s: Lexer): unknown {
    return parseExprBp(s, 0);
}

type PrefixOperator = { kind: "PrefixOperator", tokenKind: TokenKind, bp: number };
type InfixOperator = { kind: "InfixOperator", tokenKind: TokenKind, lbp: number, rbp: number };
type PostfixOperator = { kind: "PostfixOperator", tokenKind: TokenKind, bp: number };
type AnyOperator = PrefixOperator | InfixOperator | PostfixOperator;

const operators: AnyOperator[] = [
    // TODO
];

// pratt parsing
// https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html

// bp値は演算子が左側と右側に対してどの程度強く結合するかを表します。
// 例えば、InfixOperatorではlbpを大きくすると右結合、rbpを大きくすると左結合の演算子になります。
// 詳細はpratt parsingの説明ページを参照してください。

function parseExprBp(s: Lexer, minBp: number): unknown {
    let expr: unknown;
    const tokenKind = s.getToken().kind;
    const prefix = operators.find((x): x is PrefixOperator => x.kind === "PrefixOperator" && x.tokenKind === tokenKind);
    if (prefix != null) {
        expr = handlePrefixOperator(s, prefix.bp);
    } else {
        expr = handleAtom(s);
    }
    while (true) {
        const tokenKind = s.getToken().kind;
        const postfix = operators.find((x): x is PostfixOperator => x.kind === "PostfixOperator" && x.tokenKind === tokenKind);
        if (postfix != null) {
            if (postfix.bp < minBp) {
                break;
            }
            expr = handlePostfixOperator(s, expr);
            continue;
        }
        const infix = operators.find((x): x is InfixOperator => x.kind === "InfixOperator" && x.tokenKind === tokenKind);
        if (infix != null) {
            if (infix.lbp < minBp) {
                break;
            }
            expr = handleInfixOperator(s, expr, infix.rbp);
            continue;
        }
        break;
    }
    return expr;
}

function handlePrefixOperator(s: Lexer, minBp: number): unknown {
    s.throwSyntaxError("not implemented");
}

function handleInfixOperator(s: Lexer, left: unknown, minBp: number): unknown {
    s.throwSyntaxError("not implemented");
}

function handlePostfixOperator(s: Lexer, expr: unknown): unknown {
    s.throwSyntaxError("not implemented");
}

function handleAtom(s: Lexer): unknown {
    s.throwSyntaxError("not implemented");
}
