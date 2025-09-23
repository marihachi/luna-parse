## lunaparseの文法
```
parser SpecParser {
    root = toplevel*;
    toplevel = parserBlock / lexerBlock / expressionBlock;
    parserBlock = Parser Ident OpenBracket rule* CloseBracket;
    rule = Ident Equal expr1 Semi;
    expr1 = expr2 (Slash expr2)*;
    expr2 = expr3+;
    expr3 = expr4 (Asta / Plus / Ques)?;
    expr4 = (Amp / Excl)? atom;
    atom = OpenParen expr1 CloseParen / Ident;
    lexerBlock = Lexer Ident OpenBracket lexerRule* CloseBracket;
    lexerRule = lexerExpr1 Arrow (Ident / OpenBracket CloseBracket)
    lexerExpr1 = lexerExpr2 (Slash lexerExpr2)*;
    lexerExpr2 = lexerExpr3+;
    lexerExpr3 = lexerExpr4 (Asta / Plus / Ques)?;
    lexerExpr4 = (Amp / Excl)? lexerAtom;
    lexerAtom = OpenParen lexerExpr1 CloseParen / Dot / Str / CharRange;
    expressionBlock = Expression Ident OpenBracket operatorGroup* CloseBracket;
    operatorGroup = Operator Group OpenBracket operatorRule* CloseBracket;
    operatorRule = (Prefix / Infix / Postfix) Operator Ident;
}

lexer SpecLexer {
    " " / "\t" / "\r\n" / "\n" => {};
    "*" => Asta;
    "+" => Plus;
    "!" => Excl;
    "&" => Amp;
    "?" => Ques;
    "/" => Slash;
    "." => Dot;
    "=>" => Arrow;
    "=" => Equal;
    ";" => Semi;
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
    "\"" (!"\"" ("\\" ("\\" / "\"" / "r" / "n" / "t") / .))+ "\"" => Str(text());
    "[" (!"]" (&(. "-") . "-" . / .))+ "]" => CharRange(text());
    [a-zA-Z_] [a-zA-Z0-9_]* => Ident(text());
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
