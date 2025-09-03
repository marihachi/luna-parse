// 構文解析 Scanから取得したトークン列をhighTreeに変換する

import { Scan } from "./scan.js";

export type ParseState = {
};

export function parse(source: string): void {
    const s = new Scan(source);
    const state: ParseState = {};

    let rule;
    if (matchRule(s, state)) {
        rule = parseRule(s, state);
    }
}


export type Rule = { kind: "Rule"; left: string; right: Ref };

function matchRule(s: Scan, state: ParseState): boolean {
    return s.is("Word");
}

function parseRule(s: Scan, state: ParseState): Rule {
    s.throwIfNotExpected("Word");
    const left = s.getValue();
    s.nextToken();

    s.expect("Equal");

    let right: Ref | undefined;
    if (matchRef(s, state)) {
        right = parseRef(s, state);
    }

    if (!right) {
        throw new Error("Expected right-side tokens");
    }

    return { kind: "Rule", left, right };
}


export type Ref = { kind: "Ref"; name: string; };

function matchRef(s: Scan, state: ParseState): boolean {
    return s.is("Word");
}

function parseRef(s: Scan, state: ParseState): Ref {
    const name = s.getValue();
    s.nextToken();

    return { kind: "Ref", name };
}
