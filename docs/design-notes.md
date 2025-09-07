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

生成例
```js
function parseRoot(s) {
    if (matchToplevel(s)) {
        return parseToplevel(s);
    }
    s.throwIfNotExpected(["config", "rule", "expression"]);
}

function matchToplevel(s) {
    return s.isWord("config") || s.isWord("rule") || s.isWord("expression");
}
function parseToplevel(s) {
    if (matchConfig(s)) {
        return parseConfig(s);
    }
    if (matchRule(s)) {
        return parseRule(s);
    }
    if (matchExpression(s)) {
        return parseExpression(s);
    }
}

function matchConfig(s) {
    return s.isWord("config");
}
function parseConfig(s) {
    s.forward();
}

function matchRule(s) {
    return s.isWord("rule");
}
function parseRule(s) {
    s.forward();
}

function matchExpression(s) {
    return s.isWord("expression");
}
function parseExpression(s) {
    s.forward();
}
```
