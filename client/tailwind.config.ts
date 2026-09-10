import type { Config } from 'tailwindcss';

/**
 * 全部颜色/字号/间距/圆角指向 design-tokens.css 的 CSS 变量。
 * 本文件不出现任何颜色字面量（ARCHITECTURE 硬规则 4）。
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--color-bg-page)',
        surface: 'var(--color-bg-surface)',
        sunken: 'var(--color-bg-sunken)',
        ink: {
          DEFAULT: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          onAccent: 'var(--color-text-on-accent)',
        },
        line: {
          subtle: 'var(--color-border-subtle)',
          DEFAULT: 'var(--color-border-default)',
          strong: 'var(--color-border-strong)',
        },
        accent: {
          DEFAULT: 'var(--color-accent-default)',
          hover: 'var(--color-accent-hover)',
          active: 'var(--color-accent-active)',
          subtle: 'var(--color-accent-subtle)',
          border: 'var(--color-accent-subtle-border)',
        },
        high: {
          DEFAULT: 'var(--color-risk-high-default)',
          subtle: 'var(--color-risk-high-subtle)',
          border: 'var(--color-risk-high-border)',
        },
        watch: {
          DEFAULT: 'var(--color-risk-watch-default)',
          subtle: 'var(--color-risk-watch-subtle)',
          border: 'var(--color-risk-watch-border)',
        },
        safe: {
          DEFAULT: 'var(--color-risk-safe-default)',
          subtle: 'var(--color-risk-safe-subtle)',
          border: 'var(--color-risk-safe-border)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      fontSize: {
        xs: ['var(--font-size-xs)', 'var(--font-line-height-xs)'],
        sm: ['var(--font-size-sm)', 'var(--font-line-height-sm)'],
        base: ['var(--font-size-base)', 'var(--font-line-height-base)'],
        md: ['var(--font-size-md)', 'var(--font-line-height-md)'],
        lg: ['var(--font-size-lg)', 'var(--font-line-height-lg)'],
        xl: ['var(--font-size-xl)', 'var(--font-line-height-xl)'],
        '2xl': ['var(--font-size-2xl)', 'var(--font-line-height-2xl)'],
        metric: ['var(--font-size-metric)', 'var(--font-line-height-metric)'],
      },
      fontWeight: {
        read: 'var(--font-weight-read)',
        emphasis: 'var(--font-weight-emphasis)',
        announce: 'var(--font-weight-announce)',
      },
      letterSpacing: {
        small: 'var(--font-letter-spacing-small)',
        tight: 'var(--font-letter-spacing-tight)',
        tighter: 'var(--font-letter-spacing-tighter)',
      },
      spacing: {
        hair: 'var(--space-hair)',
        '2xs': 'var(--space-2xs)',
        xs: 'var(--space-xs)',
        sm: 'var(--space-sm)',
        md: 'var(--space-md)',
        lg: 'var(--space-lg)',
        xl: 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
        '4xl': 'var(--space-4xl)',
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        overlay: 'var(--shadow-overlay)',
        modal: 'var(--shadow-modal)',
        focus: 'var(--focus-ring)',
      },
      maxWidth: {
        question: 'var(--layout-container-question)',
        result: 'var(--layout-container-result)',
      },
      transitionDuration: {
        instant: 'var(--motion-duration-instant)',
        fast: 'var(--motion-duration-fast)',
        base: 'var(--motion-duration-base)',
        slow: 'var(--motion-duration-slow)',
      },
      transitionTimingFunction: {
        standard: 'var(--motion-easing-standard)',
        entrance: 'var(--motion-easing-entrance)',
        exit: 'var(--motion-easing-exit)',
      },
    },
  },
  plugins: [],
} satisfies Config;
