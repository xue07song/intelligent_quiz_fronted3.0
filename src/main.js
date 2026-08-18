import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './styles/global.css'
import router from './router'  // ← 新增：导入路由

const app = createApp(App)

app.use(ElementPlus)
app.use(router)  // ← 新增：注册路由
app.mount('#app')

// 1. 创建 Vue 应用实例
// 2. 将 App.vue 作为根组件
// 3. 挂载到 index.html 中 id="app" 的 DOM 节点上