// 構文解析 トークン列をASTに変換する

// parser for luna-parse spec

import { getTokenString, Lexer, TOKEN } from "./lexer.js";

export type A_Node = A_Toplevel | A_Rule | A_Expr | A_OperatorGroup | A_ExprAtom | A_OperatorRule | A_LexerRule;

export function parse(source: string): A_Toplevel[] {
    const p = new Lexer(source);

    const children: A_Toplevel[] = [];
    while (p.match(TOKEN.Parser) || p.match(TOKEN.Lexer)) {
        children.push(parseToplevel(p));
    }

    // expect EOF
    if (!p.match(TOKEN.EOF)) {
        p.throwParserError(`unexpected token ${getTokenString({ token: p.getToken() })}`);
    }

    return children;
}


export type A_Toplevel = A_ParserBlock | A_LexerBlock;

function parseToplevel(p: Lexer): A_Toplevel {
    if (p.match(TOKEN.Parser)) {
        return parseParserBlock(p);
    } else if (p.match(TOKEN.Lexer)) {
        return parseLexerBlock(p);
    } else {
        p.throwParserError("unexpected token");
    }
}


export type A_ParserBlock = { kind: "ParserBlock"; name: string; rules: A_Rule[]; };

function parseParserBlock(p: Lexer): A_ParserBlock {
    // p.expect(TOKEN.Parser);
    p.forward();

    p.expect(TOKEN.Ident);
    const name = p.getValue();
    p.forward();

    p.forwardWithExpect(TOKEN.OpenBracket);

    const children: A_Rule[] = [];
    while (p.match(TOKEN.Ident)) {
        children.push(parseRule(p));
    }

    p.forwardWithExpect(TOKEN.CloseBracket);

    return { kind: "ParserBlock", name, rules: children };
}


export type A_Rule = { kind: "Rule"; name: string; expr: A_Expr; };

function parseRule(p: Lexer): A_Rule {
    // p.expect(TOKEN.Ident);
    const name = p.getValue();
    p.forward();

    p.forwardWithExpect(TOKEN.Equal);

    const expr = parseExpr1(p);

    p.forwardWithExpect(TOKEN.Semi);

    return { kind: "Rule", name, expr };
}


export type A_Expr = A_Sequence | A_Alternate | A_Repeat | A_Option | A_ExpressionBlock | A_Ref;

export type A_Alternate = { kind: "Alternate"; exprs: A_Expr[]; };

function parseExpr1(p: Lexer): A_Expr {
    const children: A_Expr[] = [];

    children.push(parseExpr2(p));

    while (p.match(TOKEN.Slash)) {
        p.forward();
        children.push(parseExpr2(p));
    }

    if (children.length === 1) {
        return children[0];
    } else {
        return { kind: "Alternate", exprs: children } satisfies A_Alternate;
    }
}


export type A_Sequence = { kind: "Sequence"; exprs: A_Expr[]; };

function parseExpr2(p: Lexer): A_Expr {
    const children: A_Expr[] = [];

    while (p.match(TOKEN.Amp) || p.match(TOKEN.Excl) || p.match(TOKEN.OpenParen) || p.match(TOKEN.Expression) || p.match(TOKEN.Ident)) {
        children.push(parseExpr3(p));
    }

    if (children.length === 1) {
        return children[0];
    } else if (children.length > 1) {
        return { kind: "Sequence", exprs: children } satisfies A_Sequence;
    } else {
        p.throwParserError("unexpected token");
    }
}


export type A_Repeat = { kind: "Repeat"; minimum: number; expr: A_Expr; };

export type A_Option = { kind: "Option"; expr: A_Expr; };

function parseExpr3(p: Lexer): A_Expr {
    const expr = parseParserAtom(p);

    if (p.match(TOKEN.Aste) || p.match(TOKEN.Plus) || p.match(TOKEN.Ques)) {
        return parseExpr3_0(p, expr);
    }

    return expr;
}

function parseExpr3_0(p: Lexer, expr: A_Expr): A_Expr {
    if (p.match(TOKEN.Aste)) {
        p.forward();
        return { kind: "Repeat", minimum: 0, expr } satisfies A_Repeat;
    } else if (p.match(TOKEN.Plus)) {
        p.forward();
        return { kind: "Repeat", minimum: 1, expr } satisfies A_Repeat;
    } else if (p.match(TOKEN.Ques)) {
        p.forward();
        return { kind: "Option", expr } satisfies A_Option;
    } else {
        p.throwParserError("unexpected token");
    }
}


function parseParserAtom(p: Lexer): A_Expr {
    if (p.match(TOKEN.OpenParen)) {
        p.forward();
        const expr = parseExpr1(p);
        p.forwardWithExpect(TOKEN.CloseParen);
        return expr;
    } else if (p.match(TOKEN.Expression)) {
        return parseExpressionBlock(p);
    } else if (p.match(TOKEN.Ident)) {
        return parseRef(p);
    } else {
        p.throwParserError("unexpected token");
    }
}


