# 编程规约 · 集合处理

> 来源：《Java 开发手册（黄山版）》v1.7.1，一、编程规约 (六) 集合处理。
> 本文件只含该节；章节索引见 `alibaba-java/00-index.md`。

## (六) 集合处理

**1.【强制】** 关于 hashCode 和 equals 的处理，遵循如下规则：
1）只要覆写 equals，就必须覆写 hashCode。
2）因为 Set 存储的是不重复的对象，依据 hashCode 和 equals 进行判断，所以 Set 存储的对象必须覆写这两种方法。
3）如果自定义对象作为 Map 的键，那么必须覆写 hashCode 和 equals。
**说明：** String 因为覆写了 hashCode 和 equals 方法，所以可以愉快地将 String 对象作为 key 来使用。
**2.【强制】** 判断所有集合内部的元素是否为空，使用 isEmpty() 方法，而不是 size() == 0 的方式。
**说明：** 在某些集合中，前者的时间复杂度为 O(1)，而且可读性更好。
**正例：**
```java
Map< String , Object > map = new HashMap <>(16);
if (map.isEmpty ()) {

System.out. println ("no element  in this map." );
}
```

**3.【强制】** 在使用 java.util.stream.Collectors 类的 toMap() 方法转为 Map 集合时，一定要使用参数类型为 BinaryOperator，参数名为 mergeFunction 的方法，否则当出现相同 key 时会抛出 IllegalStateException 异常。
**说明：** 参数 mergeFunction 的作用是当出现 key 重复时，自定义对 value 的处理策略。
**正例：**

```java
List<Pair<String , Double >> pairArrayList  = new ArrayList <>(3);
pairArrayList .add(new Pair<>("version" , 12.10 ));
pairArrayList .add(new Pair<>("version" , 12.19 ));
pairArrayList .add(new Pair<>("version" , 6.28));
// 生成的 map 集合中只有一个键值对 ：{version=6.28}
Map<String , Double > map = pairArrayList .stream ()
.collect (Collectors .toMap (Pair::getKey , Pair::getValue , (v1, v2) -> v2));
```

**反例：**
```java
String [] departments  = new String []{"RDC", "RDC", "KKB"};
// 抛出 IllegalStateEx ception 异常
Map<Integer , String > map = Arrays .stream (departments )
.collect (Collectors .toMap (String ::hashCode , str -> str));
```

**4.【强制】** 在使用 java.util.stream.Colle ctors 类的 toMap() 方法转为 Map 集合时，一定要注意当 value 为 null 时会抛 NPE 异常。
**说明：** 在 java.util.HashMap 的 merge 方法里会进行如下的判断：
```java
if (value  == null || remappingFunction  == null)
throw new NullPointerException ();
```

**反例：**
```java
List<Pair<String , Double >> pairArrayList  = new ArrayList <>(2);
pairArrayList .add(new Pair<>("version1" , 8.3));
pairArrayList .add(new Pair<>("version2" , null));
// 抛出 NullPointerExcept ion异常
Map<String , Double > map = pairArrayList .stream ()
.collect (Collectors .toMap (Pair::getKey , Pair::getValue , (v1, v2) -> v2));
```

