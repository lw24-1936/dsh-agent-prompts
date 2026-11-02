# 编程规约 · 常量定义与代码格式

> 来源：《Java 开发手册（黄山版）》v1.7.1，一、编程规约 (二) 常量定义、(三) 代码格式。
> 本文件只含该节；章节索引见 `alibaba-java/00-index.md`。

## (二) 常量定义

**1.【强制】** 不允许任何魔法值（即未经预先定义的常量）直接出现在代码中。
**反例：** 
```java
//  开发者 A定义了缓存的 key。
String  key = "Id#taobao_ " + tradeId;

cache. put(key,  value);
// 开发者 B使用缓存时 直接复制 少了下划线，即 key 是"Id#taobao"  + tradeId ，导致出现故障 。
String  key = "Id#taobao " + tradeId;

cache. get(key);
```

**2.【强制】** long 或 Long 赋值时，数值后使用大写 L，不能是小写 l，小写容易跟数字混淆，造成误解。
**说明：** public static final Long NUM = 2l; 写的是数字的 21，还是 Long 型的 2？
**3.【强制】** 浮点数类型的数值后缀统一为大写的 D 或 F。
**正例：**
```java
public static final  double  HEIGHT  = 175.5D ;
public  static final  float WEIGHT  = 150.3F ;
```

**4.【推荐】** 不要使用一个常量类维护所有常量，要按常量功能进行归类，分开维护。
**说明：** 大而全的常量类，杂乱无章，使用查找功能才能定位到要修改的常量，不利于理解，也不利于维护。
**正例：** 缓存相关常量放在类 CacheConsts 下；系统配置相关常量放在类 SystemConfigConsts 下。
**5.【推荐】** 常量的复用层次有五层：跨应用共享常量、应用内共享常量、子工程内共享常量、包内共享常量、类内共享常量。
1）跨应用共享常量：放置在二方库中，通常是 client.jar 中的 constant 目录下。
2）应用内共享常量：放置在一方库中，通常是子模块中的 constant 目录下。
**反例：** 易懂常量也要统一定义成应用内共享常量，两个程序员在两个类中分别定义了表示"是"的常量：
类 A 中：public static final String YES = "yes";
类 B 中：public static final String YES = "y";
A.YES.equals(B.YES)，预期是 true，但实际返回为 false，导致线上问题。
3）子工程内部共享常量：即在当前子工程的 constant 目录下。
4）包内共享常量：即在当前包下单独的 constant 目录下。
5）类内共享常量：直接在类内部 private static final 定义。
**6.【推荐】** 如果变量值仅在一个固定范围内变化用 enum 类型来定义。
**说明：** 如果存在名称之外的延伸属性应使用 enum 类型，下面正例中的数字就是延伸信息，表示一年中的第几个季节。
**正例：**
```java
public  enum  SeasonEnum  {
SPRING (1), SUMMER (2), AUTUMN (3), WINTER (4);
private int seq;

SeasonEnum (int seq) {
this.seq = seq;
}
public  int getSeq () {

retur n seq;
}
}
```

## (三) 代码格式

