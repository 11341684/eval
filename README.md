# eval
小程序端没有eval也没有new Fucntion，这款小而美的插件，可以满足你的愿望-_-，逐步完善中，正在用typescript重新设计，先放出一个刚开始设计时的最小可行性版本

## 使用
```
const data={"zn":{name:"赵宁"}};
myEval("zn.name='张三';zn.name=zn.name+1*3;zn.name=zn.name==='张三2'?zn.name:'很遗憾我是'+zn.name",data,data);

```
