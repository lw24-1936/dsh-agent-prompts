# F2E Spec 工具链配置参考

> 目标：把规范变成提交前能跑过的命令，而不是靠记忆。
> **版本原则**：本文示例基于 ESLint 9 flat config + `eslint-config-ali` 16.x（该版本只提供 `base` / `react` 导出），仅作参考，**不强制升级**。项目用什么 ESLint / 配置包版本，就以什么版本为准；ESLint 8 项目用 F2ELint 或原有 legacy 配置即可。
> 不要为了套模板破坏项目已有 lint 规则；新规则先在新代码/新文件启用。

## 1. 脚本

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "typecheck:vue": "vue-tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "verify": "pnpm lint && pnpm typecheck && pnpm build"
  }
}
```

Vue 项目把 `typecheck` 换成 `vue-tsc --noEmit`。CI 至少跑 `lint` + `typecheck`；发布/合并前跑 `verify`。

## 2. Prettier（格式基线）

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "endOfLine": "lf"
}
```

## 3. EditorConfig

```ini
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

## 4. 一键接入：F2ELint（不想手写配置时）

```bash
npx f2elint
```

F2ELint 会收敛 ESLint / stylelint / commitlint / markdownlint 的依赖与配置，适合存量项目快速接入。它生成的配置可能随版本变化；接入后仍以项目实际 `eslint.config.*` 为准。

## 5. ESLint：基础 / React（flat config 示例）

以下示例基于 `eslint-config-ali` 16.x 的 `base` / `react` 导出（ESLint 9）。其他版本导出可能不同，以项目实际包为准，不要盲目复制。

```js
// eslint.config.mjs
import { base } from 'eslint-config-ali';
import prettier from 'eslint-config-prettier';

export default [
  ...base,
  {
    rules: {
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  prettier,
];
```

React 项目：

```js
// eslint.config.mjs
import { react } from 'eslint-config-ali';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default [
  ...react,
  {
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': 'warn',
      'react/jsx-key': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  prettier,
];
```

依赖：

```bash
pnpm add -D eslint eslint-config-ali eslint-config-prettier prettier
# React 额外
pnpm add -D eslint-plugin-react-refresh
```

> 版本由项目决定；上面的命令不锁定 `eslint` 版本，避免把示例当成升级要求。

## 6. ESLint：Vue + TypeScript（flat config 示例）

下面以 Vue 3 + flat config 为例；Vue 2 项目用 `eslint-plugin-vue` 的 legacy/推荐配置与 Options API 规则，不强制升级。`eslint-config-ali` 16.x 没有 Vue 预设，组合方式如下：

```js
// eslint.config.mjs
import { base } from 'eslint-config-ali';
import pluginVue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  ...base,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
        sourceType: 'module',
      },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'error',
      'vue/require-v-for-key': 'error',
      'vue/no-use-v-if-with-v-for': 'error',
      'vue/no-mutating-props': 'error',
    },
  },
  {
    rules: {
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  prettier,
];
```

依赖：

```bash
pnpm add -D eslint eslint-config-ali eslint-plugin-vue typescript-eslint eslint-config-prettier prettier vue-tsc
```

> 同样不锁定 `eslint` 版本；Vue 2 项目改用对应版本的 `eslint-plugin-vue` 配置，不要直接套 Vue 3 的 flat 预设。

## 7. 类型感知规则（可选）

`@typescript-eslint/no-floating-promises`、`no-misused-promises` 需要 TypeScript 类型信息。新版 typescript-eslint 用 `projectService`；旧版本用 `project` 指向 tsconfig，按项目版本选择：

```js
{
  files: ['**/*.{ts,tsx,vue}'],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
  },
}
```

首次开启会暴露存量问题，先只对新增目录/文件启用，或放进单独的 CI job。

## 8. tsconfig 关键项

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  }
}
```

`strict` 之外的新增项会暴露存量问题：先在新代码/新文件启用，不要一次性全仓库打开导致无法收敛。

## 9. Git hooks（可选）

```bash
pnpm add -D husky lint-staged
npx husky init
```

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,vue}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css,scss}": ["prettier --write"]
  }
}
```

hooks 只做快速检查；完整 `lint` + `typecheck` 仍交给 CI。

## 10. 常见坑

- ESLint 与 Prettier 规则打架：把 `eslint-config-prettier` 放最后。
- `.vue` 文件 `parser` 配置两层：外层 `vue-eslint-parser`（`eslint-plugin-vue` 的 flat 预设已设），`parserOptions.parser` 指向 TS parser。
- 本仓库示例使用的 `eslint-config-ali` 16.x 是 flat config 专用；其他版本按其文档选择 flat/legacy。`extends: ['ali/typescript/react']` 是旧版写法，不要与 flat config 混用。
- `eslint-config-ali` 采用 MPL-2.0；它只是规则包，不改变你的项目许可。
- `tsc --noEmit` 与 Vite 的 `vue-tsc` 不同：Vue 项目用 `vue-tsc --noEmit`。
- 不要在 CI 里跑 `eslint --fix` 后当作通过；fix 只用于本地。
- 忽略目录（`dist`、`coverage`、生成代码）必须显式写在 `ignores`，否则噪声淹没真实问题。
