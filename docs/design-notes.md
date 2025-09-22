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
    _ = (" " / "\t" / "\r\n" / "\n")*;
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

## 使用イメージ
```
parser Parser {
    parent = sub*;
    sub = sub1 / sub2;
    sub1 = "sub1" "continued1";
    sub2 = "sub2" "continued2";
}
```
```ts
function parseParent(p: ParseContext): void {
    let children: Sub[] = [];
    while (!p.eof() && (p.match("sub1") || p.match("sub2"))) {
        children.push(parseSub(p));
    }
}
type Sub = Sub1 | Sub2;
function parseSub(p: ParseContext): Sub {
    if (p.match("sub1")) {
        return parseSub1(p);
    } else if (p.match("sub2")) {
        return parseSub2(p);
    } else {
        p.throwSyntaxError("unexpected token");
    }
}
type Sub1 = { kind: "sub1" };
function parseSub1(p: ParseContext): Sub1 {
    p.acceptMatch();
    p.forwardWithExpect("continued1");
    return { kind: "sub1" };
}
type Sub2 = { kind: "sub2" };
function parseSub2(p: ParseContext): Sub2 {
    p.acceptMatch();
    p.forwardWithExpect("continued2");
    return { kind: "sub2" };
}
```
