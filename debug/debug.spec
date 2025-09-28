parser DebugParser {
    parser1 = rule1 / rule2;
    rule1 = Token1 Token2;
    rule2 = expression {};
}

lexer DebugLexer {
    Token1 = Token2;
    token Token2 = Token3;
    ignored token Token3 = Sub1;
}
