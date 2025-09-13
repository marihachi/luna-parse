// 構文解析 Scanから取得したトークン列をhighTreeに変換する

import { Scan } from "./scan.js";

export type ParseState = {
};

export function parse(source: string): Toplevel[] {
    const s = new Scan(source);
    const state: ParseState = {};

    let children: Toplevel[] = [];
    while (s.match({ word: "config" }) || s.match({ word: "rule" }) || s.match({ word: "expression" })) {
        children.push(parseToplevel(s, state));
    }

    s.forwardWithExpect({ kind: "EOF" });

    return children;
}


export type Toplevel = ConfigDecl | RuleDecl | ExpressionDecl;

function parseToplevel(s: Scan, state: ParseState): Toplevel {
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


export type ConfigDecl = { kind: "ConfigDecl"; };

function parseConfigDecl(s: Scan, state: ParseState): ConfigDecl {
    s.forward();

    s.expect({ kind: "Word" });
    const name = s.getValue();
    s.forward();

    s.expect({ kind: "Word" });
    const value = s.getValue();
    s.forward();

    return { kind: "ConfigDecl" };
}


export type RuleDecl = { kind: "RuleDecl"; left: string; right: Ident };

function parseRuleDecl(s: Scan, state: ParseState): RuleDecl {
    s.forward();

    s.expect({ kind: "Word" });
    const left = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "Equal" });

    let right: Ident | undefined;
    if (s.match({ kind: "Word" })) {
        right = parseIdent(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }

    return { kind: "RuleDecl", left, right };
}


export type ExpressionDecl = { kind: "ExpressionDecl"; };

function parseExpressionDecl(s: Scan, state: ParseState): ExpressionDecl {
    s.forward();

    s.expect({ kind: "Word" });
    const left = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "OpenBracket" });

    if (s.match({ word: "atom" }) || s.match({ word: "level" })) {
        let item: OperatorLevel | ExprItem = parseExpressionDecl_0(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "ExpressionDecl" };
}

function parseExpressionDecl_0(s: Scan, state: ParseState): OperatorLevel | ExprItem {
    if (s.match({ word: "atom" })) {
        return parseExprItem(s, state);
    } else if (s.match({ word: "level" })) {
        return parseOperatorLevel(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }
}


export type ExprItem = { kind: "ExprItem"; };

function parseExprItem(s: Scan, state: ParseState): ExprItem {
    s.forward();

    if (s.match({ kind: "Word" })) {
        parseIdent(s, state);
    }

    return { kind: "ExprItem" };
}


export type OperatorLevel = { kind: "OperatorLevel"; };

function parseOperatorLevel(s: Scan, state: ParseState): OperatorLevel {
    s.forward();

    s.forwardWithExpect({ kind: "OpenBracket" });

    let children: OperatorItem[] = [];
    while (s.match({ word: "prefix" }) || s.match({ word: "infix" }) || s.match({ word: "postfix" })) {
        children.push(parseOperatorItem(s, state));
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "OperatorLevel" };
}


export type OperatorItem = { kind: "OperatorItem"; };

function parseOperatorItem(s: Scan, state: ParseState): OperatorItem {
    const opKind = s.getValue();
    s.forward();

    s.forwardWithExpect({ word: "operator" });

    s.expect({ kind: "String" });

    return { kind: "OperatorItem" };
}


export type Ident = { kind: "Ident"; name: string; };

function parseIdent(s: Scan, state: ParseState): Ident {
    const name = s.getValue();
    s.forward();

    return { kind: "Ident", name };
}


// TODO: Operator-precedence parser
