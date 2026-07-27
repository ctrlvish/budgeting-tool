import AppHeader from './components/app-header'
import { Route, Routes } from 'react-router'
import Home from './pages/home'
import Transactions from './pages/transactions'
import Settings from './pages/settings'

function App() {
  return (
  <div>
    <AppHeader/>

    <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
    </main>
  </div>
  )
}

export default App
