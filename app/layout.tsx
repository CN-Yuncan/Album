import type { Metadata, ResolvingMetadata } from 'next'

import { ThemeProvider } from '~/app/providers/next-ui-providers'
import { ToasterProviders } from '~/app/providers/toaster-providers'
import { SessionProviders } from '~/app/providers/session-providers'
import { ProgressBarProviders } from '~/app/providers/progress-bar-providers'
import { ButtonStoreProvider } from '~/app/providers/button-store-providers'

import '~/style/globals.css'
import { fetchConfigsByKeys } from '~/server/db/query/configs'

import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { ConfigStoreProvider } from '~/app/providers/config-store-providers'

import { MagicCursor, Footer, ClickEffects } from '~/components/SiteEssentials';

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
    icons: { icon: data?.find((item: any) => item.config_key === 'custom_favicon_url')?.config_value || './favicon.ico' },
  }
}

export default async function RootLayout({
                                           children,
                                         }: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
      <html
          className="overflow-y-auto scrollbar-hide"
          lang={locale}
          suppressHydrationWarning
          style={{ cursor: 'none' }} // 隐藏原生光标
      >
      <body className="min-h-screen">
      <SessionProviders>
        <NextIntlClientProvider messages={messages}>
          <ConfigStoreProvider>
            <ButtonStoreProvider>
              <ThemeProvider>
                {/* 光标组件需要放在最顶层 */}
                <MagicCursor />
                <ClickEffects />

                {/* 主体内容保留底部空间 */}
                <main className="pb-20">
                  <ToasterProviders/>
                  <ProgressBarProviders>
                    {children}
                  </ProgressBarProviders>
                </main>

                {/* 固定底部备案信息 */}
                <Footer />
              </ThemeProvider>
            </ButtonStoreProvider>
          </ConfigStoreProvider>
        </NextIntlClientProvider>
      </SessionProviders>
      </body>
      </html>
  );
}