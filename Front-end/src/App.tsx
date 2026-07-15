import { useLocation, useRoutes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import BackButton from './components/BackButton'
import { routeConfig } from './config/routeConfig'
import { ROUTES } from './config/routes'

export default function App() {
  const routes = useRoutes(routeConfig)
  const { pathname } = useLocation()
  const showBack = pathname !== ROUTES.home

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">
        {showBack && (
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
            <BackButton />
          </div>
        )}
        {routes}
      </main>
      <Footer />
    </div>
  )
}
