import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      {/* Tailwind CSS Test Section */}
      <div className="mt-8 p-6 bg-blue-100 dark:bg-blue-900 rounded-lg">
        <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-4">
          Tailwind CSS 测试
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-500 text-white p-4 rounded text-center">红色</div>
          <div className="bg-green-500 text-white p-4 rounded text-center">绿色</div>
          <div className="bg-blue-500 text-white p-4 rounded text-center">蓝色</div>
        </div>
        <button className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
          测试按钮
        </button>
      </div>
    </>
  )
}

export default App
