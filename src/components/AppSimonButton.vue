<template>
  <div>
    <button
      class="simon-button"
      :class="{ 'simon-button--active': active }"
      :color="color"
      @click="$emit('click')"
      :disabled="disabled"
    ></button>
  </div>
</template>

<script>
export default {
  name: 'AppSimonButton',
  props: {
    color: {
      type: String,
      required: true,
    },
    active: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
.simon-button {
  border: none;
  outline: none;

  aspect-ratio: 1/1;
  width: 100%;
  height: 100%;
  background-color: v-bind(color);
  filter: brightness(0.8);
  transition: filter 0.1s;
}
.simon-button:disabled:active {
  filter: brightness(0.8);
}
.simon-button:active {
  filter: brightness(1);
}
.simon-button--active {
  filter: brightness(1);
}
</style>
