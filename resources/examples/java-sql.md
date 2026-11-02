# SQL：`${}` 拼接 / 无 where 的 update、delete

- 规则：`JAVA_SQL_DOLLAR` / `JAVA_SQL_NO_WHERE` / `XML_SQL_DOLLAR` / `XML_SQL_NO_WHERE`
- 章节：04 安全、05-(三)、05-(八)

## ❌ 反例

```xml
<select id="page" resultType="UserVO">
  select id, name from t_user where name like '%${keyword}%'
</select>

<update id="rename">
  update t_user set name = #{name}
</update>
```

问题：`${}` 直接拼接用户输入，SQL 注入；update 没有 where，全表更新。

## ✅ 正例

```xml
<select id="page" resultType="UserVO">
  select id, name from t_user
  where name like concat('%', #{keyword}, '%')
  order by id desc
  limit #{offset}, #{size}
</select>

<update id="rename">
  update t_user set name = #{name} where id = #{id}
</update>
```

要点：

- 用户输入一律 `#{}` / `PreparedStatement` / `setParameter`；
- 排序字段等无法参数化的动态列，必须用白名单映射，不能直接拼；
- update/delete 必须有 where；批量操作写明范围并确认；
- 判存在用 `limit 1`，不要全表 `count(*)`。
