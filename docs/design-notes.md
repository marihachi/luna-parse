## OR

input
```
rule1 = sub1 / sub2
sub1 = "a"
sub2 = "b"
```

output
```js
function parseRule1(s) {
    if (matchSub1(s)) {
        return parseSub1(s);
    }
    if (matchSub2(s)) {
        return parseSub2(s);
    }
    s.throwIfNotExpected(["a", "b"]);
}

function matchSub1(s) {
    return s.is("a");
}
function parseSub1(s) {
    s.nextToken();
}

function matchSub2(s) {
    return s.is("b");
}
function parseSub2(s) {
    s.nextToken();
}
```
