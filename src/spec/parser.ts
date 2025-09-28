// 構文解析 トークン列をASTに変換する

import { Lexer, TOKEN } from "./lexer.js";

// parser for luna-parse spec

export function parse(source: string): A_Toplevel[] {
    const p = new Lexer(source);

    const children: A_Toplevel[] = [];
    while (p.match(TOKEN.Parser) || p.match(TOKEN.Lexer)) {
        children.push(parseToplevel(p));
    }

    p.forwardWithExpect(TOKEN.EOF);

    return children;
}


export type A_Toplevel = A_ParserBlock | A_LexerBlock;

function parseToplevel(p: Lexer): A_Toplevel {
    if (p.match(TOKEN.Parser)) {
        return parseParserBlock(p);
    } else if (p.match(TOKEN.Lexer)) {
        return parseLexerBlock(p);
    } else {
        p.throwSyntaxError("unexpected token");
    }
}


export type A_ParserBlock = { kind: "ParserBlock"; name: string; };

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

    return { kind: "ParserBlock", name };
}


export type A_Rule = { kind: "Rule"; name: string; expr: A_Expr };

function parseRule(p: Lexer): A_Rule {
    // p.expect(TOKEN.Ident);
    const name = p.getValue();
    p.forward();

    p.forwardWithExpect(TOKEN.Equal);

    const expr = parseExpr1(p);

    p.forwardWithExpect(TOKEN.Semi);

    return { kind: "Rule", name, expr };
}


export type A_Expr = A_Sequence | A_Alternate | A_Repeat | A_Option | A_Matched | A_NotMatched | A_ExpressionBlock | A_Ref;

export type A_Alternate = { kind: "Alternate"; children: A_Expr[]; };

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
        return { kind: "Alternate", children } satisfies A_Alternate;
    }
}


export type A_Sequence = { kind: "Sequence"; children: A_Expr[]; };

function parseExpr2(p: Lexer): A_Expr {
    const children: A_Expr[] = [];

    while (p.match(TOKEN.Amp) || p.match(TOKEN.Excl) || p.match(TOKEN.OpenParen) || p.match(TOKEN.Expression) || p.match(TOKEN.Ident)) {
        children.push(parseExpr3(p));
    }

    if (children.length === 1) {
        return children[0];
    } else if (children.length > 1) {
        return { kind: "Sequence", children } satisfies A_Sequence;
    } else {
        p.throwSyntaxError("unexpected token");
    }
}


export type A_Repeat = { kind: "Repeat"; };

export type A_Option = { kind: "Option"; };

function parseExpr3(p: Lexer): A_Expr {
    const expr = parseExpr4(p);

    // option
    if (p.match(TOKEN.Aste) || p.match(TOKEN.Plus) || p.match(TOKEN.Ques)) {
        // TODO
    }

    return expr;
}


export type A_Matched = { kind: "Matched"; };

export type A_NotMatched = {};

function parseExpr4(p: Lexer): A_Expr {
    // option
    if (p.match(TOKEN.Amp) || p.match(TOKEN.Excl)) {
        // TODO
    }

    const expr = parseAtom(p);

    return expr;
}


export type A_Ref = { kind: "Ref"; name: string; };

function parseAtom(p: Lexer): A_Expr {
    if (p.match(TOKEN.OpenParen)) {
        p.forward();
        const expr = parseExpr1(p);
        p.forwardWithExpect(TOKEN.CloseParen);
        return expr;
    } else if (p.match(TOKEN.Expression)) {
        return parseExpressionBlock(p);
    } else if (p.match(TOKEN.Ident)) {
        const name = p.getValue();
        p.forward();
        return { kind: "Ref", name } satisfies A_Ref;
    } else {
        p.throwSyntaxError("unexpected token");
    }
}


export type A_ExpressionBlock = { kind: "ExpressionBlock"; children: (A_OperatorLevel | A_ExprItem)[]; };

function parseExpressionBlock(p: Lexer): A_ExpressionBlock {
    // p.expect(TOKEN.Expression);
    p.forward();

    p.forwardWithExpect(TOKEN.OpenBracket);

    const children: (A_OperatorLevel | A_ExprItem)[] = [];
    while (p.match(TOKEN.Atom) || p.match(TOKEN.Operator)) {
        children.push(parseExpressionBlock_0(p));
    }

    p.forwardWithExpect(TOKEN.CloseBracket);

    return { kind: "ExpressionBlock", children };
}

function parseExpressionBlock_0(p: Lexer): A_OperatorLevel | A_ExprItem {
    if (p.match(TOKEN.Atom)) {
        return parseExprAtom(p);
    } else if (p.match(TOKEN.Operator)) {
        return parseOperatorGroup(p);
    } else {
        p.throwSyntaxError("unexpected token");
    }
}


export type A_ExprItem = { kind: "ExprItem"; name: string; };

function parseExprAtom(p: Lexer): A_ExprItem {
    // p.expect(TOKEN.Atom);
    p.forward();

    let name: string;
    if (p.match(TOKEN.Ident)) {
        name = p.getValue();
        p.forward();
    } else {
        p.throwSyntaxError("unexpected token");
    }

    return { kind: "ExprItem", name };
}


export type A_OperatorLevel = { kind: "OperatorLevel"; children: A_OperatorItem[]; };

function parseOperatorGroup(p: Lexer): A_OperatorLevel {
    // p.expect(TOKEN.Operator);
    p.forward();

    p.forwardWithExpect(TOKEN.Group);

    p.forwardWithExpect(TOKEN.OpenBracket);

    let children: A_OperatorItem[] = [];
    while (p.match(TOKEN.Prefix) || p.match(TOKEN.Infix) || p.match(TOKEN.Postfix)) {
        children.push(parseOperatorRule(p));
    }

    p.forwardWithExpect(TOKEN.CloseBracket);

    return { kind: "OperatorLevel", children };
}


export type A_OperatorItem = { kind: "OperatorItem"; operatorKind: string; value: string; };

function parseOperatorRule(p: Lexer): A_OperatorItem {
    const operatorKind = parseOperatorRule_0(p);

    p.forwardWithExpect(TOKEN.Operator);

    p.expect(TOKEN.Str);
    let value = p.getValue();
    p.forward();

    return { kind: "OperatorItem", operatorKind, value };
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
        p.throwSyntaxError("unexpected token");
    }
}


export type A_LexerBlock = { kind: "LexerBlock"; name: string; };

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

    return { kind: "LexerBlock", name };
}



export type A_LexerRule = { kind: "LexerRule"; name: string; children: string };

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

    // TODO
    let children: string | undefined;
    if (p.match(TOKEN.Ident)) {
        children = p.getValue();
        p.forward();
    } else {
        p.throwSyntaxError("unexpected token");
    }

    p.forwardWithExpect(TOKEN.Semi);

    return { kind: "LexerRule", name, children };
}
