// 创建My Vue构造函数

function defineReactive(obj, key, val) {
  // 递归
  observe(val);

  // 创建一个Dep和当前key 一一对应
  const dep = new Dep()

  // 利用原型链把dep的notify方法保存起来，数组等使用push的方法就可以直接通知修改数组的值
  if(Array.isArray(obj[key])){
    obj[key].__proto__.notify = function () {
      dep.notify()
    }
  }


  Object.defineProperty(obj, key, {
    get() {
      // 依赖收集在这里
      Dep.target && dep.addDep(Dep.target)

      return val;
    },
    set(newVal) {
      if (newVal !== val) {
        // 如果传入的是新object需要再经过数据劫持
        observe(newVal);
        val = newVal;

        //  通知更新
        dep.notify()
      }

    },
  });
}

function observe(obj) {
  if(typeof obj !== 'object' && obj !== null){
    return
  }

  new Observer(obj)
}

// 代理函数，方便用户直接访问$data中的数据
function proxy(vm, sourceKey) {
  Object.keys(vm[sourceKey]).forEach(key => {
    Object.defineProperty(vm, key, {
      get(){
        return vm[sourceKey][key];
      },
      set(newVal) {
        vm[sourceKey][key] = newVal;
      }
    })
  })
}

class MyVue {
  constructor(options) {
    // 保存选项
    this.$options = options
    this.$data = options.data

    // 响应式处理
    observe(this.$data)

    // 代理
    proxy(this, '$data')

    // 创建编译器
    new Compiler(options.el, this)

  }


}

// 根据对象类型决定如何做响应化

class Observer {
  constructor(obj) {
    this.obj = obj;
    if (typeof obj === "object") {
      Array.isArray(obj) ? this.walkArr(obj) : this.walk(obj);
    }
  }
 // 对象数据响应化
  walk(obj) {
    Object.keys(obj).forEach((key) => {
      defineReactive(obj, key, obj[key]);
    });
  }
  // 数组数据响应化
  walkArr(arr) {
    arr.__proto__ = this.arrayProto;

    const keys = Object.keys(arr);
    for (let i = 0; i < keys.length; i++) {
      defineReactive(arr, i, arr[i])
    }
  }
}


const defaultProto = Array.prototype;
const arrayProto = Object.create(defaultProto);
["push", "pop", "shift", "unshift"].forEach(
  method => {
    arrayProto[method] = function () {
      defaultProto[method].apply(this, arguments);
      this.notify()
    };
  }
);
Observer.prototype.arrayProto = arrayProto


// 观察者: 保存更新函数, 值发生变化调用更新函数
class Watcher {
  constructor(vm, key, updateFn) {
    this.vm = vm;

    this.key = key;

    this.updateFn = updateFn;

    // Dep.target 静态属性上设置为当前的 watcher 实例
    Dep.target = this
    this.vm[this.key]   // 读取触发了 getter
    Dep.target = null   // 收集完就置空
  }

  update(){
    this.updateFn.call(this.vm, this.vm[this.key])
  }
}


// Dep: 依赖，管理某个key相关所有的 Watcher 实例

class Dep{
  constructor(){
    this.deps = [];
  }

  addDep(dep){
    this.deps.push(dep);
  }

  notify(){
    this.deps.forEach(dep => dep.update())
  }
}
