class Compiler {
  // el 是宿主元素
  // vm 是 MyVue 实例
  constructor(el, vm) {
    this.$vm = vm;
    this.$el = document.querySelector(el);

    if (this.$el) {
      // 执行编译
      this.compile(this.$el);
    }
  }

  compile(el) {
    // 遍历 el 树
    const childNodes = el.childNodes;
    Array.from(childNodes).forEach((node) => {
      // 判断是否是元素
      if (this.isElement(node)) {
        this.compileElement(node);
      } else if (this.isInter(node)) {
        this.compileText(node);
      }

      // 递归子节点
      if (node.childNodes && node.childNodes.length > 0) {
        this.compile(node);
      }
    });
  }

  isElement(node) {
    return node.nodeType === 1;
  }

  isInter(node) {
    // 首先是文本标签, 其次内容是 {{xxx}}
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
  }

  compileText(node) {
    // node.textContent = this.$vm[RegExp.$1.trim()]
    this.update(node, RegExp.$1.trim(), "text");
  }

  compileElement(node) {
    // 节点是元素
    // 遍历其属下列表
    const nodeAttrs = node.attributes;
    Array.from(nodeAttrs).forEach((attr) => {
      // 规定: 指令以 my-xx="yyy" 定义
      const attrName = attr.name; // xx
      const exp = attr.value; // yyy
      if (this.isDirective(attrName)) {
        const dir = attrName.substring(3);
        //  执行指令
        this[dir] && this[dir](node, exp);
      }

      // 事件处理
      if (this.isEvent(attrName)) {
        // @click='onClick'
        const dir = attrName.substring(1);
        // 事件监听
        this.eventHandler(node, exp, dir);
      }
    });
  }

  isDirective(attr) {
    return attr.indexOf("my-") === 0;
  }

  isEvent(dir) {
    return dir.indexOf("@") === 0;
  }

  update(node, exp, dir) {
    // 初始化
    // 指令对应更新函数xxUpdater
    
    const fn = this[dir + "Updater"];
    
    fn && fn(node, this.$vm[exp]);

    console.log(node,dir)
    
    // 更新处理
    new Watcher(this.$vm, exp, function (val) {
     
      fn && fn(node, val);
    
    });
  
  }

  textUpdater(node, value) {
    node.textContent = value;
  }

  htmlUpdater(node, value) {
    node.innerHTML = value;
  }

  modelUpdater(node, value) {
    node.value = value;
  }

  // my-text
  text(node, exp) {
    // node.textContent = this.$vm[exp]
    this.update(node, exp, "text");
  }

  // my-html
  html(node, exp) {
    this.update(node, exp, "html");
  }

  // my-model
  model(node, exp) {
    // update 方法只完成赋值和更新
    this.update(node, exp, "model");
    // 事件监听
    node.addEventListener("input", (e) => {
      // 新的赋值给数据即可
      this.$vm[exp] = e.target.value;
    });
  }

  eventHandler(node, exp, dir) {
    const fn = this.$vm.$options.methods && this.$vm.$options.methods[exp];
    node.addEventListener(dir, fn.bind(this.$vm));
  }
}