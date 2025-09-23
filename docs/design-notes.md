## lunaparseの文法
```
parser SpecParser {
    root = toplevel*;
    toplevel = parserBlock / lexerBlock;
    parserBlock = Parser Ident OpenBracket rule* CloseBracket;
    rule = Ident Equal expr1 Semi;
    expr1 = expr2 (Slash expr2)*;
    expr2 = expr3+;
    expr3 = expr4 (Asta / Plus / Ques)?;
    expr4 = (Amp / Excl)? atom;
    atom = OpenParen expr1 CloseParen / expressionBlock / Ident;
    lexerBlock = Lexer Ident OpenBracket lexerRule* CloseBracket;
    lexerRule = (Ignored? Token)? Ident Equal lexerExpr1 (Arrow OpenBracket CloseBracket)? Semi;
    lexerExpr1 = lexerExpr2 (Slash lexerExpr2)*;
    lexerExpr2 = lexerExpr3+;
    lexerExpr3 = lexerExpr4 (Asta / Plus / Ques)?;
    lexerExpr4 = (Amp / Excl)? lexerAtom;
    lexerAtom = OpenParen lexerExpr1 CloseParen / Dot / Dollar / Str / CharRange / Ident;
    expressionBlock = Expression OpenBracket operatorGroup* CloseBracket;
    operatorGroup = Operator Group OpenBracket operatorRule* CloseBracket;
    operatorRule = (Prefix / Infix / Postfix) Operator Ident;
}

lexer SpecLexer {
    ignored token Spacing = " " / "\t" / "\r\n" / "\n";
    token Asta = "*";
    token Plus = "+";
    token Excl = "!";
    token Amp = "&";
    token Ques = "?";
    token Slash = "/";
    token Dot = ".";
    token Dollar = "$";
    token Arrow = "=>";
    token Equal = "=";
    token Semi = ";";
    token OpenBracket = "{";
    token CloseBracket = "}";
    token OpenParen = "(";
    token CloseParen = ")";
    token Parser = "parser";
    token Lexer = "lexer";
    token Ignored = "ignored";
    token Token = "token";
    token Expression = "expression";
    token Prefix = "prefix";
    token Infix = "infix";
    token Postfix = "postfix";
    token Operator = "operator";
    token Group = "group";
    token Str = "\"" (!"\"" (EscapeSeq / .))+ "\"" => { token.value = text(); };
    token CharRange = "[" (!"]" (&(. "-") . "-" . / .))+ "]" => { token.value = text(); };
    EscapeSeq = "\\" ("\\" / "\"" / "r" / "n" / "t");
    token Ident = [a-zA-Z_] [a-zA-Z0-9_]* => { token.value = text(); };
    token EOF = $;
}
```

例
```
parser ExampleParser {
    parent = sub*;
    sub = sub1 / sub2;
    sub1 = "sub1" "continued1";
    sub2 = "sub2" "continued2";
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
    s.forwardWithExpect("continued1");
    return { kind: "sub1" };
}
type Sub2 = { kind: "sub2" };
function parseSub2(s: Scan): Sub2 {
    s.forward();
    s.forwardWithExpect("continued2");
    return { kind: "sub2" };
}
```
