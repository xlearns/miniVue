let config = {
  get(obj,key){
    const res = Reflect.get(obj,key)
    track(obj,key)
    return typeof res=='object'&&res!=null?reactive(res):res
  },
  set(obj,key,val){
    Reflect.set(obj,key,val)
    trigger(obj,key,val)
  }
}
function reactive(obj){
return new Proxy(obj,config)
}
let stack = []
let weakMap = new WeakMap()
function track(obj,key){
let effect = stack[stack.length - 1]
if(effect){
  let depsMap = weakMap.get(obj)
  if(!depsMap){
    depsMap = new Map()
    weakMap.set(obj,depsMap)
  }
  let deps = depsMap.get(key)
  if(!deps){
    deps = new Set()
    depsMap.set(key,deps)
  }
  if(!deps.has(effect)){
    deps.add(effect)
    effect.deps.push(effect)
  }
}
}
function trigger(obj,key,val){
let depsMap = weakMap.get(obj)
let computeds = new Set()
let effects = new Set()
if(key){
  let deps = depsMap.get(key)
  deps.forEach(effect=>{
    if(effect.computed){
      computeds.add(effect)
    }else{
      effects.add(effect)
    }
  })
}
computeds.forEach(fn=>fn())
effects.forEach(fn=>fn())
}
function effect(fn,op){
let o = createEffect(fn,op)
if(!o.lazy){
  o()
}
return o
}
function createEffect(fn,op={}){
const effect = function(...args){
  return run(effect,fn,args)
}
effect.deps = []
effect.lazy = op.lazy
effect.computed = op.computed
return effect
}
function run(effect,fn,args){
if(stack.indexOf(effect)==-1){
  try{
    stack.push(effect)
    return fn.apply(this,args)
  }finally{
    stack.pop()
  }
}
}
function computed(fn){
  const ef = effect(fn,{lazy:true,computed:true})
  return {
    runner:ef,
    get value(){
      return ef()
    }
  }
}
