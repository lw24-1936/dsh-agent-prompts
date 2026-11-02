# 日期时间：SimpleDateFormat / java.util.Date → java.time

- 规则：`JAVA_SIMPLEDATEFORMAT` / `JAVA_UTIL_DATE` / `JAVA_CALENDAR`
- 章节：01-(五) 日期时间、01-(七)5【强制】

## ❌ 反例

```java
private static final SimpleDateFormat SDF = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

public String format(Date date) {
    return SDF.format(date); // 非线程安全，并发下会串日期
}
```

问题：`SimpleDateFormat` 非线程安全；static 复用会串数据。`Date` / `Calendar` 可变且 API 过时。

## ✅ 正例

```java
private static final DateTimeFormatter FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

public String format(LocalDateTime time) {
    return time.format(FORMATTER);
}

public LocalDateTime parse(String text) {
    return LocalDateTime.parse(text, FORMATTER);
}
```

要点：

- `DateTimeFormatter` 不可变、线程安全，可 `static final` 复用；
- 年份用小写 `yyyy`，不要用 `YYYY`（week-year）；
- 时区显式：`ZoneId.of("Asia/Shanghai")` 或项目统一时区；
- 数据库/接口统一格式，不要各层各写一套。
