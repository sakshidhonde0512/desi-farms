import React, { useEffect, useState } from "react";
import API from "../services/api";

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Wishlist
  const fetchWishlist = async () => {
    try {
      const res = await API.get("/wishlist/"); // ✅ correct (trailing slash safe)

      if (Array.isArray(res.data)) {
        setItems(res.data);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Wishlist fetch error:", err);
      alert(err.response?.data?.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();

    // ✅ if wishlist updates from ProductCard etc.
    const handler = () => fetchWishlist();
    window.addEventListener("wishlist-updated", handler);
    return () => window.removeEventListener("wishlist-updated", handler);
  }, []);

  // Remove from wishlist
  const removeItem = async (wishlistId) => {
    try {
      // ✅ correct backend route: DELETE /api/wishlist/<wishlistId>
      await API.delete(`/wishlist/${wishlistId}`);

      // ✅ Optimistic update
      setItems((prev) => prev.filter((item) => item.wishlist_id !== wishlistId));

      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (err) {
      console.error("Remove error:", err);
      alert(err.response?.data?.message || "Failed to remove item");
    }
  };

  // Add to cart
  const addToCart = async (product_id) => {
    try {
      await API.post("/cart/add", { product_id, quantity: 1 });

      // ✅ update navbar cart count instantly
      window.dispatchEvent(new Event("cart-updated"));

      alert("Added to cart 🛒");
    } catch (err) {
      console.error("Add to cart error:", err);
      alert(err.response?.data?.error || "Failed to add to cart");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px", color: "#eaf2ff" }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "auto", color: "#eaf2ff" }}>
      <h2>❤️ My Wishlist</h2>

      {items.length === 0 ? (
        <p>Your wishlist is empty</p>
      ) : (
        <div style={{ display: "grid", gap: "20px", marginTop: "20px" }}>
          {items.map((item) => (
            <div
              key={item.wishlist_id} // ✅ correct key
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "20px",
                background: "rgba(255,255,255,0.06)",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.20)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                {item.image ? (
                  <img
                    src={`http://localhost:5000${item.image}`}
                    alt={item.name}
                    style={{
                      width: 70,
                      height: 70,
                      objectFit: "contain",
                      borderRadius: 12,
                      background: "rgba(0,0,0,0.25)",
                      padding: 10,
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  />
                ) : null}

                <div>
                  <h3 style={{ margin: 0 }}>{item.name}</h3>
                  <p style={{ margin: "6px 0", opacity: 0.9 }}>₹ {item.price}</p>
                  <p style={{ margin: 0, opacity: 0.85 }}>
                    {item.stock && item.stock > 0 ? "In Stock ✅" : "Out of Stock ❌"}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  onClick={() => addToCart(item.product_id)}
                  disabled={!item.stock || item.stock <= 0}
                  style={{
                    background: "linear-gradient(90deg,#7ee787,#5bbcff)",
                    color: "#071018",
                    padding: "10px 16px",
                    border: "none",
                    borderRadius: "12px",
                    cursor: !item.stock || item.stock <= 0 ? "not-allowed" : "pointer",
                    opacity: !item.stock || item.stock <= 0 ? 0.6 : 1,
                    fontWeight: 900,
                  }}
                >
                  Add to Cart
                </button>

                <button
                  onClick={() => removeItem(item.wishlist_id)} // ✅ correct id
                  style={{
                    background: "rgba(255,80,80,0.20)",
                    border: "1px solid rgba(255,80,80,0.25)",
                    color: "white",
                    padding: "10px 16px",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontWeight: 900,
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}