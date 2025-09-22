// 構文解析 トークン列をASTに変換する

import { ParseContext } from "./parse-context.js";

export type ParseState = {
};

export function parse(source: string): A_Toplevel[] {
    const p = new ParseContext(source);
    const state: ParseState = {};

    const children: A_Toplevel[] = [];
    while (p.match("config") || p.match("rule") || p.match("expression")) {
        children.push(parseToplevel(p, state));
    }

    p.expectEOF();

    return children;
}


export type A_Toplevel = A_ConfigDecl | A_RuleDecl | A_ExpressionDecl;

function parseToplevel(p: ParseContext, state: ParseState): A_Toplevel {
    if (p.match("config")) {
        return parseConfigDecl(p, state);
    } else if (p.match("rule")) {
        return parseRuleDecl(p, state);
    } else if (p.match("expression")) {
        return parseExpressionDecl(p, state);
    } else {
        p.throwSyntaxError("unexpected token");
    }
}


export type A_ConfigDecl = { kind: "ConfigDecl"; key: string; value: string; };

function parseConfigDecl(p: ParseContext, state: ParseState): A_ConfigDecl {
    p.forward("config");

    p.expect({ kind: "Word" });
    const key = p.getValue();
    p.forward();

    p.expect({ kind: "Word" });
    const value = p.getValue();
    p.forward();

    return { kind: "ConfigDecl", key, value };
}


export type A_RuleDecl = { kind: "RuleDecl"; name: string; children: string };

function parseRuleDecl(p: ParseContext, state: ParseState): A_RuleDecl {
    p.forward("rule");

    p.expect({ kind: "Word" });
    const name = p.getValue();
    p.forward();

    p.forwardWithExpect("=");

    let children: string | undefined;
    if (p.match({ kind: "Word" })) {
        children = parseIdent(p, state);
    } else {
        p.throwSyntaxError("unexpected token");
    }

    return { kind: "RuleDecl", name, children };
}


export type A_ExpressionDecl = { kind: "ExpressionDecl"; name: string; children: (A_OperatorLevel | A_ExprItem)[]; };

function parseExpressionDecl(p: ParseContext, state: ParseState): A_ExpressionDecl {
    p.forward("expression");

    p.expect({ kind: "Word" });
    const name = p.getValue();
    p.forward();

    p.forwardWithExpect("{");

    const children: (A_OperatorLevel | A_ExprItem)[] = [];
    while (p.match("atom") || p.match("level")) {
        children.push(parseExpressionDecl_0(p, state));
    }

    p.forwardWithExpect("}");

    return { kind: "ExpressionDecl", name, children };
}

function parseExpressionDecl_0(p: ParseContext, state: ParseState): A_OperatorLevel | A_ExprItem {
    if (p.match("atom")) {
        return parseExprItem(p, state);
    } else if (p.match("level")) {
        return parseOperatorLevel(p, state);
    } else {
        p.throwSyntaxError("unexpected token");
    }
}


export type A_ExprItem = { kind: "ExprItem"; name: string; };

function parseExprItem(p: ParseContext, state: ParseState): A_ExprItem {
    p.forward("atom");

    let name: string;
    if (p.match({ kind: "Word" })) {
        name = parseIdent(p, state);
    } else {
        p.throwSyntaxError("unexpected token");
    }

    return { kind: "ExprItem", name };
}


export type A_OperatorLevel = { kind: "OperatorLevel"; children: A_OperatorItem[]; };

function parseOperatorLevel(p: ParseContext, state: ParseState): A_OperatorLevel {
    p.forward("level");

    p.forwardWithExpect("{");

    let children: A_OperatorItem[] = [];
    while (p.match("prefix") || p.match("infix") || p.match("postfix")) {
        children.push(parseOperatorItem(p, state));
    }

    p.forwardWithExpect("}");

    return { kind: "OperatorLevel", children };
}


export type A_OperatorItem = { kind: "OperatorItem"; operatorKind: string; value: string; };

function parseOperatorItem(p: ParseContext, state: ParseState): A_OperatorItem {
    const operatorKind = p.getValue();
    p.forward();

    p.forwardWithExpect({ word: "operator" });

    p.expect({ kind: "String" });
    let value = p.getValue();
    p.forward();

    return { kind: "OperatorItem", operatorKind, value };
}

export type A_Expr = A_Sequence | A_Alternate;

export type A_Sequence = {};
// TODO

export type A_Alternate = {};
// TODO

function parseIdent(p: ParseContext, state: ParseState): string {
    const name = p.getValue();
    p.forward();

    return name;
}

// const spaces: string[] = [];
// while (!this.input.eof()) {
//     if ("\r\n" === input.getChar(2)) {
//         spaces.push("\r\n");
//         input.nextChar(2);
//     } else if (["\r", "\n"].includes(input.getChar())) {
//         spaces.push(input.getChar());
//         input.nextChar();
//     } else if ([" ", "\t"].includes(input.getChar())) {
//         spaces.push(input.getChar());
//         input.nextChar();
//     } else {
//         break;
//     }
// }

// if (/^[a-z0-9]$/i.test(char)) {
//     let buf = "";
//     buf += char;
//     input.nextChar();
//     while (!input.eof() && /^[a-z0-9]$/i.test(input.getChar())) {
//         buf += input.getChar();
//         input.nextChar();
//     }
//     return TOKEN("Word", { value: buf });
// }

// if (char === "\"") {
//     let buf = "";
//     input.nextChar();
//     while (!input.eof()) {
//         if (input.getChar() === "\"") break;
//         buf += input.getChar();
//         input.nextChar();
//     }
//     if (!input.eof()) {
//         input.nextChar();
//     }
//     return TOKEN("String", { value: buf });
// }

function parseExpr(p: ParseContext, state: ParseState): A_Expr {
    return parseExprBp(p, state, 0);
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

function parseExprBp(p: ParseContext, state: ParseState, minBp: number): A_Expr {
    let expr: A_Expr;
    const tokenKind = p.getToken().kind;
    const prefix = operators.find((x): x is PrefixOperator => x.kind === "PrefixOperator" && x.tokenKind === tokenKind);
    if (prefix != null) {
        expr = handlePrefixOperator(p, state, prefix.bp);
    } else {
        expr = handleAtom(p, state);
    }
    while (true) {
        const tokenKind = p.getToken().kind;
        const postfix = operators.find((x): x is PostfixOperator => x.kind === "PostfixOperator" && x.tokenKind === tokenKind);
        if (postfix != null) {
            if (postfix.bp < minBp) {
                break;
            }
            expr = handlePostfixOperator(p, state, expr);
            continue;
        }
        const infix = operators.find((x): x is InfixOperator => x.kind === "InfixOperator" && x.tokenKind === tokenKind);
        if (infix != null) {
            if (infix.lbp < minBp) {
                break;
            }
            expr = handleInfixOperator(p, state, expr, infix.rbp);
            continue;
        }
        break;
    }
    return expr;
}

function handlePrefixOperator(p: ParseContext, state: ParseState, minBp: number): A_Expr {
    p.throwSyntaxError("not implemented");
}

function handleInfixOperator(p: ParseContext, state: ParseState, left: A_Expr, minBp: number): A_Expr {
    p.throwSyntaxError("not implemented");
}

function handlePostfixOperator(p: ParseContext, state: ParseState, expr: A_Expr): A_Expr {
    p.throwSyntaxError("not implemented");
}

function handleAtom(p: ParseContext, state: ParseState): A_Expr {
    p.throwSyntaxError("not implemented");
}
