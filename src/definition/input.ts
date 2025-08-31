export type Input = {
    source: string;
    index: number;
    line: number;
    column: number;
};

export function initInput(source: string): Input {
    return {
        source,
        index: 0,
        line: 1,
        column: 1,
    };
}

export function eof(ctx: Input): boolean {
    return ctx.index >= ctx.source.length;
}

export function getChar(ctx: Input): string {
    if (eof(ctx)) {
        throw new Error("End of stream");
    }
    return ctx.source[ctx.index];
}

export function nextChar(ctx: Input): void {
    if (eof(ctx)) {
        throw new Error("End of stream");
    }
    if (getChar(ctx) === "\r") {
        // ignore CR
    } else if (getChar(ctx) === "\n") {
        ctx.line++;
        ctx.column = 1;
    } else {
        ctx.column++;
    }
    ctx.index++;
}
