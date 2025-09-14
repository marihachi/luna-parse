## lunaparseの文法
```
config skipSpacing false

rule root = toplevel (_* toplevel)*
rule toplevel = config | ruleStatement | exprBlock
rule config = "config" ident ident
rule ruleStatement = "rule" ident _* "=" _* expr
rule exprBlock = "expression" _* ident " _* "{" _* exprLevel (_* exprLevel)* _* "}"
rule exprLevel = "level" _* "{" _* exprOperator (_* exprOperator)* _* "}"
rule exprOperator = ("prefix" | "infix" | "postfix") _* "operator" ident
rule item = ident | "." | "(" expr ")"
rule ident = ALPHA (ALPHA | NUMBER)*
rule str = "\"" (!"\"" .)+ "\""
rule _ = " " | "\t" | "\r\n" | "\r" | "\n"

expression expr {
    atom item
    level {
        prefix operator "!"
    }
    level {
        postfix operator "*"
        postfix operator "+"
        postfix operator "?"
    }
    level {
        infix operator "|"
        infix operator " "
    }
}
```

例
```
rule parent = sub*
rule sub = sub1 | sub2
rule sub1 = "sub1"
rule sub2 = "sub2"
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
