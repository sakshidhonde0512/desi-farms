import { useEffect, useState } from "react";
import API from "../services/api";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.log(err))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = async (productId) => {
    try {
      await API.post("/cart/add", {
        product_id: productId,
        quantity: 1,
      });
      alert("✅ Added to cart");
    } catch (err) {
      alert("❌ Login required");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>🌿 Fresh Farm Products</h2>

        {loading && <p style={styles.centerText}>Loading products...</p>}

        {!loading && products.length === 0 && (
          <div style={styles.emptyBox}>
            <h3>No products available</h3>
            <p>Please check back later.</p>
          </div>
        )}

        <div style={styles.grid}>
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={addToCart} />
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#f4f6f8",
    minHeight: "100vh",
    paddingTop: "40px",
    paddingBottom: "60px",
  },
  container: {
    maxWidth: "1200px",
    margin: "auto",
    padding: "20px",
  },
  heading: {
    textAlign: "center",
    marginBottom: "40px",
    fontSize: "30px",
    fontWeight: "600",
  },
  centerText: {
    textAlign: "center",
    marginTop: "20px",
  },
  emptyBox: {
    textAlign: "center",
    backgroundColor: "#fff",
    padding: "40px",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "25px",
  },
};
