// 構文解析 Scanから取得したトークン列をASTに変換する

import { Scan, TokenKind } from "./scan.js";

export type ParseState = {
};

export function parse(source: string): A_Toplevel[] {
    const s = new Scan(source);
    const state: ParseState = {};

    const children: A_Toplevel[] = [];
    while (s.match({ word: "config" }) || s.match({ word: "rule" }) || s.match({ word: "expression" })) {
        children.push(parseToplevel(s, state));
    }

    s.forwardWithExpect({ kind: "EOF" });

    return children;
}


export type A_Toplevel = A_ConfigDecl | A_RuleDecl | A_ExpressionDecl;

function parseToplevel(s: Scan, state: ParseState): A_Toplevel {
    if (s.match({ word: "config" })) {
        return parseConfigDecl(s, state);
    } else if (s.match({ word: "rule" })) {
        return parseRuleDecl(s, state);
    } else if (s.match({ word: "expression" })) {
        return parseExpressionDecl(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }
}


export type A_ConfigDecl = { kind: "ConfigDecl"; key: string; value: string; };

function parseConfigDecl(s: Scan, state: ParseState): A_ConfigDecl {
    s.forward();

    s.expect({ kind: "Word" });
    const key = s.getValue();
    s.forward();

    s.expect({ kind: "Word" });
    const value = s.getValue();
    s.forward();

    return { kind: "ConfigDecl", key, value };
}


export type A_RuleDecl = { kind: "RuleDecl"; name: string; children: string };

function parseRuleDecl(s: Scan, state: ParseState): A_RuleDecl {
    s.forward();

    s.expect({ kind: "Word" });
    const name = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "Equal" });

    let children: string | undefined;
    if (s.match({ kind: "Word" })) {
        children = parseIdent(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }

    return { kind: "RuleDecl", name, children };
}


export type A_ExpressionDecl = { kind: "ExpressionDecl"; name: string; children: (A_OperatorLevel | A_ExprItem)[]; };

function parseExpressionDecl(s: Scan, state: ParseState): A_ExpressionDecl {
    s.forward();

    s.expect({ kind: "Word" });
    const name = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "OpenBracket" });

    const children: (A_OperatorLevel | A_ExprItem)[] = [];
    while (s.match({ word: "atom" }) || s.match({ word: "level" })) {
        children.push(parseExpressionDecl_0(s, state));
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "ExpressionDecl", name, children };
}

function parseExpressionDecl_0(s: Scan, state: ParseState): A_OperatorLevel | A_ExprItem {
    if (s.match({ word: "atom" })) {
        return parseExprItem(s, state);
    } else if (s.match({ word: "level" })) {
        return parseOperatorLevel(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }
}


export type A_ExprItem = { kind: "ExprItem"; name: string; };

function parseExprItem(s: Scan, state: ParseState): A_ExprItem {
    s.forward();

    let name: string;
    if (s.match({ kind: "Word" })) {
        name = parseIdent(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }

    return { kind: "ExprItem", name };
}


export type A_OperatorLevel = { kind: "OperatorLevel"; children: A_OperatorItem[]; };

function parseOperatorLevel(s: Scan, state: ParseState): A_OperatorLevel {
    s.forward();

    s.forwardWithExpect({ kind: "OpenBracket" });

    let children: A_OperatorItem[] = [];
    while (s.match({ word: "prefix" }) || s.match({ word: "infix" }) || s.match({ word: "postfix" })) {
        children.push(parseOperatorItem(s, state));
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "OperatorLevel", children };
}


export type A_OperatorItem = { kind: "OperatorItem"; operatorKind: string; value: string; };

function parseOperatorItem(s: Scan, state: ParseState): A_OperatorItem {
    const operatorKind = s.getValue();
    s.forward();

    s.forwardWithExpect({ word: "operator" });

    s.expect({ kind: "String" });
    let value = s.getValue();
    s.forward();

    return { kind: "OperatorItem", operatorKind, value };
}

export type A_Expr = A_Sequence | A_Alternate;

export type A_Sequence = {};
// TODO

export type A_Alternate = {};
// TODO

function parseIdent(s: Scan, state: ParseState): string {
    const name = s.getValue();
    s.forward();

    return name;
}

function parseExpr(s: Scan, state: ParseState): A_Expr {
    return parseExprBp(s, state, 0);
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

function parseExprBp(s: Scan, state: ParseState, minBp: number): A_Expr {
    let expr: A_Expr;
    const tokenKind = s.getToken().kind;
    const prefix = operators.find((x): x is PrefixOperator => x.kind === "PrefixOperator" && x.tokenKind === tokenKind);
    if (prefix != null) {
        expr = handlePrefixOperator(s, state, prefix.bp);
    } else {
        expr = handleAtom(s, state);
    }
    while (true) {
        const tokenKind = s.getToken().kind;
        const postfix = operators.find((x): x is PostfixOperator => x.kind === "PostfixOperator" && x.tokenKind === tokenKind);
        if (postfix != null) {
            if (postfix.bp < minBp) {
                break;
            }
            expr = handlePostfixOperator(s, state, expr);
            continue;
        }
        const infix = operators.find((x): x is InfixOperator => x.kind === "InfixOperator" && x.tokenKind === tokenKind);
        if (infix != null) {
            if (infix.lbp < minBp) {
                break;
            }
            expr = handleInfixOperator(s, state, expr, infix.rbp);
            continue;
        }
        break;
    }
    return expr;
}

function handlePrefixOperator(s: Scan, state: ParseState, minBp: number): A_Expr {
    s.throwSyntaxError("not implemented");
}

function handleInfixOperator(s: Scan, state: ParseState, left: A_Expr, minBp: number): A_Expr {
    s.throwSyntaxError("not implemented");
}

function handlePostfixOperator(s: Scan, state: ParseState, expr: A_Expr): A_Expr {
    s.throwSyntaxError("not implemented");
}

function handleAtom(s: Scan, state: ParseState): A_Expr {
    s.throwSyntaxError("not implemented");
}
