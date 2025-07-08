"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const js_1 = __importDefault(require("@eslint/js"));
const typescript_eslint_1 = __importDefault(require("typescript-eslint"));
const eslint_config_prettier_1 = __importDefault(require("eslint-config-prettier"));
exports.default = typescript_eslint_1.default.config(js_1.default.configs.recommended, ...typescript_eslint_1.default.configs.recommended, eslint_config_prettier_1.default, {
    files: ['**/*.ts'],
    rules: {
        '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
});
