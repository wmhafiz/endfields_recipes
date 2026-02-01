import React from 'react'
import Link from 'next/link'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import './styles.css'

export const metadata = {
  description: 'Endfields Recipes - Item and production chain viewer',
  title: 'Endfields Recipes',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <nav className="main-nav">
          <div className="nav-content">
            <Link href="/" className="nav-logo">
              Endfields Recipes
            </Link>
            <div className="nav-links">
              <Link href="/" className="nav-link">
                Recipes
              </Link>
              <Link href="/planner" className="nav-link">
                Planner
              </Link>
            </div>
          </div>
        </nav>
        <NuqsAdapter>
          <main>{children}</main>
        </NuqsAdapter>
      </body>
    </html>
  )
}
