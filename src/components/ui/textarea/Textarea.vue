<script setup>
import { useVModel } from "@vueuse/core";
import { cn } from "@/lib/utils";

// Primitive rule: keep base textarea shape, focus, and density aligned here.
// Reach for `props.class` only when the adjustment belongs to one flow or screen.
const props = defineProps({
  defaultValue: { type: String, required: false },
  modelValue: { type: String, required: false },
  class: { type: null, required: false },
});

const emits = defineEmits(["update:modelValue"]);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>

<template>
  <textarea
    v-model="modelValue"
    :class="
      cn(
        'flex min-h-[132px] w-full rounded-[18px] border border-input bg-background px-4 py-3 text-[0.95rem] text-foreground shadow-none transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-[#8FBBFF] focus-visible:ring-0 focus-visible:shadow-[0_0_0_4px_rgba(49,130,246,0.18)] disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>
