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
import { MagicCursor, Footer, DynamicBackground } from '~/components/SiteEssentials'

// 数据获取
import { fetchConfigsByKeys } from '~/server/db/query/configs'

// 样式
import { moqugufeng } from '~/app/font'
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
        title: data?.find((item: any) => item.config_key === 'custom_title')?.config_value || 'Yuncan 之江影集',
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
            className={`overflow-y-auto scrollbar-hide ${moqugufeng.variable} font-moqugufeng`}
            suppressHydrationWarning
            style={{cursor: 'none'}}
        >
        <head>
            <link
                rel="preload"
                href="/public/fonts/MoquGufeng.woff2"
                as="font"
                type="font/woff2"
                crossOrigin="anonymous"
                key="moqungufeng-preload"
            />
        </head>
        <body className="min-h-screen bg-background antialiased">
        <SessionProviders>
            <NextIntlClientProvider messages={messages}>
                <ConfigStoreProvider>
                    <ButtonStoreProvider>
                        <ThemeProvider>
                            <DynamicBackground/>
                            <MagicCursor/>
                            <ToasterProviders/>
                            <ProgressBarProviders>
                                {children}
                            </ProgressBarProviders>
                            <Footer/>
                        </ThemeProvider>
                    </ButtonStoreProvider>
                </ConfigStoreProvider>
            </NextIntlClientProvider>
        </SessionProviders>
        </body>
        </html>
    )
}