import { useRoutes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import { routeConfig } from './config/routeConfig'

export default function App() {
  const routes = useRoutes(routeConfig)

  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">{routes}</main>
      <Footer />
    </div>
  )
}
