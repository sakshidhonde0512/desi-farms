import { useState } from "react";
import API from "../services/api";

export default function ProductCard({ product, onAddToCart, onAddToWishlist }) {
  const [cartLoading, setCartLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const discount = Number(product.discount_percent || product.discount || 0);
  const stock = Number(product.stock ?? 0);
  const isOutOfStock = stock <= 0;

  const increaseQty = () => {
    if (stock && quantity >= stock) return;
    setQuantity((prev) => prev + 1);
  };

  const decreaseQty = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  // ✅ Add to Cart (backend expects POST /cart/add with JSON body)
  const addToCart = async () => {
    try {
      setCartLoading(true);

      if (onAddToCart) {
        // if parent provided callback
        await onAddToCart(product.id, quantity);
      } else {
        // direct API call
        await API.post("/cart/add", {
          product_id: product.id,
          quantity,
        });
      }

      // ✅ Update cart count instantly in Layout
      window.dispatchEvent(new Event("cart-updated"));

      alert("✅ Added to cart");
    } catch (err) {
      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "❌ Failed to add to cart"
      );
    } finally {
      setCartLoading(false);
    }
  };

  // ✅ Add to Wishlist (backend expects POST /wishlist/<product_id>)
  const addToWishlist = async () => {
    try {
      setWishlistLoading(true);

      if (onAddToWishlist) {
        await onAddToWishlist(product.id);
      } else {
        await API.post(`/wishlist/${product.id}`);
      }

      // ✅ notify wishlist pages/components
      window.dispatchEvent(new Event("wishlist-updated"));

      alert("❤️ Added to wishlist");
    } catch (err) {
      if (err.response?.status === 400) {
        alert("⚠ Already in wishlist");
      } else {
        alert(err.response?.data?.message || "❌ Failed to add to wishlist");
      }
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      {/* IMAGE */}
      <div style={styles.imageWrapper}>
        {discount > 0 && <div style={styles.discountBadge}>{discount}% OFF</div>}

        <button
          onClick={addToWishlist}
          disabled={wishlistLoading}
          style={{
            ...styles.wishlistBtn,
            opacity: wishlistLoading ? 0.6 : 1,
            cursor: wishlistLoading ? "not-allowed" : "pointer",
          }}
          title="Add to wishlist"
        >
          {wishlistLoading ? "…" : "❤️"}
        </button>

        {product.image ? (
          <img
            src={`http://localhost:5000${product.image}`}
            alt={product.name}
            style={styles.image}
          />
        ) : (
          <div style={styles.placeholder}>No Image</div>
        )}

        {isOutOfStock && <div style={styles.outOfStockBadge}>Out of Stock</div>}
      </div>

      {/* CONTENT */}
      <div style={styles.content}>
        <h3 style={styles.title}>{product.name}</h3>

        {/* PRICE */}
        <div style={styles.priceRow}>
          {discount > 0 && product.original_price ? (
            <>
              <span style={styles.price}>₹{Number(product.price).toFixed(2)}</span>
              <span style={styles.originalPrice}>
                ₹{Number(product.original_price).toFixed(2)}
              </span>
            </>
          ) : (
            <span style={styles.price}>₹{Number(product.price).toFixed(2)}</span>
          )}

          <span style={styles.unit}>{product.unit}</span>
        </div>

        {/* STOCK */}
        <div style={styles.stockRow}>
          {isOutOfStock ? (
            <span style={styles.stockBad}>Unavailable</span>
          ) : (
            <span style={styles.stockGood}>In stock: {stock}</span>
          )}
        </div>

        {/* QUANTITY */}
        {!isOutOfStock && (
          <div style={styles.qtyContainer}>
            <button
              onClick={decreaseQty}
              style={styles.qtyBtn}
              title="Decrease"
              disabled={quantity <= 1}
            >
              −
            </button>

            <span style={styles.qtyValue}>{quantity}</span>

            <button
              onClick={increaseQty}
              style={styles.qtyBtn}
              title="Increase"
              disabled={stock && quantity >= stock}
            >
              +
            </button>
          </div>
        )}

        {/* ADD TO CART */}
        <button
          onClick={addToCart}
          disabled={isOutOfStock || cartLoading}
          style={{
            ...styles.button,
            background: isOutOfStock
              ? "rgba(255,255,255,0.15)"
              : "linear-gradient(90deg, #7ee787, #5bbcff)",
            color: isOutOfStock ? "rgba(255,255,255,0.7)" : "#071018",
            cursor: isOutOfStock || cartLoading ? "not-allowed" : "pointer",
            opacity: cartLoading ? 0.85 : 1,
          }}
        >
          {cartLoading ? "Adding..." : isOutOfStock ? "Unavailable" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  card: {
    borderRadius: "18px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px)",
    transition: "0.25s ease",
  },

  imageWrapper: {
    position: "relative",
    width: "100%",
    height: "220px",
    background: "rgba(0,0,0,0.18)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    padding: "14px",
  },

  placeholder: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.65)",
    fontWeight: 700,
  },

  discountBadge: {
    position: "absolute",
    top: "12px",
    left: "12px",
    background: "rgba(126,231,135,0.18)",
    border: "1px solid rgba(126,231,135,0.35)",
    color: "#eaf2ff",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
    zIndex: 10,
  },

  wishlistBtn: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "50%",
    width: "38px",
    height: "38px",
    fontSize: "18px",
    boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
  },

  outOfStockBadge: {
    position: "absolute",
    bottom: "12px",
    left: "12px",
    background: "rgba(255, 77, 77, 0.25)",
    border: "1px solid rgba(255, 77, 77, 0.35)",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
  },

  content: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    color: "#eaf2ff",
  },

  title: {
    fontSize: "16px",
    fontWeight: 800,
    margin: 0,
  },

  priceRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  price: {
    fontSize: "18px",
    fontWeight: 900,
    color: "#eaf2ff",
  },

  originalPrice: {
    textDecoration: "line-through",
    color: "rgba(234,242,255,0.55)",
    fontSize: "13px",
    fontWeight: 700,
  },

  unit: {
    marginLeft: "auto",
    fontSize: "13px",
    color: "rgba(234,242,255,0.75)",
    fontWeight: 700,
  },

  stockRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "12px",
  },

  stockGood: {
    color: "rgba(126,231,135,0.95)",
    fontWeight: 800,
  },

  stockBad: {
    color: "rgba(255,160,160,0.95)",
    fontWeight: 800,
  },

  qtyContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginTop: "2px",
  },

  qtyBtn: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#eaf2ff",
    fontSize: "18px",
    fontWeight: 900,
    cursor: "pointer",
  },

  qtyValue: {
    fontSize: "15px",
    fontWeight: 900,
    color: "#eaf2ff",
    minWidth: "24px",
    textAlign: "center",
  },

  button: {
    padding: "11px",
    border: "none",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: 900,
  },
};