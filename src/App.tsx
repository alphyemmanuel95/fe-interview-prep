import { Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { QUESTIONS } from './questions'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage questions={QUESTIONS} />} />
        {QUESTIONS.map(({ id, path, Page }) => (
          <Route key={id} path={`${path}/*`} element={<Page />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
