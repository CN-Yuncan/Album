// app/fonts.ts
import { Libre_Franklin } from "next/font/google";
import localFont from 'next/font/local'

// 无衬线字体
export const sans = Libre_Franklin({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-sans",
    adjustFontFallback: {
        sizeAdjust: "0.95",
        ascentOverride: "90%",
    },
});

// 本地字体

export const moqugufeng = localFont({
    src: [
        {
            path: '../public/fonts/MoquGufeng.woff2',
            weight: '400',
            style: 'normal',
        }
    ],
    variable: '--font-moqugufeng',
    display: 'swap',
    declarations: [
        {
            prop: 'font-feature-settings',
            value: '"salt" on, "ss01" on' // 启用字体特性
        }
    ],
    preload: true // 强制预加载
})