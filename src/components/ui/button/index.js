import { cva } from "class-variance-authority";

export { default as Button } from "./Button.vue";

// Primitive rule:
// - Update shared tokens/variants here when the change should apply across screens.
// - Use per-call `class` overrides only for local layout or one-off context adjustments.
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[14px] text-[0.9375rem] font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_4px_rgba(49,130,246,0.18)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#3182F6] text-white shadow-[0_6px_18px_rgba(27,100,218,0.22)] hover:bg-[#1B64DA] active:translate-y-[1px]",
        destructive:
          "bg-[#F04452] text-white shadow-[0_6px_16px_rgba(240,68,82,0.2)] hover:bg-[#D92D39]",
        outline:
          "border border-[#D1D6DB] bg-white text-[#191F28] hover:bg-[#F9FAFB]",
        secondary:
          "bg-[#F2F4F6] text-[#333D4B] hover:bg-[#E5E8EB]",
        ghost: "text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#191F28]",
        link: "text-[#1B64DA] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[52px] px-5",
        xs: "h-8 rounded-[10px] px-2.5 text-xs",
        sm: "h-10 rounded-[12px] px-3 text-[0.8125rem]",
        lg: "h-12 rounded-[16px] px-7",
        icon: "h-10 w-10 rounded-full",
        "icon-sm": "size-8 rounded-full",
        "icon-lg": "size-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
