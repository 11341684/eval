const operatorPrecedence={
    0:["."],
    1:["!"],
    2:["*","/"],
    3:["+","-"],
    4:[">=","<=",">","<"],
    5:["===","==","!==","!="],
    6:["&&","||"],
    7:["?",":"],
    8:[","],
    9:["="],
    10:[";"],
    length:11,
    getLevel(str){
        for(let i=0;i<this.length;i++){
            for(let j=0;j<this[i].length;j++){
                if(this[i][j]===str){
                    return i+0.1*j
                }
            }
        }
        return null
    },
    is(str,index){
        for(let i=0;i<this.length;i++){
            let curI=this[i];
            for(let j=0;j<curI.length;j++){
                let curJ=curI[j];
                let len=curJ.length;
                if(curJ===str.slice(index,len+index)){
                    return len
                }
            }
        }
        return 0
    }
};
class Operator {
    constructor(operator){
        this.type="exp";
        this.left=null;
        this.expression=null;
        this.operator=operator;
        this.right=null;
        this.result=null;
        this.hasCalculation=false;
        this.startIndex=0;
        this.endIndex=0;
        this.parent=null;
    }
    setLeft(a){
        this.left=a
    }
    setRight(a){
        this.right=a
    }
    setParent(a){
        this.parent=a
    }
    setOperator(a){
        this.operator=a
    }
    calculation(ctx,scope){
        //计算
        let result;
        let leftValue,rightValue;
        if(this.left){
            if(this.left instanceof Operator){
                leftValue=this.left.calculation(ctx,scope)
            }else {
                leftValue=Operator.calculationBase(this.left,ctx,scope,this.operator)
            }
        }
        if(this.right){
            if(this.right instanceof  Operator){
                rightValue=this.right.calculation(ctx,scope);
            }else {
                rightValue=Operator.calculationBase(this.right,ctx,scope,this.operator)
            }
        }
        switch (this.operator){
            case ".":
                result= ctx[leftValue][rightValue];
                this.ctx=ctx[leftValue];
                this.childKey=rightValue;
                break;
            case "+":
                result= leftValue+rightValue;
                break;
            case "-":
                result= leftValue-rightValue;
                break;
            case "*":
                result= leftValue*rightValue;
                break;
            case "/":
                result= leftValue/rightValue;
                break;
            case "?":
                result= [leftValue,rightValue];
                break;
            case ":":
                result= leftValue[0]?leftValue[1]:rightValue;
                break;
            case ">":
                result= leftValue>rightValue;
                break;
            case ">=":
                result= leftValue>=rightValue;
                break;
            case "<":
                result= leftValue<rightValue;
                break;
            case "<=":
                result= leftValue<=rightValue;
                break;
            case "===":
                result= leftValue===rightValue;
                break;
            case "==":
                result= leftValue==rightValue;
                break;
            case "!==":
                result= leftValue!==rightValue;
                break;
            case "!=":
                result= leftValue!=rightValue;
                break;
            case "&&":
                result= leftValue&&rightValue;
                break;
            case "||":
                result= leftValue||rightValue;
                break;
            case ",":
                result= rightValue;
                break;
            case ";":
                result= rightValue;
                break;
            case "=":
                if(this.left instanceof Operator&&this.left.ctx){
                    result=this.left.ctx[this.left.childKey]=rightValue
                }else {
                    result= ctx[leftValue]=rightValue;
                }
                break;
            default:
                break
        }
        this.hasCalculation=true;
        this.result=result;
        return result
    }
    isHighPrecedence(a){
        if(a instanceof Operator){
            a=a.operator
        }
        if(typeof a !=='string'){
            throw new Error(String(a) + "参数错误");
        }
        const ao=operatorPrecedence.getLevel(a);
        const bo=operatorPrecedence.getLevel(this.operator);
        if(ao===bo&&ao===7)return true;//同层级从右往左计算
        return ao > bo
    }
    static calculationBase(op,ctx,scope,operator){
        if(op.type==="exp")return op.calculation(ctx,scope);
        if(op.type==="number")return Number(op.value);
        if(op.type==="string")return op.value;
        if(op.type==="variable"){
            if(op.value==="true")return true;
            if(op.value==="false")return false;
            if(op.value==="null")return null;
            if(op.value==="undefined")return undefined;
            if(operator==="="||operator===".")return op.value;
            return ctx[op.value]
        }
    }
    static setScope(scope){
        this.scope=scope;
    }
}
function myEval(exp,scope,_this) {
    if(!exp)return exp;
    function start(str,index,result) {
        const data={};
        if(!str||!str[index])return result;
        result.cache={};
        result.root=null;
        return doStart(str,index,result)
    }
    //进入本方法，操作符||变量||常量
    function doStart(str,index,result) {
        while (true){
            let cur=str[index];
            if(/\s/.test(cur)){
                index++;
                continue
            }
            const oLen=operatorPrecedence.is(str,index);
            if(oLen>0){
                let operator=new Operator(str.slice(index,oLen+index));
                if(result.root){
                    if(operator.isHighPrecedence(result.root)){
                        operator.setLeft(result.cache);
                        result.root.setRight(operator);
                        operator.setParent(result.root)
                    }else {
                        result.root.setRight(result.cache);
                        let parent=result.root.parent;
                        let child=result.root;
                        if(parent){
                            while (true){
                                if(!parent){
                                    operator.setLeft(child);
                                    break
                                }
                                if(operator.isHighPrecedence(parent)){
                                    operator.setLeft(child);
                                    parent.setRight(operator);
                                    operator.setParent(parent);
                                    break;
                                }else {
                                    child=parent;
                                    parent=parent.parent;
                                }

                            }
                        }else {
                            operator.setLeft(result.root);
                        }
                    }
                }else {
                    operator.setLeft(result.cache)
                }
                result.root=operator;
                result.cache={};
                index+=oLen;
                continue;
            }else if("0123456789".indexOf(cur)>-1){//数字
                index=doNumber(str,index,result);
            }else if(cur==="\""||cur==="'"){//字符串
                index=doString(str,index,result);
            } else if(/[a-zA-Z_]/.test(cur)){//变量
                index=doVariable(str,index,result)
            }else {
                throw new Error(cur + "不认识，index:"+index);
            }
            if(!str[index]){
                if(!result.root){
                    result.root=new Operator(",");
                }
                if(result.cache){
                    result.root.setRight(result.cache)
                }
                while (result.root.parent){
                    result.root=result.root.parent
                }
                break
            }
        }
        return result.root
    }
    function doNumber(str,index,result) {
        result.cache.type="number";
        result.cache.value=str[index];
        index++;
        while (true){
            if(str[index]&&"0123456789.".indexOf(str[index])>-1){
                result.cache.value+=str[index];
                index++;
            }else {
                break
            }
        }
        return index
    }
    function doString(str,index,result) {
        result.cache.type="string";
        result.cache.value="";
        index++;
        while (true){
            if(!str[index]){
                throw new Error("结尾引号没找到！")
            }
            if(str[index]!=="\""&&str[index]!=="'"){
                result.cache.value+=str[index];
                index++;
            }else {
                index++;
                break
            }
        }
        return index
    }
    function doVariable(str,index,result) {
        result.cache.type="variable";
        result.cache.value=str[index];
        index++;
        while (true){
            if(str[index]&&/[a-zA-Z$_]/.test(str[index])){
                result.cache.value+=str[index];
                index++;
            }else {
                break
            }
        }
        return index
    }
    function getResult(expObj,scope,_this) {
        //"实际值："+0&&new Function("data","with(data){return "+exp+"}").call(_this,scope)
        return "计算值："+expObj.calculation(scope,_this);
    }
    return getResult(start(exp,0,{}),scope,_this)
}
const data={"zn":{name:"赵宁"}};
myEval("zn.name='张三';zn.name=zn.name+1*3;zn.name=zn.name==='张三2'?zn.name:'很遗憾我是'+zn.name",data,data);
