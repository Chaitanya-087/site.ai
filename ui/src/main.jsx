import React from "react";
import { StrictMode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/hooks/use-theme";
import {
  ClerkProvider,
  ClerkLoading,
  ClerkLoaded,
  useUser,
} from "@clerk/clerk-react";
import App from "./App";
import Playground from "./routes/playground";
import Login from "./routes/login";
import Home from "./routes/home";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AppRoutes() {
  const { isSignedIn } = useUser();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isSignedIn ? (
              <App />
            ) : (
              <Navigate to="/login" replace /> // Redirect to login if not signed in
            )
          }
        >
          <Route index element={<Home />} />
          <Route path=":id" element={<Playground />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

function Root() {
  return (
    <StrictMode>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ClerkProvider
          publishableKey={PUBLISHABLE_KEY}
          afterSignOutUrl="/login"
        >
          <ClerkLoading>
            <div>Loading authentication...</div>
          </ClerkLoading>
          <ClerkLoaded>
            <AppRoutes />
          </ClerkLoaded>
        </ClerkProvider>
      </ThemeProvider>
    </StrictMode>
  );
}

export default Root;
