# F2E Spec 工具链配置参考

> 目标：把规范变成提交前能跑过的命令，而不是靠记忆。
> 按项目现有 ESLint 主版本选择配置方式；不要为了套模板破坏已有 lint 规则。

## 1. 脚本

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "verify": "pnpm lint && pnpm typecheck && pnpm build"
  }
}
```

CI 至少跑 `lint` + `typecheck`；发布/合并前跑 `verify`。

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

## 4. ESLint：Vue 3 + TypeScript（flat config，ESLint 9）

```js
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'error',
      'vue/require-v-for-key': 'error',
      'vue/no-use-v-if-with-v-for': 'error',
    },
  },
  {
    rules: {
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      'no-console': ['warn', { allow: ['error', 'warn'] }],
    },
  },
  prettier,
);
```

需要的依赖：

```bash
pnpm add -D eslint @eslint/js typescript-eslint eslint-plugin-vue eslint-config-prettier prettier
```

## 5. ESLint：React + TypeScript（flat config）

```js
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn',
      'react/jsx-key': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  prettier,
);
```

## 6. 使用 eslint-config-ali（eslintrc 时代）

若项目仍用 ESLint 8 / `.eslintrc.cjs`：

```js
module.exports = {
  extends: ['ali/typescript/react'],
  rules: {
    'no-var': 'error',
    eqeqeq: ['error', 'always'],
  },
};
```

Vue：`extends: ['ali/typescript/vue']`（若该子配置存在；不存在时用第 4 节组合）。

ESLint 9 想复用 eslintrc 配置时，用 `@eslint/eslintrc` 的 `FlatCompat` 包一层；确认 `eslint-config-ali` 的实际导出后再接入。

## 7. tsconfig 关键项

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

## 8. Git hooks（可选）

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

## 9. 常见坑

- ESLint 与 Prettier 规则打架：把 `eslint-config-prettier` 放最后。
- `.vue` 文件 `parser` 配置两层：外层 `vue-eslint-parser`，`parserOptions.parser` 指向 TS parser。
- `tsc --noEmit` 与 Vite 的 `vue-tsc` 不同：Vue 项目用 `vue-tsc --noEmit`。
- 不要在 CI 里跑 `eslint --fix` 后当作通过；fix 只用于本地。
- 忽略目录（`dist`、`coverage`、生成代码）必须显式写在 `ignores`，否则噪声淹没真实问题。
