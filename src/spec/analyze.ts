// 意味解析 ASTをIR Treeに変換する

import { A_Toplevel } from "./parser.js";

export type LoweringState = {};

export type I_TopLevel = {};

export function analyze(ast: A_Toplevel[]): I_TopLevel[] {
    const state: LoweringState = {};
    return [];
}
