# 编程规约 · OOP 规约

> 来源：《Java 开发手册（黄山版）》v1.7.1，一、编程规约 (四) OOP 规约。
> 本文件只含该节；章节索引见 `alibaba-java/00-index.md`。

## (四) OOP 规约

**1.【强制】** 避免通过一个类的对象引用访问此类的静态变量或静态方法，无谓增加编译器解析成本，直接用类名来访问即可。
**2.【强制】** 所有的覆写方法，必须加 @Override 注解。
**说明：** getObject() 与 get0bject() 的问题。一个是字母的 O，一个是数字的 0，加 @Override 可以准确判断是否覆盖成功。另外，如果在抽象类中对方法签名进行修改，其实现类会马上编译报错。
**3.【强制】** 相同参数类型，相同业务含义，才可以使用的可变参数，参数类型避免定义为 Object。
**说明：** 可变参数必须放置在参数列表的最后。（建议开发者尽量不用可变参数编程）
**正例：** public List<User> listUsers(String type, Long... ids) {...}
**4.【强制】** 外部正在调用的接口或者二方库依赖的接口，不允许修改方法签名，避免对接口调用方产生影响。接口过时必须加 @Deprecated 注解，并清晰地说明采用的新接口或者新服务是什么。
**5.【强制】** 不能使用过时的类或方法。
**说明：** java.net.URLDecoder 中的方法 decode(String encodeStr) 这个方法已经过时，应该使用双参数 decode(String source, String encode)。接口提供方既然明确是过时接口，那么有义务同时提供新的接口；作为调用方来说，有义务去考证过时方法的新实现是什么。
**6.【强制】** Object 的 equals 方法容易抛空指针异常，应使用常量或确定有值的对象来调用 equals。
**正例：** "test".equals(param);
**反例：** param.equals("test");
**说明：** 推荐使用 JDK7 引入的工具类 java.util.Objects#equals(Object a, Object b)
**7.【强制】** 所有整型包装类对象之间值的比较，全部使用 equals 方法比较。
**说明：** 对于 Integer var = ? 在 -128 至 127 之间的赋值，Integer 对象是在 IntegerCache.cache 产生，会复用已有对象，这个区间内的 Integer 值可以直接使用 == 进行判断，但是这个区间之外的所有数据，都会在堆上产生，并不会复用已有对象，这是一个大坑，推荐使用 equals 方法进行判断。
**8.【强制】** 任何货币金额，均以最小货币单位且为整型类型进行存储。
**9.【强制】** 浮点数之间的等值判断，基本数据类型不能使用 == 进行比较，包装数据类型不能使用 equals 进行判断。
**说明：** 浮点数采用 "尾数+阶码" 的编码方式，类似于科学计数法的 "有效数字+指数" 的表示方式。二进制无法精确表示大部分的十进制小数，具体原理参考《码出高效》。
**反例：**
```java

float a = 1.0F - 0.9F;
float b = 0.9F - 0.8F;
if (a == b) {
// 预期进入此代码块 ，执行其它业务逻辑
// 但事实 上a == b的结果为 false
}
Float x = Float .valueOf (a);
Float y = Float .valueOf (b);
if (x.equals (y)) {
// 预期进入此代码块 ，执行其它业务逻辑
// 但事实上 equals 的结果 为false
}
```

**正例：**
```java
(1)指定一个误差范围，两个浮点数的差值在此范围之内，则认为是相等的。
float a = 1.0F - 0.9F;
float b = 0.9F - 0.8F;
float diff = 1e-6F;
if (Math .abs(a - b) < diff) {
System .out.println ("true" );
}

(2)使用 BigD ecimal 来定义值，再进行浮点数的运算操作。
BigDecimal  a = new BigDecimal ("1.0" );
BigDecimal  b = new BigDecimal ("0.9" );
BigDecimal  c = new BigDecimal ("0.8" );
BigDecimal  x = a.subtract (b);
BigDecimal  y = b.subtract (c);
if (x.compareTo (y) == 0) {
System .out.println ("true" );
}
```

**10.【强制】** BigDecimal 的等值比较应使用 compareTo() 方法，而不是 equals() 方法。
**说明：** equals() 方法会比较值和精度（1.0 与 1.00 返回结果为 false），而 compareTo() 则会忽略精度。
**11.【强制】** 定义数据对象 DO 类时，属性类型要与数据库字段类型相匹配。
**正例：** 数据库字段的 bigint 必须与类属性的 Long 类型相对应。
**反例：** 某业务的数据库表 id 字段定义类型为 bigint unsigned，实际类对象属性为 Integer，随着 id 越来越大，超过 Integer 的表示范围而溢出成为负数，此时数据库 id 不支持存入负数抛出异常产生线上故障。
**12.【强制】** 禁止使用构造方法 BigDecimal(double) 的方式把 double 值转化为 BigDecimal 对象。
**说明：** BigDecimal(double) 存在精度损失风险，在精确计算或值比较的场景中可能会导致业务逻辑异常。如：BigDecimal g = new BigDecimal(0.1F)；实际的存储值为：0.100000001490116119384765625
**正例：** 优先推荐入参为 String 的构造方法，或使用 BigDecimal 的 valueOf 方法，此方法内部其实执行了 Double 的 toString，而 Double 的 toString 按 double 的实际能表达的精度对尾数进行了截断。
```java
BigDecimal  recommend1  = new BigDecimal ("0.1" );
BigDecimal  recommend2  = BigDecimal .valueOf (0.1);
```