export type A_Ref = { kind: "Ref"; name: string; };

function parseRef(p: Lexer): A_Expr {
    // p.expect(TOKEN.Ident);
    const name = p.getValue();
    p.forward();

    return { kind: "Ref", name } satisfies A_Ref;
}


export type A_ExpressionBlock = { kind: "ExpressionBlock"; children: (A_OperatorGroup | A_ExprAtom)[]; };

function parseExpressionBlock(p: Lexer): A_ExpressionBlock {
    // p.expect(TOKEN.Expression);
    p.forward();

    p.forwardWithExpect(TOKEN.OpenBracket);

    const children: (A_OperatorGroup | A_ExprAtom)[] = [];
    while (p.match(TOKEN.Atom) || p.match(TOKEN.Operator)) {
        children.push(parseExpressionBlock_0(p));
    }

    p.forwardWithExpect(TOKEN.CloseBracket);

    return { kind: "ExpressionBlock", children };
}

function parseExpressionBlock_0(p: Lexer): A_OperatorGroup | A_ExprAtom {
    if (p.match(TOKEN.Atom)) {
        return parseExprAtom(p);
    } else if (p.match(TOKEN.Operator)) {
        return parseOperatorGroup(p);
    } else {
        p.throwParserError("unexpected token");
    }
}


export type A_ExprAtom = { kind: "ExprAtom"; expr: A_Expr; };

function parseExprAtom(p: Lexer): A_ExprAtom {
    // p.expect(TOKEN.Atom);
    p.forward();

    p.expect(TOKEN.Ident);
    const expr = parseRef(p);

    return { kind: "ExprAtom", expr };
}


export type A_OperatorGroup = { kind: "OperatorGroup"; children: A_OperatorRule[]; };

function parseOperatorGroup(p: Lexer): A_OperatorGroup {
    // p.expect(TOKEN.Operator);
    p.forward();

    p.forwardWithExpect(TOKEN.Group);

    p.forwardWithExpect(TOKEN.OpenBracket);

    let children: A_OperatorRule[] = [];
    while (p.match(TOKEN.Prefix) || p.match(TOKEN.Infix) || p.match(TOKEN.Postfix)) {
        children.push(parseOperatorRule(p));
    }

    p.forwardWithExpect(TOKEN.CloseBracket);

    return { kind: "OperatorGroup", children };
}


export type A_OperatorRule = { kind: "OperatorRule"; operatorKind: string; value: string; };

function parseOperatorRule(p: Lexer): A_OperatorRule {
    const operatorKind = parseOperatorRule_0(p);

    p.forwardWithExpect(TOKEN.Operator);

    // TODO
    p.expect(TOKEN.Str);
    let value = p.getValue();
    p.forward();

    return { kind: "OperatorRule", operatorKind, value };
}

function parseOperatorRule_0(p: Lexer): string {
    if (p.match(TOKEN.Prefix)) {
        p.forward();
        return "prefix";
    } else if (p.match(TOKEN.Infix)) {
        p.forward();
        return "prefix";
    } else if (p.match(TOKEN.Postfix)) {
        p.forward();
        return "postfix";
    } else {
        p.throwParserError("unexpected token");
    }
}


export type A_LexerBlock = { kind: "LexerBlock"; name: string; rules: A_LexerRule[]; };

function parseLexerBlock(p: Lexer): A_LexerBlock {
    // p.expect(TOKEN.Lexer);
    p.forward();

    p.expect(TOKEN.Ident);
    const name = p.getValue();
    p.forward();

    p.forwardWithExpect(TOKEN.OpenBracket);

    const children: A_LexerRule[] = [];
    while (p.match(TOKEN.Ident) || p.match(TOKEN.Token) || p.match(TOKEN.Ignored)) {
        children.push(parseLexerRule(p));
    }

    p.forwardWithExpect(TOKEN.CloseBracket);

    return { kind: "LexerBlock", name, rules: children };
}


export type A_LexerRule = { kind: "LexerRule"; name: string; expr: A_LexerExpr };

function parseLexerRule(p: Lexer): A_LexerRule {
    let ruleAttr: "none" | "token" | "ignoredToken" = "none";
    if (p.match(TOKEN.Token)) {
        p.forward();
        ruleAttr = "token";
    }
    if (p.match(TOKEN.Token, 1)) {
        p.expect(TOKEN.Ignored);
        p.forward();
        p.forward();
        ruleAttr = "ignoredToken";
    }

    p.expect(TOKEN.Ident);
    const name = p.getValue();
    p.forward();

    p.forwardWithExpect(TOKEN.Equal);

    const expr = parseLexerExpr1(p);

    p.forwardWithExpect(TOKEN.Semi);

    return { kind: "LexerRule", name, expr };
}


