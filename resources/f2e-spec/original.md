---
name: "f2e-spec"
description: "阿里巴巴前端代码规范 - 当编写或审查前端代码时,遵循F2E Spec编码规约"
---

# 阿里巴巴前端代码规范 (F2E Spec) Skill

## 适用场景

当用户需要编写、审查或重构前端代码时,自动应用阿里巴巴F2E Spec编码规约。

## 核心规范要点

### 1. 通用编码规范 (适用于所有语言)

#### 缩进和格式
- **强制** 使用 2 个空格缩进,不使用 tab
- **推荐** 单行最大字符数 100,超过需换行
- **强制** 使用 UTF-8 字符集

#### 空行规则
- **推荐** 文件末尾保留一行空行
- **强制** 代码块的开始和结束不能是空行
- **参考** 在块末和新语句间插入一个空行以提高可读性

### 2. JavaScript/TypeScript 规范

#### 变量声明
- **强制** 使用 const 或 let,禁止使用 var
- **强制** 正确使用 const 和 let:优先使用 const,只有需要重新赋值时才用 let
- **强制** 一条声明语句声明一个变量
- **强制** 声明的变量必须被使用
- **强制** 变量不要与外层作用域已存在的变量同名

#### 函数
- **强制** 使用箭头函数代替匿名函数
- **推荐** 使用函数表达式替代函数声明
- **强制** 不要在块中使用函数声明
- **推荐** 使用默认参数语法,有默认值的参数放在最后
- **推荐** 不要修改函数参数

#### 代码风格
- **强制** 使用分号结束语句
- **强制** 字符串优先使用单引号,JSX属性使用双引号
- **强制** 使用模板字符串替代字符串拼接
- **推荐** 使用扩展运算符 ... 处理数组和对象
- **推荐** 使用解构获取对象属性和数组元素
- **强制** 使用严格相等运算符 === 和 !==

#### 对象和数组
- **强制** 使用字面量创建对象和数组
- **强制** 使用对象属性和方法的简写语法
- **推荐** 使用扩展运算符 ... 进行对象浅拷贝
- **强制** 优先使用 . 访问对象属性,[] 仅用于动态属性

#### 模块化
- **推荐** 使用 ES6 modules (import/export)
- **强制** 不要用多个 import 引入同一模块
- **强制** import 语句需放到模块最上方
- **参考** import 排序:先第三方,再内部模块

### 3. React 规范

#### 组件定义
- **强制** 使用 ES6 class 创建组件,而不是 createReactClass
- **推荐** 如果组件没有内部状态或 refs,应使用函数组件
- **强制** 每个文件只包含一个 React 组件

#### JSX 编码风格
- **强制** JSX 使用 2 个空格缩进
- **强制** 自闭合标签的斜线前有且仅有一个空格: `<Foo />`
- **强制** JSX 属性使用双引号: `<Foo bar="bar" />`
- **强制** 多行 JSX 标签需用小括号包裹
- **强制** 无子元素的标签需写成自闭合标签

#### Props 和 State
- **推荐** prop 需要 propTypes 验证
- **推荐** 不要使用模糊的类型检查器(any, array, object)
- **推荐** 属性需要指定 defaultProps,除了 isRequired 的属性
- **强制** 不要在 setState 中使用 this.state,使用函数形式: `setState(prevState => ({ value: prevState.value + 1 }))`
- **推荐** props, state 优先使用解构赋值

#### 事件处理
- **推荐** 不要在 JSX 属性中使用 .bind()
- **推荐** 使用箭头函数或 class properties 绑定事件

#### Hooks
- **强制** 只在最顶层调用 Hooks,不要在循环、条件和嵌套函数中调用
- **强制** Hooks 命名必须以 use 开头,小驼峰形式
- **强制** 只在 React 函数组件和自定义 Hooks 中调用 Hooks
- **推荐** useEffect 及类似 Hooks 需要声明所有依赖

### 4. 命名规范

- **参考** 文件名使用小写字母和短横线: `hello-world.js`
- **参考** 使用小驼峰(camelCase)命名原始类型、对象、函数、实例
- **强制** 使用大驼峰(PascalCase)命名类和构造函数
- **参考** 全大写命名(UPPER_CASE)仅用于 export 的常量
- **参考** 命名不要以下划线开头或结尾

### 5. 注释规范

- **推荐** 单行注释使用 //
- **推荐** 多行注释使用 /** ... */
- **强制** 注释内容和注释符之间需要有一个空格
- **参考** 文档类注释使用 jsdoc 规范
- **参考** 使用特殊标记: FIXME 和 TODO

### 6. 性能和最佳实践

- **推荐** 避免不必要的渲染,合理使用 memo、useMemo、useCallback
- **推荐** 列表渲染必须有稳定且唯一的 key,不要使用索引
- **强制** 不要使用已废弃的生命周期方法:
  - componentWillMount → 使用 constructor 或 componentDidMount
  - componentWillReceiveProps → 使用 componentDidUpdate 或 getDerivedStateFromProps
  - componentWillUpdate → 使用 componentDidUpdate
- **强制** 不要使用 findDOMNode,使用 ref 回调或 React.createRef()

### 7. 安全和禁止事项

- **强制** 禁止使用 eval
- **强制** 禁止使用 debugger(生产环境)
- **推荐** 生产环境禁止使用 console
- **推荐** 不要使用危险属性 dangerouslySetInnerHTML
- **推荐** target='_blank' 需配合 rel='noopener noreferrer' 使用

### 8. 无障碍性(Accessibility)

- **推荐** img 标签应包含 alt 属性
- **推荐** 锚元素必须含有内容
- **推荐** 遵循 WAI-ARIA 规范使用 role 和 aria-* 属性

## 实施指南

在编写或审查代码时:

1. **检查代码风格**
   - 缩进是否为 2 空格
   - 行宽是否超过 100 字符
   - 引号使用是否正确(JS字符串单引号,JSX属性双引号)
   - 是否使用了分号

2. **检查语法选择**
   - 是否使用了 const/let 而非 var
   - 是否使用箭头函数
   - 是否使用解构和扩展运算符
   - 是否使用模板字符串

3. **检查 React 特定规范**
   - 组件定义是否符合规范
   - JSX 格式是否正确
   - Props 是否有类型验证
   - State 更新是否正确
   - Hooks 使用是否符合规则

4. **检查命名**
   - 变量/函数是否使用小驼峰
   - 类/组件是否使用大驼峰
   - 常量命名是否合理

5. **检查性能和安全**
   - 是否有不必要的渲染
   - 列表 key 是否稳定
   - 是否使用了危险方法
   - 生产代码是否移除了 console

6. **检查可维护性**
   - 注释是否恰当
   - 函数复杂度是否过高
   - 是否有未使用的变量/props/state
   - 模块化是否合理

## 配套工具

规范配套的 ESLint 配置:
- `eslint-config-ali`: 阿里巴巴前端规约 ESLint 规则包
- React 项目使用: `eslint-config-ali/react` 或 `eslint-config-ali/typescript/react`

## 参考资源

- [阿里巴巴前端代码规范](https://alibaba.github.io/f2e-spec/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [React 官方文档](https://reactjs.org/docs/)

