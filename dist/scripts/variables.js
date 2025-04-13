'use client';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { db } from './sqlite';
export function getVariableValue(variable) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            if (!variable.sqlExpression) {
                return variable.p21 || '0';
            }
            const result = yield db.execute(variable.sqlExpression);
            return ((_b = (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.value) === null || _b === void 0 ? void 0 : _b.toString()) || '0';
        }
        catch (error) {
            console.error(`Error executing SQL for ${variable.name}:`, error);
            return variable.p21 || '0';
        }
    });
}
export function updateVariableData(variables) {
    return __awaiter(this, void 0, void 0, function* () {
        const updatedVariables = [];
        for (const variable of variables) {
            if (variable.sqlExpression) {
                const value = yield getVariableValue(variable);
                updatedVariables.push(Object.assign(Object.assign({}, variable), { p21: value }));
            }
            else {
                updatedVariables.push(variable);
            }
        }
        return updatedVariables;
    });
}
