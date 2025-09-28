parser DebugParser {
    root = toplevel*;
    toplevel = parserBlock / lexerBlock;
    parserBlock = Parser Ident OpenBracket rule* CloseBracket;
    rule = Ident Equal expr1 Semi;
    expr1 = expr2 (Slash expr2)*;
    expr2 = expr3+;
    expr3 = parserAtom (Aste / Plus / Ques)?;
    parserAtom = OpenParen expr1 CloseParen / expressionBlock / Ident;
    lexerBlock = Lexer Ident OpenBracket lexerRule* CloseBracket;
    lexerRule = (Ignored? Token)? Ident Equal lexerExpr1 (Arrow OpenBracket CloseBracket)? Semi;
    lexerExpr1 = lexerExpr2 (Slash lexerExpr2)*;
    lexerExpr2 = lexerExpr3+;
    lexerExpr3 = lexerExpr4 (Aste / Plus / Ques)?;
    lexerExpr4 = (Amp / Excl)? lexerAtom;
    lexerAtom = OpenParen lexerExpr1 CloseParen / Dot / Dollar / Str / CharRange / Ident;
    expressionBlock = Expression OpenBracket (exprAtom / operatorGroup)* CloseBracket;
    exprAtom = Atom parserAtom;
    operatorGroup = Operator Group OpenBracket operatorRule* CloseBracket;
    operatorRule = (Prefix / Infix / Postfix) Operator Ident;
}

lexer DebugLexer {
    token Token1 = Sub1;
    token Token2 = Sub2;
}