**5.【强制】** ArrayList 的 subList 结果不可强转成 ArrayList，否则会抛出 ClassCastException 异常：java.util.RandomAccessSubList cannot be cast to java.util.ArrayList。
**说明：** subList() 返回的是 ArrayList 的内部类 SubList，并不是 ArrayList 本身，而是 ArrayList 的一个视图，对于 SubList 的所有操作最终会反映到原列表上。
**6.【强制】** 使用 Map 的方法 keySet() / values() / entrySet() 返回集合对象时，不可以对其进行添加元素操作，否则会抛出 UnsupportedOperationException 异常。
**7.【强制】** Collections 类返回的对象，如：emptyList() / singletonList() 等都是 immutable list，不可对其进行添加或者删除元素的操作。
**反例：** 如果查询无结果，返回 Collections.emptyList() 空集合对象，调用方一旦在返回的集合中进行了添加元素的操作，就会触发 UnsupportedOperationException 异常。
**8.【强制】** 在 subList 场景中，高度注意对父集合元素的增加或删除，均会导致子列表的遍历、增加、删除产生 ConcurrentModificationException 异常。
**说明：** 抽查表明，90% 的程序员对此知识点都有错误的认知。
**9.【强制】** 使用集合转数组的方法，必须使用集合的 toArray(T[] array)，传入的是类型完全一致、长度为 0 的空数组。
**反例：** 直接使用 toArray 无参方法存在问题，此方法返回值只能是 Object[] 类，若强转其它类型数组将出现 ClassCastException 错误。
**正例：**
```java
List<String > list = new ArrayList <>(2);
list.add("guan");
list.add("bao" );
String [] array  = list.toArray (new String [0]);
```

**10.【强制】** Map 类集合 K / V 能不能存储 null 值的情况，如下表格：

| 集合类 | Key | Value | Super | 说明 |
|--------|-----|-------|-------|------|
| Hashtable | 不允许为null | 不允许为null | Dictionary | 线程安全 |
| TreeMap | 不允许为null | 允许为null | AbstractMap | 线程不安全 |
| ConcurrentHashMap | 不允许为null | 不允许为null | AbstractMap | 锁分段技术（JDK8:CAS） |
| HashMap | 允许为null | 允许为null | AbstractMap | 线程不安全 |

**说明：** 在 ArrayList#addAll 方法的第一行代码即 Object[] a = c.toArray()；其中 c 为输入集合参数，如果为 null，则直接抛出异常。
**11.【强制】** 使用工具类 Arrays.asList() 把数组转换成集合时，不能使用其修改集合相关的方法，它的 add / remove / clear 方法会抛出 UnsupportedOperationException 异常。
**说明：** asList 的返回对象是一个 Arrays 内部类，并没有实现集合的修改方法。Arrays.asList 体现的是适配器模式，只是转换接口，后台的数据仍是数组。
```java
String[]  str = new String[]{  "yang ", "guan ", "bao" };
List list = Arrays.asList(str);
 第一种情况 ：list.add("yangguanbao") ; 运行时异常。
```

 第二种情况：str[0] = "change" ; list中的元素也会随之修改，反之亦然。

**12.【强制】** 泛型通配符 <? extends T> 来接收返回的数据，此写法的泛型集合不能使用 add 方法，而 <? super T> 不能使用 get 方法，两者在接口调用赋值的场景中容易出错。
**说明：** 扩展说一下 PECS(Producer Extends Consumer Super) 原则，即频繁往外读取内容的，适合用 <? extends T>，经常往里插入的，适合用 <? super T>
**13.【强制】** 在无泛型限制定义的集合赋值给泛型限制的集合时，在使用集合元素时，需要进行 instanceof 判断，避免抛出 ClassCastException 异常。
**说明：** 毕竟泛型是在 JDK5 后才出现，考虑到向前兼容，编译器是允许非泛型集合与泛型集合互相赋值。
**反例：**
```java
List<String > generics  = null;
List notGenerics  = new ArrayList (10);
notGen erics.add(new Object ());
notGen erics.add(new Integer (1));
generics  = notGenerics ;
// 此处抛出 ClassCastExcept ion异常
String  string  = generics .get(0);
```

**14.【强制】** 不要在 foreach 循环里进行元素的 remove / add 操作。remove 元素请使用 iterator 方式，如果并发操作，需要对 iterator 对象加锁。
**正例：**
```java
List<String > list = new ArrayList <>();
list.add("1");
list.add("2");
Iterator<String > iterator  = list.iterator ();
while (iterator .hasNext ()) {
String  item = iterator .next();
if (删除元素的条件 ) {
iterator .remove();
}
}
```

**反例：**
```java
for (String  item : list) {
if ("1".equals (item)) {
list.remove (item);
}
}
```

