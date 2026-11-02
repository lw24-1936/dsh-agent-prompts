# 线程池：Executors 工厂 → ThreadPoolExecutor

- 规则：`JAVA_THREADPOOL_FACTORY` / `JAVA_RAW_THREAD`
- 章节：01-(七)3、01-(七)4【强制】

## ❌ 反例

```java
private final ExecutorService pool = Executors.newFixedThreadPool(8);
new Thread(() -> doWork()).start();
```

问题：工厂方法的队列/线程数无界，可能堆积请求或创建大量线程导致 OOM；裸线程无法治理。

## ✅ 正例

```java
private final ThreadPoolExecutor pool = new ThreadPoolExecutor(
        4,                                  // corePoolSize
        16,                                 // maximumPoolSize
        60L, TimeUnit.SECONDS,              // keepAlive
        new ArrayBlockingQueue<>(200),      // 有界队列
        new NamedThreadFactory("order-async"),
        new ThreadPoolExecutor.AbortPolicy() // 拒绝策略
);
```

要点：

- 线程工厂命名，日志/排查能看到线程归属；
- 队列有界，配拒绝策略（`AbortPolicy` / `CallerRunsPolicy` 按业务选）；
- 关闭时 `shutdown()` + `awaitTermination()`；
- 虚拟线程场景见 `09-modern-java.md`，不要用虚拟线程做 CPU 密集任务。
