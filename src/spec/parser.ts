// 構文解析 トークン列をASTに変換する

import { Lexer } from "./lexer.js";

// parser for luna-parse spec

export function parse(source: string): A_Toplevel[] {
    const p = new Lexer(source);

    const children: A_Toplevel[] = [];
    while (p.match({ kind: "Parser" }) || p.match({ kind: "Lexer" })) {
        children.push(parseToplevel(p));
    }

    p.forwardWithExpect({ kind: "EOF" });

    return children;
}


export type A_Toplevel = A_ParserBlock | A_LexerBlock;

function parseToplevel(p: Lexer): A_Toplevel {
    if (p.match({ kind: "Parser" })) {
        return parseParserBlock(p);
    } else if (p.match({ kind: "Lexer" })) {
        return parseLexerBlock(p);
    } else {
        p.throwSyntaxError("unexpected token");
    }
}


export type A_ParserBlock = { kind: "ParserBlock"; };

function parseParserBlock(p: Lexer): A_ParserBlock {
    p.forward();

    p.expect({ kind: "Ident" });
    const name = p.getValue();
    p.forward();

    p.forwardWithExpect({ kind: "OpenBracket" });

    const children: A_Rule[] = [];
    while (p.match({ kind: "Ident" })) {
        children.push(parseRule(p));
    }

    p.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "ParserBlock" };
}


export type A_Sequence = {};
// TODO

export type A_Alternate = {};
// TODO



export type A_LexerBlock = { kind: "LexerBlock"; };

function parseLexerBlock(p: Lexer): A_LexerBlock {
    p.forward();

    p.expect({ kind: "Ident" });
    const name = p.getValue();
    p.forward();

    p.forwardWithExpect({ kind: "OpenBracket" });

    const children: A_LexerRule[] = [];
    while (p.match({ kind: "Ident" }) || p.match({ kind: "Token" }) || p.match({ kind: "Ignored" })) {
        children.push(parseLexerRule(p));
    }

    p.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "LexerBlock" };
}


export type A_Rule = { kind: "Rule"; name: string; children: string };

function parseRule(p: Lexer): A_Rule {
    p.expect({ kind: "Ident" });
    const name = p.getValue();
    p.forward();

    p.forwardWithExpect({ kind: "Equal" });

    let children: string | undefined;
    if (p.match({ kind: "Ident" })) {
        children = p.getValue();
        p.forward();
    } else {
        p.throwSyntaxError("unexpected token");
    }

    p.forwardWithExpect({ kind: "Semi" });

    return { kind: "Rule", name, children };
}


export type A_LexerRule = { kind: "LexerRule"; name: string; children: string };

function parseLexerRule(p: Lexer): A_LexerRule {
    let ruleAttr: "none" | "token" | "ignoredToken" = "none";
    if (p.match({ kind: "Token" })) {
        p.forward();
        ruleAttr = "token";
    }
    if (p.match({ kind: "Token" }, 1)) {
        p.expect({ kind: "Ignored" });
        p.forward();
        p.forward();
        ruleAttr = "ignoredToken";
    }

    p.expect({ kind: "Ident" });
    const name = p.getValue();
    p.forward();

    p.forwardWithExpect({ kind: "Equal" });

    // TODO
    let children: string | undefined;
    if (p.match({ kind: "Ident" })) {
        children = p.getValue();
        p.forward();
    } else {
        p.throwSyntaxError("unexpected token");
    }

    p.forwardWithExpect({ kind: "Semi" });

    return { kind: "LexerRule", name, children };
}


export type A_ExpressionBlock = { kind: "ExpressionBlock"; children: (A_OperatorLevel | A_ExprItem)[]; };

function parseExpressionBlock(p: Lexer): A_ExpressionBlock {
    p.forward();

    p.forwardWithExpect({ kind: "OpenBracket" });

    const children: (A_OperatorLevel | A_ExprItem)[] = [];
    while (p.match({ kind: "Atom" }) || p.match({ kind: "Operator" })) {
        children.push(parseExpressionBlock_0(p));
    }

    p.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "ExpressionBlock", children };
}

function parseExpressionBlock_0(p: Lexer): A_OperatorLevel | A_ExprItem {
    if (p.match({ kind: "Atom" })) {
        return parseExprAtom(p);
    } else if (p.match({ kind: "Operator" })) {
        return parseOperatorGroup(p);
    } else {
        p.throwSyntaxError("unexpected token");
    }
}


export type A_ExprItem = { kind: "ExprItem"; name: string; };

function parseExprAtom(p: Lexer): A_ExprItem {
    p.forward();

    let name: string;
    if (p.match({ kind: "Ident" })) {
        name = p.getValue();
        p.forward();
    } else {
        p.throwSyntaxError("unexpected token");
    }

    return { kind: "ExprItem", name };
}


export type A_OperatorLevel = { kind: "OperatorLevel"; children: A_OperatorItem[]; };

function parseOperatorGroup(p: Lexer): A_OperatorLevel {
    p.forward();

    p.forwardWithExpect({ kind: "Group" });

    p.forwardWithExpect({ kind: "OpenBracket" });

    let children: A_OperatorItem[] = [];
    while (p.match({ kind: "Prefix" }) || p.match({ kind: "Infix" }) || p.match({ kind: "Postfix" })) {
        children.push(parseOperatorRule(p));
    }

    p.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "OperatorLevel", children };
}


export type A_OperatorItem = { kind: "OperatorItem"; operatorKind: string; value: string; };

function parseOperatorRule(p: Lexer): A_OperatorItem {
    const operatorKind = parseOperatorRule_0(p);

    p.forwardWithExpect({ kind: "Operator" });

    p.expect({ kind: "Str" });
    let value = p.getValue();
    p.forward();

    return { kind: "OperatorItem", operatorKind, value };
}

function parseOperatorRule_0(p: Lexer): string {
    if (p.match({ kind: "Prefix" })) {
        p.forward();
        return "prefix";
    } else if (p.match({ kind: "Infix" })) {
        p.forward();
        return "prefix";
    } else if (p.match({ kind: "Postfix" })) {
        p.forward();
        return "postfix";
    } else {
        p.throwSyntaxError("unexpected token");
    }
}
