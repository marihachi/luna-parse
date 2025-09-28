import { Lexer, TOKEN } from "./lexer.js";

export function parse(source: string): Parent[] {
    const p = new Lexer(source);
    const children: Parent[] = [];
    while (p.match(TOKEN.Sub1) || p.match(TOKEN.Sub2)) {
        children.push(parseParent(p));
    }
    p.forwardWithExpect(TOKEN.EOF);
    return children;
}

type Parent = { kind: "Parent"; children: Sub[]; };
function parseParent(p: Lexer): Parent {
    let children: Sub[] = [];
    while (p.match(TOKEN.Sub1) || p.match(TOKEN.Sub2)) {
        children.push(parseSub(p));
    }
    p.forwardWithExpect(TOKEN.EOF);
    return { kind: "Parent", children } satisfies Parent;
}

type Sub = Sub1 | Sub2;
function parseSub(p: Lexer): Sub {
    if (p.match(TOKEN.Sub1)) {
        return parseSub1(p);
    } else if (p.match(TOKEN.Sub2)) {
        return parseSub2(p);
    } else {
        p.throwSyntaxError("unexpected token");
    }
}

type Sub1 = { kind: "sub1" };
function parseSub1(p: Lexer): Sub1 {
    p.forward();
    p.forwardWithExpect(TOKEN.Continued1);
    return { kind: "sub1" };
}

type Sub2 = { kind: "sub2" };
function parseSub2(p: Lexer): Sub2 {
    p.forward();
    p.forwardWithExpect(TOKEN.Continued2);
    return { kind: "sub2" };
}
