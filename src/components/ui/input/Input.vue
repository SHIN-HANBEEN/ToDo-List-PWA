<script setup>
import { useVModel } from "@vueuse/core";
import { cn } from "@/lib/utils";

const props = defineProps({
  defaultValue: { type: [String, Number], required: false },
  modelValue: { type: [String, Number], required: false },
  class: { type: null, required: false },
});

const emits = defineEmits(["update:modelValue"]);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>

<template>
  <input
    v-model="modelValue"
    :class="
      cn(
        'flex h-[52px] w-full rounded-[16px] border border-input bg-background px-4 py-2 text-[0.95rem] text-foreground shadow-none transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-[#8FBBFF] focus-visible:ring-0 focus-visible:shadow-[0_0_0_4px_rgba(49,130,246,0.18)] disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>
