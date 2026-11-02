# 空 catch / 吞异常

- 规则：`JAVA_EMPTY_CATCH` / `JAVA_PRINT_STACKTRACE`
- 章节：02-(二) 异常处理、02-(三) 日志规约

## ❌ 反例

```java
try {
    orderService.create(command);
} catch (Exception e) {
    // 忽略
}
```

问题：异常被吞掉，调用方以为成功；没有日志，线上无法定位。

## ✅ 正例

```java
try {
    orderService.create(command);
} catch (OrderDuplicatedException e) {
    log.warn("订单重复创建, requestId={}", command.requestId(), e);
    throw new BusinessException("ORDER_DUPLICATED", "订单已存在");
} catch (Exception e) {
    log.error("创建订单失败, requestId={}", command.requestId(), e);
    throw new BusinessException("ORDER_CREATE_FAILED", "创建订单失败");
}
```

要点：

- 捕获具体异常，分开处理预期内/非预期；
- 日志带业务标识与堆栈；不要 `printStackTrace()`；
- 不处理就向上抛，最外层转成用户可理解的信息；
- 不要用异常做流程控制。
