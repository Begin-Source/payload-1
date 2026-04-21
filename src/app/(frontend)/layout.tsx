import React from 'react'
import './styles.css'

export const metadata = {
  description: '云系统',
  title: '基源科技',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="zh-CN">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
