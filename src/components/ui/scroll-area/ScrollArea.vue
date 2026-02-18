<script setup>
import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaViewport } from "reka-ui";
import { cn } from "@/lib/utils";
import ScrollBar from "./ScrollBar.vue";

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  class: { type: null, required: false },
});
</script>

<template>
  <ScrollAreaRoot
    v-bind="$attrs"
    :class="
      cn(
        'relative overflow-hidden',
        props.class,
      )
    "
  >
    <ScrollAreaViewport class="h-full w-full rounded-[inherit]">
      <slot />
    </ScrollAreaViewport>
    <ScrollBar />
    <ScrollBar orientation="horizontal" />
    <ScrollAreaCorner />
  </ScrollAreaRoot>
</template>
