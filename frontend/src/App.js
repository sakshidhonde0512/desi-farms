import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Layout from "./components/Layout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLayout from "./components/AdminLayout";
import Wishlist from "./pages/Wishlist";
import Contact from "./pages/Contact";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  // ✅ keep auth reactive (no refresh needed)
  useEffect(() => {
    const syncAuth = () => {
      setToken(localStorage.getItem("token") || "");
      try {
        setUser(JSON.parse(localStorage.getItem("user") || "null"));
      } catch {
        setUser(null);
      }
    };

    // when login/logout happens (we dispatch this event)
    window.addEventListener("auth-changed", syncAuth);

    // also sync if user changes localStorage from another tab
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener("auth-changed", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  const isAdmin = user?.role === "admin";
  const isLoggedIn = !!token;

  return (
    <Router>
      <Routes>
        {/* Default Route */}
        <Route
          path="/"
          element={<Navigate to={isLoggedIn ? "/products" : "/login"} replace />}
        />

        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isLoggedIn ? (
              <Navigate to={isAdmin ? "/admin" : "/products"} replace />
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/register"
          element={isLoggedIn ? <Navigate to="/products" replace /> : <Register />}
        />

        {/* User Protected Routes */}
        <Route
          path="/products"
          element={
            isLoggedIn ? (
              <Layout>
                <Products />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/cart"
          element={
            isLoggedIn ? (
              <Layout>
                <Cart />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/orders"
          element={
            isLoggedIn ? (
              <Layout>
                <Orders />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/wishlist"
          element={
            isLoggedIn ? (
              <Layout>
                <Wishlist />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/contact"
          element={
            isLoggedIn ? (
              <Layout>
                <Contact />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            isLoggedIn && isAdmin ? (
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? "/products" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;