**1.【强制】** 如果大括号内为空，简洁地写成 {} 即可，大括号中间无需换行和空格；如果是非空代码块，则：
1）左大括号前不换行。
2）左大括号后换行。
3）右大括号前换行。
4）右大括号后还有 else 等代码则不换行；表示终止的右大括号后必须换行。
**2.【强制】** 左小括号和右边相邻字符之间不需要空格；右小括号和左边相邻字符之间也不需要空格；而左大括号前需要加空格。详见第 5 条下方正例提示。
**反例：** if(空格 a == b空格)
**3.【强制】** if / for / while / switch / do 等保留字与左右括号之间都必须加空格。
**4.【强制】** 任何二目、三目运算符的左右两边都需要加一个空格。
**说明：** 包括赋值运算符 =、逻辑运算符 &&、加减乘除符号等。
**5.【强制】** 采用 4 个空格缩进，禁止使用 Tab 字符。
**说明：** 如使用 Tab 缩进，必须设置 1 个 Tab 为 4 个空格。IDEA 设置 Tab 为 4 个空格时，请勿勾选 Use tab character；而在 Eclipse 中，找到 tab policy 设置为 Spaces only，Tab size：4，最后必须勾选 insert spaces for tabs
**正例：** （涉及上述中的 1-5 点）
```java
public  static  void main (String[]  args)  {
// 缩进 4个空格
String  say = "hello" ;
// 运算符 的左右必须有一个空格
int flag = 0;
// 关键词 if与括号之间必须有一个空格 ，括号内的 f与左括号 ，0与右括号不需要空格
if (flag == 0) {
System .out.println (say);
}
// 左大括号前加空格 且不换行 ；左大括号后换行
if (flag == 1) {
System .out.println ("world" );
// 右大括号前换行 ，右大括号后有 else ，不用换行
} else {
System .out.println ("ok");
// 在右大括号后直接结束，则必须换行
}
}
```

**6.【强制】** 注释的双斜线与注释内容之间有且仅有一个空格。
**正例：**
```java
// 这是示例注释，请注意在双斜线之后有一个空格
String  commentString  = new String ("demo ");
```

**7.【强制】** 在进行类型强制转换时，右括号与强制转换值之间不需要任何空格隔开。
**正例：**
```java
double  first = 3.2D;
int second  = (int)first + 2;
```

**8.【强制】** 单行字符数限制不超过 120 个，超出需要换行，换行时遵循如下原则：
1）第二行相对第一行缩进 4 个空格，从第三行开始，不再继续缩进，参考示例。
2）运算符与下文一起换行。
3）方法调用的点符号与下文一起换行。
4）方法调用中的多个参数需要换行时，在逗号后进行。
5）在括号前不要换行，见反例。
**正例：**
```java
StringBuilder  builder  = new StringBuilder ();
// 超过 120 个字符的情况下 ，换行缩进 4个空格，并且方法前的点号一起换行
builder .append("yang" ).append ("hao" )...
.append ("chen" )...
.append ("chen" )...
.append ("chen");
```

**反例：**
```java
StringBuilder  builder  = new StringBuilder ();
// 超过 120 个字符的情况 下，不要在括号前换行
builder .append("you" ).append ("are" )...append

("lucky" );
// 参数很多的方法调用可能超过 120 个字符 ，逗号后才是换行处

method (args1 , args2 , args3 , ...
, argsX);
```

**9.【强制】** 方法参数在定义和传入时，多个参数逗号后面必须加空格。
**正例：** 下例中实参的 args1 逗号后边必须要有一个空格。
method(args1, args2, args3);

**10.【强制】** IDE 的 text file encoding 设置为 UTF-8；IDE 中文件的换行符使用 Unix 格式，不要使用 Windows 格式。
**11.【推荐】** 单个方法的总行数不超过 80 行。
**说明：** 除注释之外的方法签名、左右大括号、方法内代码、空行、回车及任何不可见字符的总行数不超过 80 行。
**正例：** 代码逻辑分清红花和绿叶，个性和共性，绿叶逻辑单独出来成为额外方法，使主干代码更加晰；共性逻辑抽取成为共性方法，便于复用和维护。
**12.【推荐】** 没有必要增加若干空格来使变量的赋值等号与上一行对应位置的等号对齐。
**正例：**
```java
int one = 1;
long two = 2L;
float three  = 3F;
StringBuilder  builder  = new StringBuilder ();
```

**说明：** 增加 builder 这个变量，如果需要对齐，则给 one、two、three 都要增加几个空格，在变量比较多的情况下，是非常累赘的事情。
**13.【推荐】** 不同逻辑、不同语义、不同业务的代码之间插入一个空行，分隔开来以提升可读性。
**说明：** 任何情形，没有必要插入多个空行进行隔开。

