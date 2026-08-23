<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ref } from 'vue'
// import HelloWorld from './components/HelloWorld.vue'
import router from './router'
// import { ElSelect, ElOption } from 'element-plus'
// import 'element-plus/dist/index.css'

// 存储当前选中的路由
const selectedRoute = ref('')

// 处理路由选择变化
const handleRouteChange = (value: string) => {
  if (value) {
    router.push(value)
  }
}
</script>

<template>
  <div class="header">
    <el-col :span="8">
      <el-select v-model="selectedRoute" placeholder="请选择路由" @change="handleRouteChange">
        <el-option
          v-for="route in router.options.routes"
          :key="route.name"
          :label="route.name"
          :value="route.path"
        />
      </el-select>
    </el-col>
  </div>
  <div class="content">
    <RouterView />
  </div>
  <!-- <header>
    <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="125" height="125" />

    <div class="wrapper">
      <HelloWorld msg="You did it!" />

      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
        <RouterLink to="/chart">Chart</RouterLink>
      </nav>
    </div>
  </header> -->
</template>

<style>
/* #app {
  height: 100vh;
} */
</style>
<style scoped>
.header {
  height: 60px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  width: 100vw;
  display: flex;
  align-items: center;
  background-color: antiquewhite;
}
.content {
  height: calc(100vh - 60px);
  margin-top: 60px;
}

/* .logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
} */
</style>
