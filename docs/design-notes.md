## 使用イメージ
```
parser ExampleParser {
    parent = sub*;
    sub = sub1 / sub2;
    sub1 = "sub1" "continued1";
    sub2 = "sub2" "continued2";
}
lexer ExampleLexer {
    ignored token Spacing = " " / "\t" / "\r\n" / "\n";
    token Sub1 = "sub1";
    token Sub2 = "sub2";
    token Continued1 = "continued1";
    token Continued2 = "continued2";
}
```
```ts
const TOKEN = { EOF: 0, Sub1: 1, Sub2: 2, Continued1: 3, Continued2: 4 };
function parseParent(p: ParserContext): void {
    let children: Sub[] = [];
    while (p.match(TOKEN.Sub1) || p.match(TOKEN.Sub2)) {
        children.push(parseSub(p));
    }
    p.forwardWithExpect(TOKEN.EOF);
}
type Sub = Sub1 | Sub2;
function parseSub(p: ParserContext): Sub {
    if (p.match(TOKEN.Sub1)) {
        return parseSub1(p);
    } else if (p.match(TOKEN.Sub2)) {
        return parseSub2(p);
    } else {
        p.throwSyntaxError("unexpected token");
    }
}
type Sub1 = { kind: "sub1" };
function parseSub1(p: ParserContext): Sub1 {
    p.consume();
    p.forwardWithExpect(TOKEN.Continued1);
    return { kind: "sub1" };
}
type Sub2 = { kind: "sub2" };
function parseSub2(p: ParserContext): Sub2 {
    p.consume();
    p.forwardWithExpect(TOKEN.Continued2);
    return { kind: "sub2" };
}
```
