<script setup>
import { ScrollAreaScrollbar, ScrollAreaThumb } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps({
  orientation: { type: String, required: false, default: "vertical" },
  class: { type: null, required: false },
});
</script>

<template>
  <ScrollAreaScrollbar
    :orientation="props.orientation"
    :class="
      cn(
        'flex touch-none select-none rounded-full bg-muted/45 transition-colors',
        props.orientation === 'vertical' &&
          'h-full w-2.5 border-l border-l-transparent p-[1px]',
        props.orientation === 'horizontal' &&
          'h-2.5 flex-col border-t border-t-transparent p-[1px]',
        props.class,
      )
    "
  >
    <ScrollAreaThumb class="relative flex-1 rounded-full bg-muted-foreground/55 hover:bg-muted-foreground/75" />
  </ScrollAreaScrollbar>
</template>
