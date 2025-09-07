export class Logger {
    indent: number;

    constructor() {
        this.indent = 0;
    }

    enter() {
        this.indent++;
    }

    leave() {
        this.indent--;
    }

    print(message: string) {
        console.log(`${"  ".repeat(this.indent)}${message}`);
    }
}
export const logger = new Logger();
