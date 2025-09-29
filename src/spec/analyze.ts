// 意味解析 ASTをIR Treeに変換する

import { A_Node, A_Toplevel } from "./parser.js";

export type I_Node = { children?: I_Node[] };

// TODO: ある時点における現れる可能性のあるトークンを全て列挙する

export function analyze(ast: A_Node[]): I_Node[] {
    return walk(ast);
}

function walk(ast: A_Node[]): I_Node[] {
    const items: I_Node[] = [];
    for (const aNode of ast) {
        items.push(walkOne(aNode));
    }
    return items;
}

function walkOne(aNode: A_Node): I_Node {
    if (aNode.kind === "LexerBlock") {
        return {
            children: walk(aNode.rules),
        };
    } else if (aNode.kind === "ParserBlock") {
        return {
            children: walk(aNode.rules),
        };
    } else if (aNode.kind === "Rule") {
        return {
            children: [walkOne(aNode.expr)],
        };
    } else if (aNode.kind === "Sequence") {
        return {
            children: walk(aNode.exprs),
        };
    } else if (aNode.kind === "Alternate") {
        return {
            children: walk(aNode.exprs),
        };
    } else if (aNode.kind === "Repeat") {
        return {
            children: [walkOne(aNode.expr)],
        };
    } else if (aNode.kind === "Option") {
        return {
            children: [walkOne(aNode.expr)],
        };
    } else if (aNode.kind === "ExpressionBlock") {
        return {
            children: walk(aNode.children),
        };
    } else if (aNode.kind === "Ref") {
        return {};
    } else if (aNode.kind === "LexerRule") {
        //walk(aNode.children);
        return {};
    } else if (aNode.kind === "OperatorGroup") {
        return {
            children: walk(aNode.children),
        };
    } else if (aNode.kind === "OperatorRule") {
        return {};
    } else if (aNode.kind === "ExprAtom") {
        return {
            children: [walkOne(aNode.expr)],
        };
    }
    throw new Error();
}
