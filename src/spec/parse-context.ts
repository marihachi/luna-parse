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

export type MatchSpecifier = string | ParseFunction;
export type ForwardSpecifier = string | number;
export type ParseFunction = (p: ParseContext) => unknown;

export class ParseError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

export class ParseContext {
    input: Input;
    lastMatch: { index: number; result: unknown; } | undefined;

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
    match(specifier: MatchSpecifier): boolean {
        if (typeof specifier === "string") {
            return this.input.getChar(specifier.length) === specifier;
        } else {
            const beginIndex = this.input.index;
            try {
                const result = specifier(this);
                this.lastMatch = { index: this.input.index, result: result };
                return true;
            } catch (e) {
                if (e instanceof ParseError) {
                    return false;
                }
                throw e;
            } finally {
                this.input.index = beginIndex;
            }
        }
    }

    /** 直前にマッチした内容を受け入れて、現在位置を進めます。 */
    acceptMatch(): unknown {
        if (this.lastMatch == null) {
            throw new Error("not matched yet");
        }
        this.input.index = this.lastMatch.index;
        return this.lastMatch.result;
    }

    /** 現在位置を次の位置に進めます。 */
    forward(specifier: ForwardSpecifier): void {
        if (typeof specifier === "number") {
            this.input.nextChar(specifier);
        } else {
            this.input.nextChar(specifier.length);
        }
    }

    /**
     * 現在位置から始まる文字列が指定した条件を満たしていることを確認し、条件を満たしていれば次のトークンに進みます。
     * 条件を満たしていなければSyntaxErrorを生成します。
    */
    forwardWithExpect(slice: string): void {
        this.expect(slice);
        this.forward(slice);
    }

    /**
     * 現在位置から始まる文字列が指定した条件を満たしていることを確認します。
     * 条件を満たしていなければSyntaxErrorを生成します。
    */
    expect(slice: string): void {
        if (!this.match(slice)) {
            const currentChar: MatchSpecifier = this.getSlice(1);
            this.throwSyntaxError(`Expected "${slice}", but got '${currentChar}'`);
        }
    }

    /**
     * 現在位置がEOFであることを確認します。
     * EOFでなければSyntaxErrorを生成します。
    */
    expectEOF(): void {
        if (!this.eof()) {
            const currentChar: MatchSpecifier = this.getSlice(1);
            this.throwSyntaxError(`Expected EOF, but got '${currentChar}'`);
        }
    }

    /** SyntaxErrorを生成します。 */
    throwSyntaxError(message: string): never {
        throw new ParseError(`${message} (${this.input.line}:${this.input.column})`);
    }
}
