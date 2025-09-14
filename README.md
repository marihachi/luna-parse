# lunaparse.js
[English](https://github.com/marihachi/lunaparse-js/blob/main/README.md) | [日本語](https://github.com/marihachi/lunaparse-js/blob/main/README.ja.md)

Generates a LL(k) predictive parser that can be easily modified manually.

Under development!

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
lunaparse uses languages derived from BNF to describe grammars.\
With traditional parser generators are generally not designed to make it easy to manually modify the generated parsers. Consequently, hand-writing parsers without using a parser generator was often easier to maintain.\
However, since lunaparse generates recursive descent parsers, they can be easily modified later.\
lunaparse also provides an expression parser that can efficiently parse expressions. An expression parser based on Operator-precedence parser (Precedence Climbing) is generated.

## Get started
1. Install
```
git clone https://github.com/marihachi/lunaparse-js.git
cd lunaparse-js
npm i
npm run build
```

2. Write spec file

3. Generate your parser code
```
npm run generate
```

4. Enjoy your parser life!

## License
MIT
