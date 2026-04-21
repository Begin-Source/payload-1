import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  return (
    <div className="home">
      <div className="content">
        {!user ? (
          <>
            <h1>基源科技</h1>
            <p className="heroSubtitle">云系统</p>
          </>
        ) : (
          <>
            <h1>欢迎回到基源科技</h1>
            <p className="heroSubtitle">安全登录后即可管理后台与业务数据</p>
          </>
        )}
        <div className="links">
          <a
            className="admin"
            href={payloadConfig.routes.admin}
            rel="noopener noreferrer"
            target="_blank"
          >
            前往管理后台
          </a>
        </div>
      </div>
      <div className="footer">
        <p className="footerCopyright">© 基源科技 · 内部系统请勿外传</p>
      </div>
    </div>
  )
}
