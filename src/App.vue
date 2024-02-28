<template>
  <div id="app">
    <app-simon-game />
  </div>
</template>

<script>
import AppSimonGame from '@/components/AppSimonGame.vue';
export default {
  name: 'App',
  components: {
    AppSimonGame,
  },
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  height: 100%;
}
body {
  height: 100dvh;
}
</style>
