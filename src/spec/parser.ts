// 構文解析 トークン列をASTに変換する

import { Lexer, TokenKind } from "./lexer.js";

export type ParseState = {
};

export function parse(source: string): A_Toplevel[] {
    const s = new Lexer(source);
    const state: ParseState = {};

    const children: A_Toplevel[] = [];
    while (s.match({ kind: "Parser" }) || s.match({ kind: "Lexer" })) {
        children.push(parseToplevel(s, state));
    }

    s.forwardWithExpect({ kind: "EOF" });

    return children;
}


export type A_Toplevel = A_ParserBlock | A_LexerBlock;

function parseToplevel(s: Lexer, state: ParseState): A_Toplevel {
    if (s.match({ kind: "Parser" })) {
        return parseParserBlock(s, state);
    } else if (s.match({ kind: "Lexer" })) {
        return parseLexerBlock(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }
}


export type A_ParserBlock = { kind: "ParserBlock"; };

function parseParserBlock(s: Lexer, state: ParseState): A_ParserBlock {
    s.forward();

    s.expect({ kind: "Ident" });
    const name = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "OpenBracket" });

    const children: A_Rule[] = [];
    while (s.match({ kind: "Ident" })) {
        children.push(parseRule(s, state));
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "ParserBlock" };
}


export type A_LexerBlock = { kind: "LexerBlock"; };

function parseLexerBlock(s: Lexer, state: ParseState): A_LexerBlock {
    s.forward();

    s.expect({ kind: "Ident" });
    const name = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "OpenBracket" });

    const children: A_LexerRule[] = [];
    while (s.match({ kind: "Ident" }) || s.match({ kind: "Token" }) || s.match({ kind: "Ignored" })) {
        children.push(parseLexerRule(s, state));
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "LexerBlock" };
}


export type A_Rule = { kind: "Rule"; name: string; children: string };

function parseRule(s: Lexer, state: ParseState): A_Rule {
    s.expect({ kind: "Ident" });
    const name = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "Equal" });

    let children: string | undefined;
    if (s.match({ kind: "Ident" })) {
        children = parseIdent(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }

    return { kind: "Rule", name, children };
}


export type A_LexerRule = { kind: "LexerRule"; name: string; children: string };

function parseLexerRule(s: Lexer, state: ParseState): A_LexerRule {
    let ruleAttr: "none" | "token" | "ignoredToken" = "none";
    if (s.match({ kind: "Token" })) {
        s.forward();
        ruleAttr = "token";
    }
    if (s.match({ kind: "Token" }, 1)) {
        if (s.match({ kind: "Ignored" })) {
            s.forward();
            s.forward();
            ruleAttr = "ignoredToken";
        } else {
            s.throwSyntaxError("unexpected token");
        }
    }

    s.expect({ kind: "Ident" });
    const name = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "Equal" });

    // TODO
    let children: string | undefined;
    if (s.match({ kind: "Ident" })) {
        children = parseIdent(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }

    return { kind: "LexerRule", name, children };
}


export type A_ExpressionDecl = { kind: "ExpressionDecl"; name: string; children: (A_OperatorLevel | A_ExprItem)[]; };

function parseExpressionDecl(s: Lexer, state: ParseState): A_ExpressionDecl {
    s.forward();

    s.expect({ kind: "Ident" });
    const name = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "OpenBracket" });

    const children: (A_OperatorLevel | A_ExprItem)[] = [];
    while (s.match({ kind: "Atom" }) || s.match({ kind: "Operator" })) {
        children.push(parseExpressionDecl_0(s, state));
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "ExpressionDecl", name, children };
}

function parseExpressionDecl_0(s: Lexer, state: ParseState): A_OperatorLevel | A_ExprItem {
    if (s.match({ kind: "Atom" })) {
        return parseExprItem(s, state);
    } else if (s.match({ kind: "Operator" })) {
        return parseOperatorLevel(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }
}


export type A_ExprItem = { kind: "ExprItem"; name: string; };

function parseExprItem(s: Lexer, state: ParseState): A_ExprItem {
    s.forward();

    let name: string;
    if (s.match({ kind: "Ident" })) {
        name = parseIdent(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }

    return { kind: "ExprItem", name };
}


export type A_OperatorLevel = { kind: "OperatorLevel"; children: A_OperatorItem[]; };

function parseOperatorLevel(s: Lexer, state: ParseState): A_OperatorLevel {
    s.forward();

    s.forwardWithExpect({ kind: "Group" });

    s.forwardWithExpect({ kind: "OpenBracket" });

    let children: A_OperatorItem[] = [];
    while (s.match({ kind: "Prefix" }) || s.match({ kind: "Infix" }) || s.match({ kind: "Postfix" })) {
        children.push(parseOperatorItem(s, state));
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "OperatorLevel", children };
}


export type A_OperatorItem = { kind: "OperatorItem"; operatorKind: string; value: string; };

function parseOperatorItem(s: Lexer, state: ParseState): A_OperatorItem {
    const operatorKind = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "Operator" });

    s.expect({ kind: "Str" });
    let value = s.getValue();
    s.forward();

    return { kind: "OperatorItem", operatorKind, value };
}

export type A_Expr = A_Sequence | A_Alternate;

export type A_Sequence = {};
// TODO

export type A_Alternate = {};
// TODO

function parseIdent(s: Lexer, state: ParseState): string {
    const name = s.getValue();
    s.forward();

    return name;
}

function parseExpr(s: Lexer, state: ParseState): A_Expr {
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

function parseExprBp(s: Lexer, state: ParseState, minBp: number): A_Expr {
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

function handlePrefixOperator(s: Lexer, state: ParseState, minBp: number): A_Expr {
    s.throwSyntaxError("not implemented");
}

function handleInfixOperator(s: Lexer, state: ParseState, left: A_Expr, minBp: number): A_Expr {
    s.throwSyntaxError("not implemented");
}

function handlePostfixOperator(s: Lexer, state: ParseState, expr: A_Expr): A_Expr {
    s.throwSyntaxError("not implemented");
}

function handleAtom(s: Lexer, state: ParseState): A_Expr {
    s.throwSyntaxError("not implemented");
}
