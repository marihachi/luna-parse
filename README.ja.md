# luna-parse
[English](https://github.com/marihachi/luna-parse/blob/main/README.md) | [日本語](https://github.com/marihachi/luna-parse/blob/main/README.ja.md)

luna-parseはパーサージェネレーターです。\
仕様ファイルを記述することでコードを生成します。

luna-parseはPEG(Parsing Expression Grammar)の思想から影響を受けています。
しかし、バックトラックを行わない点はPEGとは異なります。

luna-parseが生成するパーサーは、必要に応じて手作業で変更可能であるように設計されています。\
これはパーサジェネレーターが現実のパーサーを完全に生成することは困難であるためです。

現在開発を進めています！

仕様ファイルの例:
```
parser {
    root = topLevel (LF? topLevel)* ;
    topLevel = declareVar / show ;
    declareVar = VAR LF? IDENT LF? EQUAL LF? expr LF? SEMI ;
    show = SHOW LF? expr LF? SEMI ;
    term = NUMBER / IDENT ;
}

expression expr {
    atom term ;
    operator group {
        infix operator ASTA ;
        infix operator SLASH ;
    }
    operator group {
        infix operator PLUS ;
        infix operator MINUS ;
    }
}

lexer {
    [ignored] SPACE = " " ;
    LF = "\r\n" / "\n" ;
    ASTA = "*" ;
    SLASH = "/" ;
    PLUS = "+" ;
    MINUS = "-" ;
    EQUAL = "=" ;
    SEMI = ";" ;
    SHOW = "show" ;
    VAR = "var" ;
    NUMBER = [1-9] [0-9]* ;
    IDENT = [a-zA-Z] ([a-zA-Z] / [0-9])* ;
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
