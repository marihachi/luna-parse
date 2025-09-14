// 構文解析 Scanから取得したトークン列をhighTreeに変換する

import { Scan } from "./scan.js";

export type ParseState = {
};

export function parse(source: string): Toplevel[] {
    const s = new Scan(source);
    const state: ParseState = {};

    const children: Toplevel[] = [];
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


export type ConfigDecl = { kind: "ConfigDecl"; key: string; value: string; };

function parseConfigDecl(s: Scan, state: ParseState): ConfigDecl {
    s.forward();

    s.expect({ kind: "Word" });
    const key = s.getValue();
    s.forward();

    s.expect({ kind: "Word" });
    const value = s.getValue();
    s.forward();

    return { kind: "ConfigDecl", key, value };
}


export type RuleDecl = { kind: "RuleDecl"; name: string; children: string };

function parseRuleDecl(s: Scan, state: ParseState): RuleDecl {
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


// TODO: rule sequence


// TODO: rule alternate


export type ExpressionDecl = { kind: "ExpressionDecl"; name: string; children: (OperatorLevel | ExprItem)[]; };

function parseExpressionDecl(s: Scan, state: ParseState): ExpressionDecl {
    s.forward();

    s.expect({ kind: "Word" });
    const name = s.getValue();
    s.forward();

    s.forwardWithExpect({ kind: "OpenBracket" });

    const children: (OperatorLevel | ExprItem)[] = [];
    while (s.match({ word: "atom" }) || s.match({ word: "level" })) {
        children.push(parseExpressionDecl_0(s, state));
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "ExpressionDecl", name, children };
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


export type ExprItem = { kind: "ExprItem"; name: string; };

function parseExprItem(s: Scan, state: ParseState): ExprItem {
    s.forward();

    let name: string = parseIdent(s, state);

    return { kind: "ExprItem", name };
}


export type OperatorLevel = { kind: "OperatorLevel"; children: OperatorItem[]; };

function parseOperatorLevel(s: Scan, state: ParseState): OperatorLevel {
    s.forward();

    s.forwardWithExpect({ kind: "OpenBracket" });

    let children: OperatorItem[] = [];
    while (s.match({ word: "prefix" }) || s.match({ word: "infix" }) || s.match({ word: "postfix" })) {
        children.push(parseOperatorItem(s, state));
    }

    s.forwardWithExpect({ kind: "CloseBracket" });

    return { kind: "OperatorLevel", children };
}


export type OperatorItem = { kind: "OperatorItem"; operatorKind: string; value: string; };

function parseOperatorItem(s: Scan, state: ParseState): OperatorItem {
    const operatorKind = s.getValue();
    s.forward();

    s.forwardWithExpect({ word: "operator" });

    s.expect({ kind: "String" });
    let value = s.getValue();
    s.forward();

    return { kind: "OperatorItem", operatorKind, value };
}


function parseIdent(s: Scan, state: ParseState): string {
    const name = s.getValue();
    s.forward();

    return name;
}


// TODO: Operator-precedence parser
