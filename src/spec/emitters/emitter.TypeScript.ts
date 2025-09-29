// コード生成 IR Treeをコードに変換する

import { I_Node } from "../analyze.js";

class Writer {
    code: string;

    constructor() {
        this.code = "";
    }

    write(code: string) {
        this.code += code;
    }
}

export function emit(irTree: I_Node[]): string {
    const w = new Writer();

    walk(irTree, w);

    return w.code;
}

function walk(irTree: I_Node[], w: Writer): void {
    for (const irNode of irTree) {
        walkOne(irNode, w);
    }
}

function walkOne(irNode: I_Node, w: Writer): void {
    w.write("node\r\n");

    if (irNode.children) {
        walk(irNode.children, w);
    }
}