**说明：** 反例中的执行结果肯定会出乎大家的意料，那么试一下把 "1" 换成 "2" 会是同样的结果吗？
**15.【强制】** 在 JDK7 版本及以上，Comparator 实现类要满足如下三个条件，不然 Arrays.sort、Collections.sort 会抛 IllegalArgumentException 异常。
**说明：** 三个条件如下
1）x，y的比较结果和 y，x的比较结果相反。
2）x > y，y > z，则 x > z。
3）x = y，则 x，z比较结果和 y，z比较结果相同。
**反例：** 下例中没有处理相等的情况，交换两个对象判断结果并不互反，不符合第一个条件，在实际使用中可能会出现异常。
```java
new Comparator <Student >() {
@Override
public  int compare (Student  o1, Student  o2) {
return  o1.getId () > o2.getId () ? 1 : -1;
}
};
```

**16.【推荐】** 泛型集合使用时，在 JDK7 及以上，使用 diamond 语法或全省略。
**说明：** 菱形泛型，即 diamond，直接使用 <> 来指代前边已经指定的类型。
**正例：**
```java
// diamond 方式 ，即<>
HashMap <String , String > userCache  = new HashMap <>(16);
// 全省略 方式
ArrayList <User> users  = new ArrayList (10);
```

**17.【推荐】** 集合初始化时，指定集合初始值大小。
**说明：** HashMap 使用构造方法 HashMap(int initialCapacity) 进行初始化时，如果暂时无法确定集合大小，那么指定默认值（16）即可。
**正例：** initialCapacity = (需要存储的元素个数 / 负载因子) + 1。注意负载因子（即 loaderfactor）默认为 0.75，如果暂时无法确定初始值大小，请设置为 16（即默认值）。
**反例：** HashMap 需要放置 1024 个元素，由于没有设置容量初始大小，随着元素增加而被迫不断扩容，resize() 方法总共会调用 8 次，反复重建哈希表和数据迁移。当放置的集合元素个数达千万级时会影响程序性能。
**18.【推荐】** 使用 entrySet 遍历 Map 类集合 KV，而不是 keySet 方式进行遍历。
**说明：** keySet 其实是遍历了 2 次，一次是转为 Iterator 对象，另一次是从 hashMap 中取出 key 所对应的 value。而 entrySet 只是遍历了一次就把 key 和 value 都放到了 entry 中，效率更高。如果是 JDK8，使用 Map.forEach 方法。
**正例：** values() 返回的是 V 值集合，是一个 list 集合对象；keySet() 返回的是 K 值集合，是一个 Set 集合对象；entrySet() 返回的是 K-V 值组合的 Set 集合。
**19.【推荐】** 高度注意 Map 类集合 K / V 能不能存储 null 值的情况，如下表格：

| 集合类 | Key | Value | Super | 说明 |
|--------|-----|-------|-------|------|
| Hashtable | 不允许为null | 不允许为null | Dictionary | 线程安全 |
| TreeMap | 不允许为null | 允许为null | AbstractMap | 线程不安全 |
| ConcurrentHashMap | 不允许为null | 不允许为null | AbstractMap | 锁分段技术（JDK8:CAS） |
| HashMap | 允许为null | 允许为null | AbstractMap | 线程不安全 |

**反例：** 由于 HashMap 的干扰，很多人认为 ConcurrentHashMap 是可以置入 null 值，而事实上，存储 null 值时会抛出 NPE 异常。
**20.【参考】** 合理利用好集合的有序性（sort）和稳定性（order），避免集合的无序性（unsort）和不稳定性（unorder）带来的负面影响。
**说明：** 有序性是指遍历的结果是按某种比较规则依次排列的，稳定性指集合每次遍历的元素次序是一定的。如：ArrayList 是 order / unsort；HashMap 是 unorder / unsort；TreeSet 是 order / sort。

**21.【参考】** 利用 Set 元素唯一的特性，可以快速对一个集合进行去重操作，避免使用 List 的 contains() 进行遍历去重或者判断包含操作。

