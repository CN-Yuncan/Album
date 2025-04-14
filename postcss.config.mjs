const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default {
  plugins: [
    tailwindcss({
      theme: {
        extend: {
          fontFamily: {
            moqugufeng: [
              '"MoquGufeng"', // 直接使用字体名称
              'var(--font-moqugufeng)',
              'KaiTi',
              'cursive'
            ]
          }
        }
      }
    })
  ]
}
