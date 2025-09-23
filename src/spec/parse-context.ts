// パーサー操作の定義

export class Input {
    source: string;
    index: number;
    line: number;
    column: number;

    constructor(source: string) {
        this.source = source;
        this.index = 0;
        this.line = 1;
        this.column = 1;
    }

    initialize(source: string) {
        this.source = source;
        this.index = 0;
        this.line = 1;
        this.column = 1;
    }

    eof(): boolean {
        return this.index >= this.source.length;
    }

    getChar(length: number = 1): string {
        return this.source.slice(this.index, this.index + length);
    }

    sliceRange(beginIndex: number, endIndex: number) {
        return this.source.slice(beginIndex, endIndex);
    }

    nextChar(length: number = 1): void {
        while (length > 0) {
            if (this.eof()) {
                throw new Error("End of stream");
            }
            if (this.getChar() === "\r") {
                // ignore CR
            } else if (this.getChar() === "\n") {
                this.line++;
                this.column = 1;
            } else {
                this.column++;
            }
            this.index++;
            length--;
        }
    }
}

export class ParseError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

export class ParseContext {
    input: Input;
    lastMatch: string | undefined;

    constructor(source: string) {
        this.input = new Input(source);
    }

    initialize(source: string) {
        this.input.initialize(source);
    }

    /** 現在位置から始まる文字列を取得します。 */
    getSlice(length: number) {
        return this.input.getChar(length);
    }

    eof(): boolean {
        return this.input.eof();
    }

    /** 現在位置から始まる文字列が指定した条件を満たしているかどうかを返します。 */
    match(specifier: string | RegExp): boolean {
        if (typeof specifier === "string") {
            const isMatched = this.input.getChar(specifier.length) === specifier;
            if (isMatched) {
                this.lastMatch = specifier;
            } else {
                this.lastMatch = undefined;
            }
            return isMatched;
        } else {
            const re = new RegExp(`^${specifier.source}`, specifier.flags);
            const reResult = re.exec(this.input.source.slice(this.input.index));
            if (reResult != null) {
                this.lastMatch = reResult[0];
            } else {
                this.lastMatch = undefined;
            }
            return reResult != null;
        }
    }

    /** 直前にマッチした内容を受け入れて、現在位置を進めます。 */
    consume(): string {
        if (this.lastMatch == null) {
            throw new Error("not matched");
        }
        const str = this.lastMatch;
        this.lastMatch = undefined;
        this.input.nextChar(str.length);
        return str;
    }

    /** 現在位置を次の位置に進めます。 */
    forward(specifier: number): void {
        this.input.nextChar(specifier);
    }

    /**
     * 現在位置から始まる文字列が指定した条件を満たしていることを確認し、条件を満たしていれば次のトークンに進みます。
     * 条件を満たしていなければSyntaxErrorを生成します。
    */
    forwardWithExpect(slice: string | RegExp): string {
        this.expect(slice);
        return this.consume();
    }

    /**
     * 現在位置から始まる文字列が指定した条件を満たしていることを確認します。
     * 条件を満たしていなければSyntaxErrorを生成します。
    */
    expect(slice: string | RegExp): void {
        if (!this.match(slice)) {
            const currentChar = this.getSlice(1);
            this.throwSyntaxError(`Expected "${slice}", but got '${currentChar}'`);
        }
    }

    /**
     * 現在位置がEOFであることを確認します。
     * EOFでなければSyntaxErrorを生成します。
    */
    expectEOF(): void {
        if (!this.eof()) {
            const currentChar = this.getSlice(1);
            this.throwSyntaxError(`Expected EOF, but got '${currentChar}'`);
        }
    }

    /** SyntaxErrorを生成します。 */
    throwSyntaxError(message: string): never {
        throw new ParseError(`${message} (${this.input.line}:${this.input.column})`);
    }
}
