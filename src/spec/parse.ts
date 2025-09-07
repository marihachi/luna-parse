// 構文解析 Scanから取得したトークン列をhighTreeに変換する

import { Scan } from "./scan.js";

export type ParseState = {
};

export function parse(source: string): Toplevel[] {
    const s = new Scan(source);
    const state: ParseState = {};

    let members: Toplevel[] = [];
    while (matchToplevel(s, state)) {
        members.push(parseToplevel(s, state));
    }
    s.forwardExpect("EOF");

    return members;
}


export type Toplevel = ConfigDecl | RuleDecl | ExpressionDecl;

function matchToplevel(s: Scan, state: ParseState): boolean {
    return s.isWord("config") || s.isWord("rule") || s.isWord("expression");
}

function parseToplevel(s: Scan, state: ParseState): Toplevel {
    switch (s.getValue()) {
        case "config":
            return parseConfigDecl(s, state);
        case "rule":
            return parseRuleDecl(s, state);
        case "expression":
            return parseExpressionDecl(s, state);
        default:
            throw new Error("unexpected token");
    }
}


export type ConfigDecl = { kind: "ConfigDecl"; };

function matchConfigDecl(s: Scan, state: ParseState): boolean {
    return s.isWord("config");
}

function parseConfigDecl(s: Scan, state: ParseState): ConfigDecl {
    s.forward();

    s.throwIfNotExpected("Word");
    const name = s.getValue();
    s.forward();

    s.throwIfNotExpected("Word");
    const value = s.getValue();
    s.forward();

    return { kind: "ConfigDecl" };
}


export type RuleDecl = { kind: "RuleDecl"; left: string; right: Ident };

function matchRuleDecl(s: Scan, state: ParseState): boolean {
    return s.isWord("rule");
}

function parseRuleDecl(s: Scan, state: ParseState): RuleDecl {
    s.forward();

    s.throwIfNotExpected("Word");
    const left = s.getValue();
    s.forward();

    s.forwardExpect("Equal");

    let right: Ident | undefined;
    if (matchIdent(s, state)) {
        right = parseIdent(s, state);
    }

    if (!right) {
        throw new Error("Expected right-side tokens");
    }

    return { kind: "RuleDecl", left, right };
}


export type ExpressionDecl = { kind: "ExpressionDecl"; };

function matchExpressionDecl(s: Scan, state: ParseState): boolean {
    return s.isWord("expression");
}

function parseExpressionDecl(s: Scan, state: ParseState): ExpressionDecl {
    s.forward();

    s.throwIfNotExpected("Word");
    const left = s.getValue();
    s.forward();

    s.forwardExpect("OpenBracket");

    //parseExprItem(s, state);
    //parseOperatorGroup(s, state);

    s.forwardExpect("CloseBracket");

    return { kind: "ExpressionDecl" };
}


function matchOperatorGroup(s: Scan, state: ParseState): boolean {
    return s.isWord("level");
}

function parseOperatorGroup(s: Scan, state: ParseState) {
    s.forward();

    s.forwardExpect("OpenBracket");

    parseOperator(s, state);

    s.forwardExpect("CloseBracket");
}


function matchOperator(s: Scan, state: ParseState): boolean {
    return s.isWord("prefix") || s.isWord("infix") || s.isWord("postfix");
}

function parseOperator(s: Scan, state: ParseState) {
    const opKind = s.getValue();
    s.forward();

    s.forwardExpectWord("operator");

    s.throwIfNotExpected("String");
}


function matchExprItem(s: Scan, state: ParseState): boolean {
    return s.isWord("atom");
}

function parseExprItem(s: Scan, state: ParseState) {
    s.forward();

    parseIdent(s, state);
}


export type Ident = { kind: "Ident"; name: string; };

function matchIdent(s: Scan, state: ParseState): boolean {
    return s.is("Word");
}

function parseIdent(s: Scan, state: ParseState): Ident {
    const name = s.getValue();
    s.forward();

    return { kind: "Ident", name };
}


// TODO: Operator-precedence parser
