# 示例索引

每个文件是一组「反例 → 正例」，用于命中规则时快速对照。正文技能会在需要时指向这里，不必一次读完。

| 文件 | 规则 | 主题 |
|---|---|---|
| `java-threadpool.md` | `JAVA_THREADPOOL_FACTORY` / `JAVA_RAW_THREAD` | 线程池显式参数、命名、拒绝策略 |
| `java-datetime.md` | `JAVA_SIMPLEDATEFORMAT` / `JAVA_UTIL_DATE` / `JAVA_CALENDAR` | `java.time`、`DateTimeFormatter`、时区 |
| `java-sql.md` | `JAVA_SQL_DOLLAR` / `JAVA_SQL_NO_WHERE` / `XML_SQL_*` | SQL 注入、无 where 的 update/delete |
| `java-empty-catch.md` | `JAVA_EMPTY_CATCH` / `JAVA_PRINT_STACKTRACE` | 异常分类、日志、业务异常 |
| `vue-key.md` | `F2E_V_FOR_NO_KEY` / `F2E_V_IF_FOR` / `F2E_INDEX_KEY` | Vue 3 列表 key 与 v-if/v-for |
| `xss.md` | `F2E_V_HTML` / `F2E_DANGEROUS_HTML` / `F2E_TARGET_BLANK` | HTML 消毒、外链 noopener |

示例中的代码是演示片段，不是完整实现；按项目实际框架（Spring Boot 3 / Vue 3 / React）调整。
