import { Outlet } from 'react-router-dom'
import { Navigation } from './Navigation'

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Navigation />
      <main className="flex-1 pb-20 md:pb-0 overflow-auto">
        <div className="max-w-2xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
