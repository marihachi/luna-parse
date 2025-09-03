## OR

input
```
rule1 = sub1 / sub2
sub1 = "a"
sub2 = "b"
```

output
```js
function parseRule1(p) {
    const { s } = p;
    if (s.is("a")) {
        return parseSub1(p);
    }
    if (s.is("b")) {
        return parseSub2(p);
    }
    throwIfNotExpected(p, ["a", "b"]);
}
```
