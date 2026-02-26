import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import API, { getToken, clearAuth } from "../services/api";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  // ✅ Reactive token
  const [token, setTokenState] = useState(getToken() || "");
  const hasToken = !!token;

  // ✅ Re-sync token when auth changes (login/logout/401)
  useEffect(() => {
    const syncAuth = () => setTokenState(getToken() || "");
    window.addEventListener("auth-changed", syncAuth);
    return () => window.removeEventListener("auth-changed", syncAuth);
  }, []);

  const user = useMemo(() => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [token]);

  const fetchCart = async () => {
    try {
      const res = await API.get("/cart");
      const items = res.data?.items || [];
      const count = items.reduce((sum, it) => sum + Number(it.quantity || 1), 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  const normalizeWishlist = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.wishlist)) return data.wishlist;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.wishlist_items)) return data.wishlist_items;
  return [];
};

const fetchWishlist = async () => {
  try {
    const res = await API.get("/wishlist");

    console.log("WISHLIST RESPONSE:", res.data); // 👈 debug once

    const list = normalizeWishlist(res.data);
    setWishlistCount(list.length);
  } catch (err) {
    console.error("Wishlist fetch error:", err);
    setWishlistCount(0);
  }
};
  useEffect(() => {
    if (!hasToken) {
      setCartCount(0);
      setWishlistCount(0);
      return;
    }

    fetchCart();
    fetchWishlist();

    const onCartUpdated = () => fetchCart();
    const onWishlistUpdated = () => fetchWishlist();

    window.addEventListener("cart-updated", onCartUpdated);
    window.addEventListener("wishlist-updated", onWishlistUpdated);

    return () => {
      window.removeEventListener("cart-updated", onCartUpdated);
      window.removeEventListener("wishlist-updated", onWishlistUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken]);

  const handleLogout = () => {
    // ✅ clear token + user from both storages + dispatch auth-changed
    clearAuth();

    // ✅ also clear UI immediately
    setCartCount(0);
    setWishlistCount(0);
    setTokenState("");

    // ✅ hard redirect prevents “stuck on products” / back button issues
    window.location.replace("/login");
    // (You can use navigate("/login", { replace: true }) instead, but replace() is strongest)
  };

  const handleBack = () => navigate(-1);

  const goProductsWithFilters = () => {
    const q = search.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("cat", category);
    navigate(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const showBackBtn = location.pathname !== "/products";

  return (
    <div style={styles.page}>
      <div style={styles.navbar}>
        {/* LEFT */}
        <div style={styles.left}>
          {showBackBtn && (
            <button style={styles.backBtn} onClick={handleBack} title="Back" type="button">
              ←
            </button>
          )}
          <h2 style={styles.logo} onClick={() => navigate("/products")}>
            🌿 Desi Farms
          </h2>
        </div>

        {/* CENTER */}
        <div style={styles.center}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goProductsWithFilters()}
            placeholder="Search products..."
            style={styles.searchInput}
          />
          <button style={styles.searchBtn} onClick={goProductsWithFilters} type="button">
            Search
          </button>
        </div>

        {/* RIGHT */}
        <div style={styles.right}>
          <button style={styles.navBtn} onClick={() => navigate("/cart")} type="button">
            🛒 Cart <span style={styles.badge}>{cartCount}</span>
          </button>

          <button style={styles.navBtn} onClick={() => navigate("/orders")} type="button">
            📦 Orders
          </button>

          <button style={styles.navBtnGhost} onClick={() => navigate("/contact")} type="button">
            📞 Contact
          </button>

          {user && <div style={styles.userBox}>👤 {user.name}</div>}

          <button
            style={{
              ...styles.logoutBtn,
              opacity: hasToken ? 1 : 0.6,
              cursor: hasToken ? "pointer" : "not-allowed",
            }}
            onClick={handleLogout}
            type="button"
            disabled={!hasToken}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={styles.content}>{children}</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0b1220, #111a2e, #0f2b2a)",
    color: "#eaf2ff",
  },
  navbar: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr 1fr",
    alignItems: "center",
    gap: "18px",
    padding: "14px 22px",
    margin: "14px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.07)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  left: { display: "flex", alignItems: "center", gap: "14px" },
  center: { display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" },
  right: { display: "flex", alignItems: "center", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" },

  logo: { margin: 0, cursor: "pointer", fontWeight: 800, fontSize: "20px", color: "#eaf2ff" },
  backBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    background: "rgba(255,255,255,0.15)",
    color: "#eaf2ff",
    fontWeight: 900,
  },
  searchInput: {
    height: "38px",
    width: "260px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.25)",
    color: "#eaf2ff",
    padding: "0 12px",
    outline: "none",
  },
  searchBtn: {
    height: "38px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    padding: "0 14px",
    fontWeight: 700,
    color: "#071018",
    background: "linear-gradient(90deg, #7ee787, #5bbcff)",
  },
  navBtn: {
    height: "38px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.16)",
    cursor: "pointer",
    padding: "0 12px",
    fontWeight: 800,
    color: "#eaf2ff",
    background: "rgba(255,255,255,0.08)",
  },
  navBtnGhost: {
    height: "38px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.16)",
    cursor: "pointer",
    padding: "0 12px",
    fontWeight: 800,
    color: "#eaf2ff",
    background: "rgba(255,255,255,0.04)",
  },
  badge: {
    marginLeft: "8px",
    background: "rgba(126,231,135,0.25)",
    border: "1px solid rgba(126,231,135,0.35)",
    padding: "3px 8px",
    borderRadius: "999px",
    fontSize: "12px",
  },
  userBox: {
    fontWeight: 800,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "7px 12px",
    borderRadius: "999px",
  },
  logoutBtn: {
    height: "38px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    padding: "0 12px",
    fontWeight: 900,
    color: "white",
    background: "linear-gradient(90deg, #ff6b6b, #ff3d3d)",
  },
  content: { padding: "22px" },
};