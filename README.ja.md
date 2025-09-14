# luna-parse
[English](https://github.com/marihachi/luna-parse/blob/main/README.md) | [日本語](https://github.com/marihachi/luna-parse/blob/main/README.ja.md)

再帰下降パーサーと字句解析器のコードジェネレーター。\
仕様ファイルを記述することでコードを生成します。

luna-parseにより生成されるパーサーはLL解析法に則ります。\
また、入力文法は文脈自由文法(CFG)でなければなりません。

開発中です！

仕様ファイルの例:
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
パーサーへの入力：
```
var n1 = 2;
var n2 = 3;
show n1 * n2 + 1;
```

## Get started

## luna-parseって何？
luna-parseはBNFから派生した言語を用いて文法を記述します。\
一般的に、従来のパーサージェネレータは生成されたパーサーを手動で変更しやすくは作られていません。そのため、パーサージェネレータを使わずにパーサーを手書きする方がメンテナンスがしやすくなっていました。\
しかし、luna-parseは再帰下降パーサを生成するので、後から容易に修正できます。\
luna-parseは式を効率的に解析できる式パーサも提供します。式パーサとしてはOperator-precedence parser (Precedence Climbing method)に基づくパーサーが生成されます。

## License
MIT
