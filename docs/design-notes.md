## lunaparseの文法
```
parser SpecParser {
    root = toplevel*;
    toplevel = parserBlock / lexerBlock / exprBlock;
    parserBlock = Parser OpenBracket CloseBracket;
    ruleStatement = Ident Equal expr;
    lexerBlock = Lexer OpenBracket CloseBracket;
    exprBlock = Expression Ident OpenBracket exprGroup* CloseBracket;
    exprGroup = Operator Group OpenBracket exprOperator* CloseBracket;
    exprOperator = (Prefix / Infix / Postfix) Operator Ident;
    item = Ident / Dot / OpenParen expr CloseParen;
}

lexer SpecLexer {
    " " / "\t" / "\r\n" / "\n" => {};
    "*" => ASTA;
    "+" => PLUS;
    "!" => EXCL;
    "?" => QUES;
    "/" => SLASH;
    "." => Dot;
    "=" => Equal;
    "{" => OpenBracket;
    "}" => CloseBracket;
    "(" => OpenParen;
    ")" => CloseParen;
    "parser" => Parser;
    "lexer" => Lexer;
    "expression" => Expression;
    "prefix" => Prefix;
    "infix" => Infix;
    "postfix" => Postfix;
    "operator" => Operator;
    "group" => Group;
    "\"" (!"\"" .)+ "\"" => Str;
    [a-zA-Z_] [a-zA-Z0-9_]* => Ident;
}
```

例
```
parser ExampleParser {
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
