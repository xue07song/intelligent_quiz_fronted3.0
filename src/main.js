import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './styles/global.css'

createApp(App).use(ElementPlus).mount('#app')
// 1. 创建 Vue 应用实例
// 2. 将 App.vue 作为根组件
// 3. 挂载到 index.html 中 id="app" 的 DOM 节点上
