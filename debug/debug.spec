parser DebugParser {
    root = Token1 Token2 / Token2;
}

lexer DebugLexer {
    token Token1 = Sub1;
    token Token2 = Sub2;
}
