// AST TreeからIR Treeを生成する

import { A_Toplevel } from "./parse.js";

export type LoweringState = {};

export type I_TopLevel = {};

export function analyze(ast: A_Toplevel[]): I_TopLevel[] {
    const state: LoweringState = {};
    return [];
}
