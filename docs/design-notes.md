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
    token EOF = $;
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
}
```

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