export type A_LexerExpr = A_LexerAlternate | A_LexerSequence | A_LexerMany | A_LexerOption | A_LexerMatch | A_LexerNotMatch | A_AnyChar | A_Str | A_CharRange | A_Ref | A_EOF;
export type A_LexerAlternate = { kind: "LexerAlternate"; exprs: A_LexerExpr[]; };
export type A_LexerMany = { kind: "LexerMany"; minimum: number; expr: A_LexerExpr; };
export type A_LexerOption = { kind: "LexerOption"; expr: A_LexerExpr; };
export type A_LexerMatch = { kind: "LexerMatch"; expr: A_LexerExpr; };
export type A_LexerNotMatch = { kind: "LexerNotMatch"; expr: A_LexerExpr; };


function parseLexerExpr1(p: Lexer): A_LexerExpr {
    const children: A_LexerExpr[] = [];

    children.push(parseLexerExpr2(p));

    while (p.match(TOKEN.Slash)) {
        p.forward();
        children.push(parseLexerExpr2(p));
    }

    if (children.length === 1) {
        return children[0];
    } else {
        return { kind: "LexerAlternate", exprs: children } satisfies A_LexerAlternate;
    }
}


export type A_LexerSequence = { kind: "LexerSequence"; exprs: A_LexerExpr[]; };

function parseLexerExpr2(p: Lexer): A_LexerExpr {
    const children: A_LexerExpr[] = [];

    while (p.match(TOKEN.Amp) || p.match(TOKEN.Excl) || p.match(TOKEN.OpenParen) || p.match(TOKEN.Dot) || p.match(TOKEN.Dollar) || p.match(TOKEN.Str) || p.match(TOKEN.CharRange) || p.match(TOKEN.Ident)) {
        children.push(parseLexerExpr3(p));
    }

    if (children.length === 1) {
        return children[0];
    } else if (children.length > 1) {
        return { kind: "LexerSequence", exprs: children } satisfies A_LexerSequence;
    } else {
        p.throwParserError("unexpected token");
    }
}


function parseLexerExpr3(p: Lexer): A_LexerExpr {
    const expr = parseLexerExpr4(p);

    let op: { kind: "LexerMany", minimum: number } | { kind: "LexerOption" } | undefined;
    if (p.match(TOKEN.Aste) || p.match(TOKEN.Plus) || p.match(TOKEN.Ques)) {
        op = parseLexerExpr3_0(p);
    }

    if (op != null) {
        return { ...op, expr };
    } else {
        return expr;
    }
}

function parseLexerExpr3_0(p: Lexer): { kind: "LexerMany", minimum: number } | { kind: "LexerOption" } {
    if (p.match(TOKEN.Aste)) {
        p.forward();
        return { kind: "LexerMany", minimum: 0 };
    } else if (p.match(TOKEN.Plus)) {
        p.forward();
        return { kind: "LexerMany", minimum: 1 };
    } else if (p.match(TOKEN.Ques)) {
        p.forward();
        return { kind: "LexerOption" };
    } else {
        p.throwParserError("unexpected token");
    }
}


function parseLexerExpr4(p: Lexer): A_LexerExpr {
    let op: { kind: "LexerMatch" } | { kind: "LexerNotMatch" } | undefined;
    if (p.match(TOKEN.Amp) || p.match(TOKEN.Excl)) {
        op = parseLexerExpr4_0(p);
    }

    const expr = parseLexerAtom(p);

    if (op != null) {
        return { ...op, expr };
    } else {
        return expr;
    }
}

function parseLexerExpr4_0(p: Lexer): { kind: "LexerMatch" } | { kind: "LexerNotMatch" } {
    if (p.match(TOKEN.Amp)) {
        p.forward();
        return { kind: "LexerMatch" };
    } else if (p.match(TOKEN.Excl)) {
        p.forward();
        return { kind: "LexerNotMatch" };
    } else {
        p.throwParserError("unexpected token");
    }
}


export type A_AnyChar = { kind: "AnyChar"; };
export type A_Str = { kind: "Str"; value: string; };
export type A_CharRange = { kind: "CharRange"; };
export type A_EOF = { kind: "EOF"; };

function parseLexerAtom(p: Lexer): A_LexerExpr {
    if (p.match(TOKEN.OpenParen)) {
        p.forward();
        const expr = parseLexerExpr1(p);
        p.forwardWithExpect(TOKEN.CloseParen);
        return expr;
    } else if (p.match(TOKEN.Dot)) {
        p.forward();
        return { kind: "AnyChar" };
    } else if (p.match(TOKEN.Dollar)) {
        p.forward();
        return { kind: "EOF" };
    } else if (p.match(TOKEN.Str)) {
        const value = p.getValue();
        p.forward();
        return { kind: "Str", value };
    } else if (p.match(TOKEN.CharRange)) {
        p.forward();
        return { kind: "CharRange" };
    } else if (p.match(TOKEN.Ident)) {
        const name = p.getValue();
        p.forward();
        return { kind: "Ref", name };
    } else {
        p.throwParserError("unexpected token");
    }
}
