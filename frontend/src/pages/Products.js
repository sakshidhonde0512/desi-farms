import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import ProductCard from "../components/ProductCard";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // ✅ read query params from navbar search/category
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const q = (params.get("q") || "").trim().toLowerCase();
  const cat = (params.get("cat") || "").trim().toLowerCase();

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await API.get("/products");

      const productData = res.data?.products || (Array.isArray(res.data) ? res.data : []);
      setProducts(productData);
      setError("");
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filtered view (search + category)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const category = (p.category || "Dairy").toLowerCase();

      const matchesSearch = !q || name.includes(q);
      const matchesCategory = !cat || category === cat;

      return matchesSearch && matchesCategory;
    });
  }, [products, q, cat]);

  // ✅ Add to Wishlist (backend: POST /api/wishlist/<product_id>)
  const addToWishlist = async (productId) => {
    try {
      await API.post(`/wishlist/${productId}`);
      alert("Added to wishlist ❤️");
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (err) {
      console.error("Wishlist error:", err);
      alert(err.response?.data?.message || "Failed to add to wishlist");
    }
  };

  // ✅ Add to Cart (backend expects JSON body)
  const addToCart = async (productId, quantity = 1) => {
    try {
      await API.post("/cart/add", {
        product_id: productId,
        quantity,
      });

      alert("Added to cart 🛒");

      // ✅ Tell Layout to refresh cart count immediately
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error("Cart error:", err);
      alert(err.response?.data?.error || err.response?.data?.message || "Failed to add to cart");
    }
  };

  const clearFilters = () => {
    navigate("/products");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.headerRow}>
          <div>
            <h2 style={styles.heading}>🛍 Our Fresh Products</h2>
            {(q || cat) && (
              <p style={styles.subtext}>
                Showing results for{" "}
                <b>{q ? `"${q}"` : "All"}</b>
                {cat ? ` in category "${cat}"` : ""}
              </p>
            )}
          </div>

          <div style={styles.headerActions}>
            {(q || cat) && (
              <button style={styles.secondaryBtn} onClick={clearFilters}>
                ✖ Clear Filters
              </button>
            )}

            <button style={styles.primaryBtn} onClick={() => navigate("/wishlist")}>
              ❤️ View Wishlist
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={styles.centerBox}>
            <div style={styles.loader}></div>
            <p style={{ opacity: 0.9 }}>Loading products...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={styles.emptyBox}>
            <h3>{error}</h3>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div style={styles.emptyBox}>
            <h3>No products found</h3>
            <p>Try searching different keywords or category.</p>
            {(q || cat) && (
              <button style={styles.secondaryBtn} onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div style={styles.grid}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToWishlist={addToWishlist}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    paddingTop: "10px",
    paddingBottom: "40px",
  },

  container: {
    maxWidth: "1200px",
    margin: "auto",
    padding: "10px 18px 30px",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "22px",
    flexWrap: "wrap",
    gap: "14px",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.20)",
    backdropFilter: "blur(10px)",
  },

  heading: {
    fontSize: "28px",
    fontWeight: 800,
    margin: 0,
    color: "#eaf2ff",
  },

  subtext: {
    marginTop: "6px",
    marginBottom: 0,
    color: "rgba(234,242,255,0.78)",
    fontSize: "13px",
  },

  headerActions: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  primaryBtn: {
    height: "40px",
    padding: "0 16px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: 800,
    color: "#071018",
    background: "linear-gradient(90deg, #ff7aa2, #ffd36b)",
  },

  secondaryBtn: {
    height: "40px",
    padding: "0 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.18)",
    cursor: "pointer",
    fontWeight: 700,
    color: "#eaf2ff",
    background: "rgba(255,255,255,0.06)",
  },

  centerBox: {
    textAlign: "center",
    marginTop: "60px",
    color: "#eaf2ff",
  },

  loader: {
    width: "42px",
    height: "42px",
    border: "4px solid rgba(255,255,255,0.22)",
    borderTop: "4px solid rgba(126,231,135,0.9)",
    borderRadius: "50%",
    margin: "0 auto 15px",
    animation: "spin 1s linear infinite",
  },

  emptyBox: {
    textAlign: "center",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    padding: "42px 22px",
    borderRadius: "18px",
    color: "#eaf2ff",
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "22px",
  },
};