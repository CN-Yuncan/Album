import type { Metadata, ResolvingMetadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

// Providers
import { ThemeProvider } from '~/app/providers/next-ui-providers'
import { ToasterProviders } from '~/app/providers/toaster-providers'
import { SessionProviders } from '~/app/providers/session-providers'
import { ProgressBarProviders } from '~/app/providers/progress-bar-providers'
import { ButtonStoreProvider } from '~/app/providers/button-store-providers'
import { ConfigStoreProvider } from '~/app/providers/config-store-providers'

// 核心组件
import {  MagicCursor, Footer, ClickEffects, DynamicBackground } from '~/components/SiteEssentials'

// 数据获取
import { fetchConfigsByKeys } from '~/server/db/query/configs'

// 样式
import '~/style/globals.css'

type Props = {
    params: { id: string }
    searchParams: { [key: string]: string | string[] | undefined }
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const data = await fetchConfigsByKeys([
        'custom_title',
        'custom_favicon_url'
    ])

    return {
        title: data?.find((item: any) => item.config_key === 'custom_title')?.config_value || 'PicImpact',
        icons: {
            icon: data?.find((item: any) => item.config_key === 'custom_favicon_url')?.config_value || './favicon.ico'
        },
    }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const locale = await getLocale()
    const messages = await getMessages()

    return (
        <html
            lang={locale}
            className="overflow-y-auto scrollbar-hide"
            suppressHydrationWarning
            style={{ cursor: 'none' }}
        >
        <body className="min-h-screen bg-background antialiased">
        <SessionProviders>
            <NextIntlClientProvider messages={messages}>
                <ConfigStoreProvider>
                    <ButtonStoreProvider>
                        <ThemeProvider>
                            <DynamicBackground /> {/* 新增背景层 */}
                            {/* 交互元素需在主题上下文内 */}
                            <MagicCursor />
                            <ClickEffects />

                            {/* 主要内容区域 */}
                            <main className="relative pb-24 z-10"> {/* 提升层级 */}
                                <ToasterProviders />
                                <ProgressBarProviders>
                                    {children}
                                </ProgressBarProviders>
                            </main>

                            {/* 固定底部备案 */}
                            <Footer />
                        </ThemeProvider>
                    </ButtonStoreProvider>
                </ConfigStoreProvider>
            </NextIntlClientProvider>
        </SessionProviders>
        </body>
        </html>
    )
}