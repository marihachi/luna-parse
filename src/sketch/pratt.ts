import { Lexer, TokenKind } from "./lexer.js";

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