**13.** 关于基本数据类型与包装数据类型的使用标准如下：
**1）【强制】** 所有的 POJO 类属性必须使用包装数据类型。
**2）【强制】** RPC 方法的返回值和参数必须使用包装数据类型。
**3）【推荐】** 所有的局部变量使用基本数据类型。
**说明：** POJO 类属性没有初值是提醒使用者在需要使用时，必须自己显式地进行赋值，任何 NPE 问题，或者入库检查，都由使用者来保证。
**正例：** 数据库的查询结果可能是 null，因为自动拆箱，用基本数据类型接收有 NPE 风险。
**反例：** 某业务的交易报表上显示成交总额涨跌情况，即正负 x%，x 为基本数据类型，调用的 RPC 服务，调用不成功时，返回的是默认值，页面显示为 0%，这是不合理的，应该显示成中划线 -。所以包装数据类型的 null 值，能够表示额外的信息，如：远程调用失败，异常退出。
**14.【强制】** 定义 DO / PO / DTO / VO 等 POJO 类时，不要设定任何属性默认值。
**反例：** 某业务的 DO 的 create Time 默认值为 new Date()；但是这个属性在数据提取时并没有置入具体值，在更新其它字段时又附带更新了此字段，导致创建时间被修改成当前时间。
**15.【强制】** 序列化类新增属性时，请不要修改 serialVersionUID 字段，避免反序列失败；如果完全不兼容升级，避免反序列化混乱，那么请修改 serialVersionUID 值。
**说明：** 注意 serialVersionUID 不一致会抛出序列化运行时异常。
**16.【强制】** 构造方法里面禁止加入任何业务逻辑，如果有初始化逻辑，请放在 init 方法中。
**17.【强制】** POJO 类必须写 toString 方法。使用 IDE 中的工具 source > generate toString 时，如果继承了另一个 POJO 类，注意在前面加一下 super.toString()。
**说明：** 在方法执行抛出异常时，可以直接调用 POJO 的 toString() 方法打印其属性值，便于排查问题。
**18.【强制】** 禁止在 POJO 类中，同时存在对应属性 xxx 的 isXxx() 和 getXxx() 方法。
**说明：** 框架在调用属性 xxx 的提取方法时，并不能确定哪个方法一定是被优先调用到，神坑之一。
**19.【推荐】** 使用索引访问用 String 的 split 方法得到的数组时，需做最后一个分隔符后有无内容的检查，否则会有抛 IndexOutOfBoundsException 的风险。
**说明：**
```java
String  str = "a,b,c,," ;
String [] ary = str.split(",");
// 预期大于 3，结果 等于 3
System .out.println (ary.length );
```

**20.【推荐】** 当一个类有多个构造方法，或者多个同名方法，这些方法应该按顺序放置在一起，便于阅读，此条规则优先于下一条。
**正例：**
```java
   public int method (int param) ;
   protected double  method (int param1, int param2) ;
   private void method ();
```

**21.【推荐】** 类内方法定义的顺序依次是：公有方法或保护方法 > 私有方法 > getter / setter 方法。
**说明：** 公有方法是类的调用者和维护者最关心的方法，首屏展示最好；保护方法虽然只是子类关心，也可能是 "模板设计模式" 下的核心方法；而私有方法外部一般不需要特别关心，是一个黑盒实现；因为承载的信息价值较低，所有 Service 和 DAO 的 getter / setter 方法放在类体最后。
**22.【推荐】** setter 方法中，参数名称与类成员变量名称一致，this.成员名 = 参数名。在 getter / setter 方法中，不要增加业务逻辑，增加排查问题的难度。
**反例：**
```java
public  Integer  getData () {
if (condition ) {
return this.data + 100;
} else {
return this.data - 100;
}
}
```

**23.【推荐】** 循环体内，字符串的连接方式，使用 StringBuilder 的 append 方法进行扩展。
**反例：**
```java
String str = "start" ;
for (int i = 0; i < 100; i++) {
str = str + "hello" ;
}
```

**说明：** 反编译出的字节码文件显示每次循环都会 new 出一个 StringBuilder 对象，然后进行 append 操作，最后通过 toString() 返回 String 对象，造成内存资源浪费。
**24.【推荐】** final 可以声明类、成员变量、方法、以及本地变量，下列情况使用 final 关键字：
1）不允许被继承的类，如：String 类。
2）不允许修改引用的域对象，如：POJO 类的域变量。
3）不允许被覆写的方法，如：POJO 类的 setter 方法。
4）不允许运行过程中重新赋值的局部变量。
5）避免上下文重复使用一个变量，使用 final 关键字可以强制重新定义一个变量，方便更好地进行重构。
**25.【推荐】** 慎用 Object 的 clone 方法来拷贝对象。
**说明：** 对象 clone 方法默认是浅拷贝，若想实现深拷贝需覆写 clone 方法实现域对象的深度遍历式拷贝。
**26.【推荐】** 类成员与方法访问控制从严：
1）如果不允许外部直接通过 new 来创建对象，那么构造方法必须是 private。
2）工具类不允许有 public 或 default 构造方法。
3）类非 static 成员变量并且与子类共享，必须是 protected。
4）类非 static 成员变量并且仅在本类使用，必须是 private。
5）类 static 成员变量如果仅在本类使用，必须是 private。
6）若是 static 成员变量，考虑是否为 final。
7）类成员方法只供类内部调用，必须是 private。
8）类成员方法只对继承类公开，那么限制为 protected。
**说明：** 任何类、方法、参数、变量，严控访问范围。过于宽泛的访问范围，不利于模块解耦。思考：如果是一个 private 的方法，想删除就删除，可是一个 public 的 service 成员方法或成员变量，删除一下，不得手心冒点汗吗？

变量像自己的小孩，尽量在自己的视线内，变量作用域太大，无限制的到处跑，那么你会担心的。

