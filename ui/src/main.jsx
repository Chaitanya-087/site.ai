/* eslint-disable react-refresh/only-export-components */
import { createRoot } from 'react-dom/client'
import React, { StrictMode, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ClerkProvider, ClerkLoaded, ClerkLoading } from '@clerk/clerk-react'

import './index.css'
import "allotment/dist/style.css"

const App = React.lazy(() => import('@/App.jsx'))
const Home = React.lazy(() => import('@/routes/home.jsx'))
const Login = React.lazy(() => import('@/routes/login.jsx'))
const Signup = React.lazy(() => import('@/routes/signup.jsx'))
const Playground = React.lazy(() => import('@/routes/playground.jsx'))

import { ThemeProvider } from './hooks/use-theme.jsx'
import { Loader } from '@/components/loader'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <ClerkLoading>
          <Loader variant='screen' />
        </ClerkLoading>
        <ClerkLoaded>
          <Suspense fallback={<Loader variant='screen' />}>
            <BrowserRouter>
              <Routes>
                <Route path='/' element={<App />}>
                  <Route index element={<Home />} />
                  <Route path=':id' element={<Playground />} />
                </Route>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Routes>
            </BrowserRouter>
          </Suspense>
        </ClerkLoaded>
      </ClerkProvider>
    </ThemeProvider>
  </StrictMode>
)