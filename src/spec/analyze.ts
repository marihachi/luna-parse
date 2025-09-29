// 意味解析 ASTをIR Treeに変換する

import { A_Toplevel } from "./parser.js";

export type I_TopLevel = {};

// TODO: ある時点における現れる可能性のあるトークンを全て列挙する

export function analyze(ast: A_Toplevel[]): I_TopLevel[] {
    return [];
}
