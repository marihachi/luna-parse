// 構文解析 トークン列をASTに変換する

import { ParseContext } from "./parse-context.js";

export function parse(source: string): A_Toplevel[] {
    const p = new ParseContext(source);

    const children: A_Toplevel[] = [];
    while (p.match("config") || p.match("rule") || p.match("expression")) {
        children.push(parseToplevel(p));
    }

    p.expectEOF();

    return children;
}


export type A_Toplevel = A_ConfigDecl | A_RuleDecl | A_ExpressionDecl;

function parseToplevel(p: ParseContext): A_Toplevel {
    if (p.match("config")) {
        return parseConfigDecl(p);
    } else if (p.match("rule")) {
        return parseRuleDecl(p);
    } else if (p.match("expression")) {
        return parseExpressionDecl(p);
    } else {
        p.throwSyntaxError("unexpected token");
    }
}


export type A_ConfigDecl = { kind: "ConfigDecl"; key: string; value: string; };

function parseConfigDecl(p: ParseContext): A_ConfigDecl {
    p.acceptMatch();

    const key = parseIdent(p);

    const value = parseIdent(p);

    return { kind: "ConfigDecl", key, value };
}


export type A_RuleDecl = { kind: "RuleDecl"; name: string; children: string };

function parseRuleDecl(p: ParseContext): A_RuleDecl {
    p.acceptMatch();

    const name = parseIdent(p);

    p.forwardWithExpect("=");

    let children: string | undefined;
    if (p.match(parseIdent)) {
        children = parseIdent(p);
    } else {
        p.throwSyntaxError("unexpected token");
    }

    return { kind: "RuleDecl", name, children };
}


export type A_ExpressionDecl = { kind: "ExpressionDecl"; name: string; children: (A_OperatorLevel | A_ExprItem)[]; };

function parseExpressionDecl(p: ParseContext): A_ExpressionDecl {
    p.acceptMatch();

    const name = parseIdent(p);

    p.forwardWithExpect("{");

    const children: (A_OperatorLevel | A_ExprItem)[] = [];
    while (p.match("atom") || p.match("level")) {
        children.push(parseExpressionDecl_0(p));
    }

    p.forwardWithExpect("}");

    return { kind: "ExpressionDecl", name, children };
}

function parseExpressionDecl_0(p: ParseContext): A_OperatorLevel | A_ExprItem {
    if (p.match("atom")) {
        return parseExprItem(p);
    } else if (p.match("level")) {
        return parseOperatorLevel(p);
    } else {
        p.throwSyntaxError("unexpected token");
    }
}


export type A_ExprItem = { kind: "ExprItem"; name: string; };

function parseExprItem(p: ParseContext): A_ExprItem {
    p.acceptMatch();

    let name: string = parseIdent(p);

    return { kind: "ExprItem", name };
}


export type A_OperatorLevel = { kind: "OperatorLevel"; children: A_OperatorItem[]; };

function parseOperatorLevel(p: ParseContext): A_OperatorLevel {
    p.acceptMatch();

    p.forwardWithExpect("{");

    let children: A_OperatorItem[] = [];
    while (p.match("prefix") || p.match("infix") || p.match("postfix")) {
        children.push(parseOperatorItem(p));
    }

    p.forwardWithExpect("}");

    return { kind: "OperatorLevel", children };
}


export type A_OperatorItem = { kind: "OperatorItem"; operatorKind: string; value: string; };

function parseOperatorItem(p: ParseContext): A_OperatorItem {
    const operatorKind: string = p.acceptMatch() as string;

    p.forwardWithExpect("operator");

    let value = parseString(p);

    return { kind: "OperatorItem", operatorKind, value };
}

export type A_Expr = A_Sequence | A_Alternate;

export type A_Sequence = {};
// TODO

export type A_Alternate = {};
// TODO

function parseIdent(p: ParseContext): string {
    const name = p.getValue();
    p.forward();

    return name;
}

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

function parse_(p: ParseContext): string {
    const beginIndex = p.input.index;
    while (p.match(" ") || p.match("\t") || p.match("\r\n") || p.match("\n")) {
        if (p.match(" ")) {
            p.forward(1);
        } else if (p.match("\t")) {
            p.forward(1);
        } else if (p.match("\r\n")) {
            p.forward(2);
        } else if (p.match("\n")) {
            p.forward(1);
        }
    }
    const endIndex = p.input.index;
    return p.input.sliceRange(beginIndex, endIndex);
}

function parseString(p: ParseContext): string {
    p.forwardWithExpect("\"");

    let buf = "";
    while (!(p.eof() || p.match("\""))) {
        buf += p.getSlice(1);
    }

    p.forwardWithExpect("\"");

    return buf;
}

function parseExpr(p: ParseContext): A_Expr {
    return parseExprBp(p, 0);
}

type PrefixOperator = { kind: "PrefixOperator", tokenKind: string, bp: number };
type InfixOperator = { kind: "InfixOperator", tokenKind: string, lbp: number, rbp: number };
type PostfixOperator = { kind: "PostfixOperator", tokenKind: string, bp: number };
type AnyOperator = PrefixOperator | InfixOperator | PostfixOperator;

const operators: AnyOperator[] = [
    // TODO
];

// pratt parsing
// https://matklad.github.io/2020/04/13/simple-but-powerful-pratt-parsing.html

// bp値は演算子が左側と右側に対してどの程度強く結合するかを表します。
// 例えば、InfixOperatorではlbpを大きくすると右結合、rbpを大きくすると左結合の演算子になります。
// 詳細はpratt parsingの説明ページを参照してください。

function parseExprBp(p: ParseContext, minBp: number): A_Expr {
    let expr: A_Expr;
    const tokenKind = p.getToken().kind;
    const prefix = operators.find((x): x is PrefixOperator => x.kind === "PrefixOperator" && x.tokenKind === tokenKind);
    if (prefix != null) {
        expr = handlePrefixOperator(p, prefix.bp);
    } else {
        expr = handleAtom(p);
    }
    while (true) {
        const tokenKind = p.getToken().kind;
        const postfix = operators.find((x): x is PostfixOperator => x.kind === "PostfixOperator" && x.tokenKind === tokenKind);
        if (postfix != null) {
            if (postfix.bp < minBp) {
                break;
            }
            expr = handlePostfixOperator(p, expr);
            continue;
        }
        const infix = operators.find((x): x is InfixOperator => x.kind === "InfixOperator" && x.tokenKind === tokenKind);
        if (infix != null) {
            if (infix.lbp < minBp) {
                break;
            }
            expr = handleInfixOperator(p, expr, infix.rbp);
            continue;
        }
        break;
    }
    return expr;
}

function handlePrefixOperator(p: ParseContext, minBp: number): A_Expr {
    p.throwSyntaxError("not implemented");
}

function handleInfixOperator(p: ParseContext, left: A_Expr, minBp: number): A_Expr {
    p.throwSyntaxError("not implemented");
}

function handlePostfixOperator(p: ParseContext, expr: A_Expr): A_Expr {
    p.throwSyntaxError("not implemented");
}

function handleAtom(p: ParseContext): A_Expr {
    p.throwSyntaxError("not implemented");
}
