
class MiniVue{
  constructor(options={}){
    this.$options = options 
    this.$data =reactive(options.data)
    //模板解析
    new Compiler(options.el, this)
  }
}

