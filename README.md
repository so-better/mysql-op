#### mysql-op
> 一个简单的基于express的nodejs后端对mysql数据库增删改查封装，是我个人在进行nodejs后端开发时集成的一个工具


```
npm install mysql-op
```

在nodeJS+express+mysql项目中使用mysql-op

```
var pool = require('pool.js');//数据库连接
var SqlUtil = require('mysql-op');//引入mysql-op
var sqlUtil = new SqlUtil(pool,'user');//第一个参数pool表示mysql数据库连接池对象，第二个参数表示对应的数据库表名
```

sqlUtil提供的数据库操作方法

```
//向数据库表中插入数据
sqlUtil.insert(entity)
//entity表示对应数据库表的对象，如果数据库表中ID为自增长，这entity中对应的ID设为null
```

```
//更新数据库表中的数据
sqlUtil.update(entity,column)
//entity表示对象数据库表中的对象，column表示表字段，以此为依据更新此表
```


```
//删除数据库表数据
sqlUtil.delete(column,columnValue)
//column表示表字段名称，以此字段为依据删除表中的数据，columnValue表示此字段对应的数值，即删除column字段值为columnValue的数据
```

```
//单一条件查询
sqlUtil.query(column, columnValue, columns)
//column表示表字段名称，以此字段为依据查询，columnValue表示此字段对应的数值，即查询column字段值为columnValue的数据//columns是一个数组，表示查询的表字段，如果查询表中全部字段则不设置此值
```


```
//多条件查询
sqlUtil.querys(queryOptions, conjuction, sortBy, sortMethod, startIndex, pageSize, columns)
//queryOptions是一个对象值，每个字段是表中数据字段，每个字段的值可以直接为字段值，也可以是对象。如果是对象的话，包含value、fuzzy、equal三个字段
//queryOptions为对象时，它的属性value表示数据字段值，属性fuzzy表示是否模糊查询，默认为false
//queryOptions的value属性为数组时，表示范围查询，数组第一个值和第二个值表示查找的范围，假设为a和b，同时假设字段为user_id，如果a>b，则表示user_id>a or user_id<b
//如果a<b，则表示user_id>a and user_id<b
//如果queryOptions的equal值为true则表示范围查询时添加等号，即a>=b或者a<=b，否则为a>b或者a<b，默认equal值我false
//conjuction表示多个条件间的连接词，默认为'and'，可取值'or'//sortBy表示排序依据的字段名称，即根据此字段进行排序//sortMethod表示排序方式，可取值'desc'和'asc'//startIndex表示mysql数据库查询时起始序列//pageSize表示mysql数据库查询时分页页码大小//columns是一个数组，表示查询的表字段，如果查询表中全部字段，则不设置此值 
```

```
//多条件查询时的记录总数
sqlUtil.queryCounts(queryOptions, conjuction)
//queryOptions参数和conjuction参数同querys方法的queryOptions参数和conjuction参数
//结果是一个数值，表示记录总数
```



> sqlUtil提供的方法返回值都是一个Promise对象，使用then/catch进行处理。如果使用async/await，则可以直接获取返回值


querys方法使用示例

```
var options = {
    user_name:{
        value:'xx',//查询user_name为xx的数据
        fuzzy:true//使用模糊查询
    },
    user_age:{
        value:[20,40]//查询user_age在20-40之间的数据
        equal:true//使用等号，即20<=user_age<=40
    },
    user_level:{
        value:[40,20]//查询user_level大于40或者小于20的数据
    },
    user_sex:'男',//查询user_sex为'男'的数据    
    user_mapes:[20]//查询user_mapes大于20的数据
    user_grades:[null,20]//查询user_grades小于20的数据
}
sqlUtil.querys(options,'and','user_id','asc',0,10);
```
### 具体的可以到我的博客网站查看相关信息：[mysql-op](https://www.mvi-web.cn/library/12)