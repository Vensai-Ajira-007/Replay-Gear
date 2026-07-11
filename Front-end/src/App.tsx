import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import DashboardPage from './pages/DashboardPage'
import CategoryPage from './pages/CategoryPage'
import CartPage from './pages/CartPage'

export default function App() {
  // Search lives in the layout because the search box is in the navbar,
  // while the results render on the catalog page.
  const [search, setSearch] = useState('')

  return (
    <div className="flex min-h-full flex-col">
      <Navbar search={search} onSearchChange={setSearch} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/games" element={<CategoryPage type="game" search={search} />} />
          <Route
            path="/consoles"
            element={<CategoryPage type="console" search={search} />}
          />
          <Route path="/cart" element={<CartPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
