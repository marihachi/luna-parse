# lunaparse.js
Generates a LL(k) predictive parser that can be easily modified manually.\
手動で変更しやすいLL(k)の予言的パーサーを生成します。

Grammar image:
```
var n1 = 2;
var n2 = 3;
show n1 * n2 + 1;
```
```
config skipSpacing true

rule root = topLevel+
rule topLevel = declareVar | show
rule declareVar = "var" name "=" expr ";"
rule show = "show" expr ";"
rule term = DIGIT+ | ident
rule ident = ALPHA (ALPHA | DIGIT)*

expression expr {
    atom term
    operator group {
        infix operator "*"
        infix operator "/"
    }
    operator group {
        infix operator "+"
        infix operator "-"
    }
}
```

## What is lunaparse?
lunaparse uses languages derived from PEG to describe grammars.\
With traditional parser generators are generally not designed to make it easy to manually modify the generated parsers. Consequently, hand-writing parsers without using a parser generator was often easier to maintain.\
However, since lunaparse generates recursive descent parsers, they can be easily modified later.\
lunaparse also provides an expression parser that can efficiently parse expressions. An expression parser based on Operator-precedence parser (Precedence Climbing) is generated.

## lunaparseって何？
lunaparseはPEGから派生した言語を用いて文法を記述します。\
一般的に、従来のパーサージェネレータは生成されたパーサーを手動で変更しやすくは作られていません。そのため、パーサージェネレータを使わずにパーサーを手書きする方がメンテナンスがしやすくなっていました。\
しかし、lunaparseは再帰下降パーサを生成するので、後から容易に修正できます。\
lunaparseは式を効率的に解析できる式パーサも提供します。式パーサとしてはOperator-precedence parser (Precedence Climbing)に基づくパーサが生成されます。

## License
MIT
