config skipSpacing false

rule rule1 = a
rule rule2 = b

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
