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

    eof(): boolean {
        return this.index >= this.source.length;
    }

    getChar(): string {
        if (this.eof()) {
            throw new Error("End of stream");
        }
        return this.source[this.index];
    }

    nextChar(): void {
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
    }
}
