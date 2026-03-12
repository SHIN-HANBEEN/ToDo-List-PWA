<script setup>
import { cn } from "@/lib/utils";

// Primitive rule: move repeated surface changes to shared tokens/classes first.
// Keep `props.class` for screen-specific spacing or composition only.
const props = defineProps({
  class: { type: null, required: false },
});
</script>

<template>
  <div
    :class="
      cn('rounded-xl border bg-card text-card-foreground shadow', props.class)
    "
  >
    <slot />
  </div>
</template>
