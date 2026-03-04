const defaultTheme = require('tailwindcss/defaultTheme');

/**
 * Toss-inspired Tailwind preset for a Todo / Calendar application.
 *
 * Notes:
 * - This is a practical theme inspired by the public Toss web style.
 * - It focuses on spacious layout, soft neutrals, calm blue emphasis,
 *   large radii, and restrained shadows.
 * - It is not an official Toss design token file.
 */
module.exports = {
  darkMode: ['class'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          ...defaultTheme.fontFamily.sans,
        ],
        display: [
          'Pretendard Variable',
          'Pretendard',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          ...defaultTheme.fontFamily.sans,
        ],
      },
      colors: {
        brand: {
          50: '#EEF6FF',
          100: '#DDEBFF',
          200: '#B9D4FF',
          300: '#8FBBFF',
          400: '#5B9BFF',
          500: '#3182F6',
          600: '#1B64DA',
          700: '#124AA8',
          800: '#0F3B82',
          900: '#0B2C61',
        },
        neutral: {
          0: '#FFFFFF',
          50: '#F9FAFB',
          100: '#F2F4F6',
          200: '#E5E8EB',
          300: '#D1D6DB',
          400: '#B0B8C1',
          500: '#8B95A1',
          600: '#6B7684',
          700: '#4E5968',
          800: '#333D4B',
          900: '#191F28',
        },
        success: {
          50: '#ECFFF6',
          100: '#D7FFEB',
          500: '#16B364',
          600: '#11975B',
          700: '#0B6E44',
        },
        warning: {
          50: '#FFF8E8',
          100: '#FFEBC2',
          500: '#FFB020',
          600: '#E08A00',
          700: '#A65D00',
        },
        danger: {
          50: '#FFF1F3',
          100: '#FFE0E4',
          500: '#F04452',
          600: '#D92D39',
          700: '#B42318',
        },
        background: {
          page: '#F9FAFB',
          surface: '#FFFFFF',
          subtle: '#F2F4F6',
          elevated: '#FFFFFF',
          accent: '#EEF6FF',
          overlay: 'rgba(25, 31, 40, 0.42)',
          inverse: '#191F28',
        },
        text: {
          DEFAULT: '#191F28',
          primary: '#191F28',
          secondary: '#4E5968',
          tertiary: '#8B95A1',
          disabled: '#B0B8C1',
          inverse: '#FFFFFF',
          brand: '#1B64DA',
          danger: '#D92D39',
          success: '#11975B',
        },
        border: {
          DEFAULT: '#E5E8EB',
          subtle: '#F2F4F6',
          strong: '#D1D6DB',
          inverse: '#333D4B',
          brand: '#B9D4FF',
        },
        state: {
          pending: '#8B95A1',
          progress: '#3182F6',
          done: '#16B364',
          overdue: '#F04452',
          draft: '#B0B8C1',
        },
      },
      boxShadow: {
        'toss-xs': '0 1px 2px rgba(15, 23, 42, 0.03)',
        'toss-sm': '0 4px 12px rgba(15, 23, 42, 0.06)',
        'toss-md': '0 8px 24px rgba(15, 23, 42, 0.08)',
        'toss-lg': '0 16px 40px rgba(15, 23, 42, 0.12)',
        'toss-xl': '0 24px 64px rgba(15, 23, 42, 0.18)',
        card: '0 8px 24px rgba(2, 32, 71, 0.08)',
        floating: '0 16px 40px rgba(15, 23, 42, 0.14)',
        modal: '0 24px 64px rgba(15, 23, 42, 0.18)',
        focus: '0 0 0 4px rgba(49, 130, 246, 0.18)',
      },
      borderRadius: {
        'toss-xs': '10px',
        'toss-sm': '14px',
        'toss-md': '18px',
        'toss-lg': '24px',
        'toss-xl': '32px',
        input: '16px',
        card: '24px',
        modal: '28px',
        chip: '999px',
      },
      maxWidth: {
        'content': '1200px',
        'modal-sm': '520px',
        'modal-md': '640px',
        'modal-lg': '800px',
        'modal-xl': '960px',
        'sheet': '420px',
      },
      minHeight: {
        input: '52px',
        textarea: '140px',
        card: '88px',
      },
      spacing: {
        4.5: '1.125rem',
        18: '4.5rem',
        22: '5.5rem',
        26: '6.5rem',
        30: '7.5rem',
      },
      letterSpacing: {
        display: '-0.03em',
        heading: '-0.02em',
      },
      fontSize: {
        'display-1': ['3.5rem', { lineHeight: '1.12', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-2': ['2.75rem', { lineHeight: '1.14', letterSpacing: '-0.03em', fontWeight: '700' }],
        'title-1': ['2rem', { lineHeight: '1.22', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title-2': ['1.5rem', { lineHeight: '1.28', letterSpacing: '-0.02em', fontWeight: '700' }],
        'title-3': ['1.25rem', { lineHeight: '1.35', letterSpacing: '-0.02em', fontWeight: '600' }],
        'body-1': ['1rem', { lineHeight: '1.6', fontWeight: '500' }],
        'body-2': ['0.9375rem', { lineHeight: '1.55', fontWeight: '500' }],
        'label-1': ['0.9375rem', { lineHeight: '1.3', fontWeight: '600' }],
        'label-2': ['0.8125rem', { lineHeight: '1.3', fontWeight: '600' }],
        caption: ['0.75rem', { lineHeight: '1.3', fontWeight: '500' }],
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'toss-out': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        'toss-emphasized': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        250: '250ms',
        400: '400ms',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'sheet-in': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        'scale-in': 'scale-in 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        'sheet-in': 'sheet-in 220ms cubic-bezier(0.22, 1, 0.36, 1)',
        'toast-in': 'toast-in 180ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
};
