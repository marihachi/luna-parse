## lunaparseの文法
```
parser Parser {
    root = _ toplevels _;
    toplevels = toplevel? (_ toplevel)*;
    toplevel = parserBlock / exprBlock;
    parserBlock = "parser" _ IDENT _ "{" _ rules _ "}";
    rules = rule? (_ rule)*;
    rule = IDENT _ "=" _ expr1 _ ";";
    expr1 = expr2 (_ "/" _ expr2)*;
    expr2 = expr3 (_ expr3)*;
    expr3 = expr4 _ ("*" / "+" / "?")?;
    expr4 = ("&" / "!")? _ atom;
    atom = "(" expr1 ")" / "." / STR / CharMatch / IDENT;
    exprBlock = "expression" _ IDENT _ "{" _ operatorGroups _ "}";
    operatorGroups = operatorGroup? (_ operatorGroup)*;
    operatorGroup = "operator" "group" _ "{" _ operators _ "}";
    operators = operator? (_ operator)*;
    operator = ("prefix" / "infix" / "postfix") _ "operator" STR;
    _ = (WSP / LF)*;
    WSP = " " / "\t";
    LF = "\r\n" / "\n";
    STR = "\"" StrChar* "\"";
    StrChar
        = EscapeSeq
        / !"\"" .;
    CharMatch = "[" (CharRange / Char)* "]";
    CharRange = Char "-" Char;
    Char
        = EscapeSeq
        / !"]" .;
    EscapeSeq = "\\" ("\\" / "\"" / "n" / "r" / "t");
    IDENT = [a-zA-Z_] ([a-zA-Z_] / [0-9])*;
}
```

例
```
parser Parser {
    parent = sub*;
    sub = sub1 / sub2;
    sub1 = "sub1";
    sub2 = "sub2";
}
```
```ts
function parseParent(s: Scan): void {
    let children: Sub[] = [];
    while (s.match({ word: "sub1" }) || s.match({ word: "sub2" })) {
        children.push(parseSub(s));
    }
}
type Sub = Sub1 | Sub2;
function parseSub(s: Scan): Sub {
    if (s.match({ word: "sub1" })) {
        return parseSub1(s);
    } else if (s.match({ word: "sub2" })) {
        return parseSub2(s);
    } else {
        s.throwSyntaxError("unexpected token");
    }
}
type Sub1 = { kind: "sub1" };
function parseSub1(s: Scan): Sub1 {
    s.forward();
    return { kind: "sub1" };
}
type Sub2 = { kind: "sub2" };
function parseSub2(s: Scan): Sub2 {
    s.forward();
    return { kind: "sub2" };
}
```
