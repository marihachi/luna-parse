// 構文解析 Scanから取得したトークン列をhighTreeに変換する

import { Scan } from "./scan.js";

export type ParseState = {
};

export function parse(source: string): Toplevel[] {
    const s = new Scan(source);
    const state: ParseState = {};

    let members: Toplevel[] = [];
    while (s.is({ word: "config" }) || s.is({ word: "rule" }) || s.is({ word: "expression" })) {
        members.push(parseToplevel(s, state));
    }
    s.forwardExpect({ kind: "EOF" });

    return members;
}


export type Toplevel = ConfigDecl | RuleDecl | ExpressionDecl;

function parseToplevel(s: Scan, state: ParseState): Toplevel {
    if (s.is({ word: "config" })) {
        return parseConfigDecl(s, state);
    }
    if (s.is({ word: "rule" })) {
        return parseRuleDecl(s, state);
    }
    if (s.is({ word: "expression" })) {
        return parseExpressionDecl(s, state);
    }
    throw new Error("unexpected token");
}


export type ConfigDecl = { kind: "ConfigDecl"; };

function parseConfigDecl(s: Scan, state: ParseState): ConfigDecl {
    s.forward();

    s.throwIfNotExpected({ kind: "Word" });
    const name = s.getValue();
    s.forward();

    s.throwIfNotExpected({ kind: "Word" });
    const value = s.getValue();
    s.forward();

    return { kind: "ConfigDecl" };
}


export type RuleDecl = { kind: "RuleDecl"; left: string; right: Ident };

function parseRuleDecl(s: Scan, state: ParseState): RuleDecl {
    s.forward();

    s.throwIfNotExpected({ kind: "Word" });
    const left = s.getValue();
    s.forward();

    s.forwardExpect({ kind: "Equal" });

    let right: Ident | undefined;
    if (s.is({ kind: "Word" })) {
        right = parseIdent(s, state);
    }

    if (!right) {
        throw new Error("Expected right-side tokens");
    }

    return { kind: "RuleDecl", left, right };
}


export type ExpressionDecl = { kind: "ExpressionDecl"; };

function parseExpressionDecl(s: Scan, state: ParseState): ExpressionDecl {
    s.forward();

    s.throwIfNotExpected({ kind: "Word" });
    const left = s.getValue();
    s.forward();

    s.forwardExpect({ kind: "OpenBracket" });

    let item: OperatorLevel | ExprItem;
    if (s.is({ word: "atom" })) {
        item = parseExprItem(s, state);
    } else if (s.is({ word: "level" })) {
        item = parseOperatorLevel(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }

    s.forwardExpect({ kind: "CloseBracket" });

    return { kind: "ExpressionDecl" };
}


export type ExprItem = { kind: "ExprItem"; };

function parseExprItem(s: Scan, state: ParseState): ExprItem {
    s.forward();

    if (s.is({ kind: "Word" })) {
        parseIdent(s, state);
    }

    return { kind: "ExprItem" };
}


export type OperatorLevel = { kind: "OperatorLevel"; };

function parseOperatorLevel(s: Scan, state: ParseState): OperatorLevel {
    s.forward();

    s.forwardExpect({ kind: "OpenBracket" });

    if (s.is({ word: "prefix" }) || s.is({ word: "infix" }) || s.is({ word: "postfix" })) {
        parseOperatorItem(s, state);
    } else {
        s.throwSyntaxError("unexpected token");
    }

    s.forwardExpect({ kind: "CloseBracket" });

    return { kind: "OperatorLevel" };
}


export type OperatorItem = { kind: "OperatorItem"; };

function parseOperatorItem(s: Scan, state: ParseState): OperatorItem {
    const opKind = s.getValue();
    s.forward();

    s.forwardExpect({ word: "operator" });

    s.throwIfNotExpected({ kind: "String" });

    return { kind: "OperatorItem" };
}


export type Ident = { kind: "Ident"; name: string; };

function parseIdent(s: Scan, state: ParseState): Ident {
    const name = s.getValue();
    s.forward();

    return { kind: "Ident", name };
}


// TODO: Operator-precedence parser
