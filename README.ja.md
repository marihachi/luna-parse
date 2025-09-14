# lunaparse.js
[Engligh](https://github.com/marihachi/lunaparse-js/blob/main/README.md) | [日本語](https://github.com/marihachi/lunaparse-js/blob/main/README.ja.md)

手動で変更しやすいLL(k)の予言的パーサーを生成します。

開発中！

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

## lunaparseって何？
lunaparseはBNFから派生した言語を用いて文法を記述します。\
一般的に、従来のパーサージェネレータは生成されたパーサーを手動で変更しやすくは作られていません。そのため、パーサージェネレータを使わずにパーサーを手書きする方がメンテナンスがしやすくなっていました。\
しかし、lunaparseは再帰下降パーサを生成するので、後から容易に修正できます。\
lunaparseは式を効率的に解析できる式パーサも提供します。式パーサとしてはOperator-precedence parser (Precedence Climbing)に基づくパーサが生成されます。

## License
MIT
