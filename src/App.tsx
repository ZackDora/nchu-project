import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const baseUrl = import.meta.env.BASE_URL

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <section id="center">
              <div className="hero">
                <img src={heroImg} className="base" width="170" height="179" alt="" />
                <img src={reactLogo} className="framework" alt="React logo" />
                <img src={viteLogo} className="vite" alt="Vite logo" />
              </div>

              <div>
                <h1>Get started</h1>
                <p>
                  Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
                </p>
              </div>

              <button
                className="counter"
                onClick={() => setCount((count) => count + 1)}
              >
                Count is {count}
              </button>
            </section>

            <div className="ticks"></div>

            <section id="next-steps">
              <div id="docs">
                <svg className="icon" role="presentation" aria-hidden="true">
                  <use href={`${baseUrl}icons.svg#documentation-icon`} />
                </svg>

                <h2>Documentation</h2>
                <p>Your questions, answered</p>

                <ul>
                  <li>
                    <a href="https://vite.dev" target="_blank" rel="noreferrer">
                      <img className="logo" src={viteLogo} alt="" />
                      Explore Vite
                    </a>
                  </li>
                  <li>
                    <a href="https://react.dev" target="_blank" rel="noreferrer">
                      <img className="button-icon" src={reactLogo} alt="" />
                      Learn more
                    </a>
                  </li>
                </ul>
              </div>

              <div id="social">
                <svg className="icon" role="presentation" aria-hidden="true">
                  <use href={`${baseUrl}icons.svg#social-icon`} />
                </svg>

                <h2>Connect with us</h2>
                <p>Join the Vite community</p>

                <ul>
                  <li>
                    <a href="https://github.com" target="_blank" rel="noreferrer">
                      <svg className="button-icon" role="presentation" aria-hidden="true">
                        <use href={`${baseUrl}icons.svg#github-icon`} />
                      </svg>
                      GitHub
                    </a>
                  </li>

                  <li>
                    <a href="https://vite.dev" target="_blank" rel="noreferrer">
                      <svg className="button-icon" role="presentation" aria-hidden="true">
                        <use href={`${baseUrl}icons.svg#discord-icon`} />
                      </svg>
                      Discord
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            <div className="ticks"></div>
            <section id="spacer"></section>
          </>
        }
      />
    </Routes>
  )
}

export default App