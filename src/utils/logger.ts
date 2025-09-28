export class Logger {
    indent: number;
    parentLogger?: Logger;

    enabled: boolean = false;

    constructor(parentLogger?: Logger) {
        this.indent = 0;
        this.parentLogger = parentLogger;
    }

    getIndent(): number {
        return this.indent + (this.parentLogger?.getIndent() ?? 0);
    }

    enter() {
        if (this.enabled) {
            this.indent++;
        }
    }

    leave() {
        if (this.enabled) {
            this.indent--;
        }
    }

    print(message: string) {
        if (this.enabled) {
            console.log(`${"  ".repeat(this.getIndent())}${message}`);
        }
    }
}
export const parserLog = new Logger();
export const lexerLog = new Logger(parserLog);
export const inputLog = new Logger(lexerLog);
