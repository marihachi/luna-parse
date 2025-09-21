## lunaparseの文法
```
parser Parser {
    root = _ toplevels? _;
    toplevels = toplevel (_ toplevel)*
    toplevel = parserBlock / lexerBlock / exprBlock;
    parserBlock = PARSER _ OPEN_BRACKET _ CLOSE_BRACKET;
    ruleStatement = IDENT _ EQ _ expr;
    lexerBlock = LEXER _ OPEN_BRACKET _ CLOSE_BRACKET;
    exprBlock = EXPRESSION _ IDENT _ OPEN_BRACKET _ exprGroups? _ CLOSE_BRACKET;
    exprGroups = exprGroup (_ exprGroup)*
    exprGroup = OPERATOR GROUP _ OPEN_BRACKET _ exprOperators? _ CLOSE_BRACKET;
    exprOperators = exprOperator (_ exprOperator)*
    exprOperator = (PREFIX | INFIX | POSTFIX) _ OPERATOR IDENT;
    item = IDENT | DOT | OPEN_PAREN expr CLOSE_PAREN;
    _ = (WSP / LF)*
}

lexer Lexer {
    WSP = " " / "\t";
    LF = "\r\n" / "\n";
    ASTA = "*";
    PLUS = "+";
    EXCL = "!";
    QUES = "?";
    SLASH = "/";
    DOT = ".";
    EQ = "=";
    OPEN_BRACKET = "{";
    CLOSE_BRACKET = "}";
    OPEN_PAREN = "(";
    CLOSE_PAREN = ")";
    PARSER = "parser";
    LEXER = "lexer";
    EXPRESSION = "expression";
    PREFIX = "prefix";
    INFIX = "infix";
    POSTFIX = "postfix";
    OPERATOR = "operator";
    GROUP = "group";
    STR = "\"" (!"\"" .)+ "\"";
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
