<script setup>
import { reactiveOmit } from "@vueuse/core";
import { ChevronDown } from "lucide-vue-next";
import { SelectIcon, SelectTrigger, useForwardProps } from "reka-ui";
import { cn } from "@/lib/utils";

// Primitive rule: adjust shared trigger height, radius, focus, or icon rhythm here.
// Use `props.class` for screen-local sizing or layout alignment only.
const props = defineProps({
  disabled: { type: Boolean, required: false },
  reference: { type: null, required: false },
  asChild: { type: Boolean, required: false },
  as: { type: null, required: false },
  class: { type: null, required: false },
});

const delegatedProps = reactiveOmit(props, "class");

const forwardedProps = useForwardProps(delegatedProps);
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="
      cn(
        'flex h-[52px] w-full items-center justify-between whitespace-nowrap rounded-[16px] border border-input bg-background px-4 py-2 text-[0.95rem] shadow-none ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-0 focus:border-[#8FBBFF] focus:shadow-[0_0_0_4px_rgba(49,130,246,0.18)] disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate text-start',
        props.class,
      )
    "
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="w-4 h-4 opacity-50 shrink-0" />
    </SelectIcon>
  </SelectTrigger>
</template>
