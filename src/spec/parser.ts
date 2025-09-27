// 構文解析 トークン列をASTに変換する

import { Lexer } from "./lexer.js";

// parser for luna-parse spec

export function parse(source: string): A_Toplevel[] {
    const s = new Lexer(source);

    const children: A_Toplevel[] = [];
    while (s.match({ kind: "Parser" }) || s.match({ kind: "Lexer" })) {
        children.push(parseToplevel(s));
    }

    s.forwardWithExpect({ kind: "EOF" });

    return children;
}


export type A_Toplevel = A_ParserBlock | A_LexerBlock;

function parseToplevel(s: Lexer): A_Toplevel {
    if (s.match({ kind: "Parser" })) {
        return parseParserBlock(s);
    } else if (s.match({ kind: "Lexer" })) {
        return parseLexerBlock(s);
    } else {
        s.throwSyntaxError("unexpected token");
    }
}


export type A_ParserBlock = { kind: "ParserBlock"; };

function parseParserBlock(s: Lexer): A_ParserBlock {
    s.forward();

    s.expect({ kind: "Ident" });
    const name = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "OpenBracket" });

    const children: A_Rule[] = [];
    while (s.match({ kind: "Ident" })) {
        children.push(parseRule(s));
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "ParserBlock" };
}


export type A_Sequence = {};
// TODO

export type A_Alternate = {};
// TODO



export type A_LexerBlock = { kind: "LexerBlock"; };

function parseLexerBlock(s: Lexer): A_LexerBlock {
    s.forward();

    s.expect({ kind: "Ident" });
    const name = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "OpenBracket" });

    const children: A_LexerRule[] = [];
    while (s.match({ kind: "Ident" }) || s.match({ kind: "Token" }) || s.match({ kind: "Ignored" })) {
        children.push(parseLexerRule(s));
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "LexerBlock" };
}


export type A_Rule = { kind: "Rule"; name: string; children: string };

function parseRule(s: Lexer): A_Rule {
    s.expect({ kind: "Ident" });
    const name = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "Equal" });

    let children: string | undefined;
    if (s.match({ kind: "Ident" })) {
        children = s.getValue();
        s.forward();
    } else {
        s.throwSyntaxError("unexpected token");
    }

    s.forwardWithExpect({ kind: "Semi" });

    return { kind: "Rule", name, children };
}


export type A_LexerRule = { kind: "LexerRule"; name: string; children: string };

function parseLexerRule(s: Lexer): A_LexerRule {
    let ruleAttr: "none" | "token" | "ignoredToken" = "none";
    if (s.match({ kind: "Token" })) {
        s.forward();
        ruleAttr = "token";
    }
    if (s.match({ kind: "Token" }, 1)) {
        s.expect({ kind: "Ignored" });
        s.forward();
        s.forward();
        ruleAttr = "ignoredToken";
    }

    s.expect({ kind: "Ident" });
    const name = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "Equal" });

    // TODO
    let children: string | undefined;
    if (s.match({ kind: "Ident" })) {
        children = s.getValue();
        s.forward();
    } else {
        s.throwSyntaxError("unexpected token");
    }

    s.forwardWithExpect({ kind: "Semi" });

    return { kind: "LexerRule", name, children };
}


export type A_ExpressionBlock = { kind: "ExpressionBlock"; children: (A_OperatorLevel | A_ExprItem)[]; };

function parseExpressionBlock(s: Lexer): A_ExpressionBlock {
    s.forward();

    s.forwardWithExpect({ kind: "OpenBracket" });

    const children: (A_OperatorLevel | A_ExprItem)[] = [];
    while (s.match({ kind: "Atom" }) || s.match({ kind: "Operator" })) {
        children.push(parseExpressionBlock_0(s));
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "ExpressionBlock", children };
}

function parseExpressionBlock_0(s: Lexer): A_OperatorLevel | A_ExprItem {
    if (s.match({ kind: "Atom" })) {
        return parseExprAtom(s);
    } else if (s.match({ kind: "Operator" })) {
        return parseOperatorGroup(s);
    } else {
        s.throwSyntaxError("unexpected token");
    }
}


export type A_ExprItem = { kind: "ExprItem"; name: string; };

function parseExprAtom(s: Lexer): A_ExprItem {
    s.forward();

    let name: string;
    if (s.match({ kind: "Ident" })) {
        name = s.getValue();
        s.forward();
    } else {
        s.throwSyntaxError("unexpected token");
    }

    return { kind: "ExprItem", name };
}


export type A_OperatorLevel = { kind: "OperatorLevel"; children: A_OperatorItem[]; };

function parseOperatorGroup(s: Lexer): A_OperatorLevel {
    s.forward();

    s.forwardWithExpect({ kind: "Group" });

    s.forwardWithExpect({ kind: "OpenBracket" });

    let children: A_OperatorItem[] = [];
    while (s.match({ kind: "Prefix" }) || s.match({ kind: "Infix" }) || s.match({ kind: "Postfix" })) {
        children.push(parseOperatorRule(s));
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "OperatorLevel", children };
}


export type A_OperatorItem = { kind: "OperatorItem"; operatorKind: string; value: string; };

function parseOperatorRule(s: Lexer): A_OperatorItem {
    const operatorKind = parseOperatorRule_0(s);

    s.forwardWithExpect({ kind: "Operator" });

    s.expect({ kind: "Str" });
    let value = s.getValue();
    s.forward();

    return { kind: "OperatorItem", operatorKind, value };
}

function parseOperatorRule_0(s: Lexer): string {
    if (s.match({ kind: "Prefix" })) {
        s.forward();
        return "prefix";
    } else if (s.match({ kind: "Infix" })) {
        s.forward();
        return "prefix";
    } else if (s.match({ kind: "Postfix" })) {
        s.forward();
        return "postfix";
    } else {
        s.throwSyntaxError("unexpected token");
    }
}
