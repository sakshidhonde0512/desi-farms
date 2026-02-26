import React, { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import upiQr from "../assets/upi_qr.png";

export default function Cart() {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  const [placing, setPlacing] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [couponError, setCouponError] = useState("");

  const [billing, setBilling] = useState({
    billing_name: "",
    billing_phone: "",
    billing_address: "",
    billing_city: "",
    billing_pincode: "",
    payment_method: "COD",
  });

  const [billingErrors, setBillingErrors] = useState({});
  const [qtyLoadingId, setQtyLoadingId] = useState(null);

  // Online flow: cart -> upi -> scanner
  const [checkoutStep, setCheckoutStep] = useState("cart");

  // ✅ Wishlist
  const [wishlistItems, setWishlistItems] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [wishBusyId, setWishBusyId] = useState(null);

  /* ================= DERIVED ================= */
  const itemCount = useMemo(
    () => cart.items.reduce((s, i) => s + Number(i.quantity || 1), 0),
    [cart.items]
  );

  const payableAmount = useMemo(() => {
    return discount ? Number(finalTotal || 0) : Number(cart.total || 0);
  }, [discount, finalTotal, cart.total]);

  const wishlistCount = useMemo(() => wishlistItems.length, [wishlistItems]);

  /* ================= FETCH CART ================= */
  const fetchCart = async () => {
    try {
      const res = await API.get("/cart");
      const data = res.data || { items: [], total: 0 };
      setCart(data);
      if (!coupon || discount === 0) setFinalTotal(data.total);
    } catch (err) {
      console.error("Cart fetch error:", err);
      setCart({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH WISHLIST (WORKING ENDPOINT) ================= */
  const fetchWishlist = async () => {
    try {
      setWishlistLoading(true);
      const res = await API.get("/wishlist/"); // ✅ same as Wishlist page
      setWishlistItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Wishlist fetch error:", err);
      setWishlistItems([]);
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
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
  }, []);

  /* ================= REMOVE ITEM FROM CART ================= */
  const removeItem = async (id) => {
    try {
      await API.delete(`/cart/remove/${id}`);
      await fetchCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error("Remove error:", err);
      alert("Failed to remove item");
    }
  };

  /* ================= UPDATE QTY ================= */
  const updateQty = async (itemId, newQty) => {
    if (newQty < 1) return;

    try {
      setQtyLoadingId(itemId);
      await API.put(`/cart/item/${itemId}`, { quantity: newQty });

      setCart((prev) => {
        const items = prev.items.map((it) => {
          if (it.id !== itemId) return it;
          return { ...it, quantity: newQty, subtotal: Number(it.price) * newQty };
        });

        const total = items.reduce((sum, it) => sum + Number(it.subtotal || 0), 0);

        setDiscount(0);
        setCoupon("");
        setCouponError("");
        setFinalTotal(total);

        return { items, total };
      });

      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error("Qty update error:", err);
      alert(err.response?.data?.error || "Failed to update quantity");
      fetchCart();
    } finally {
      setQtyLoadingId(null);
    }
  };

  /* ================= BILLING ================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setBilling((prev) => ({ ...prev, [name]: value }));
    setBillingErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "payment_method") {
      if (value === "Online") setCheckoutStep("upi");
      if (value === "COD") setCheckoutStep("cart");
    }
  };

  const validateBilling = () => {
    const errors = {};

    Object.keys(billing).forEach((key) => {
      if (!billing[key] || billing[key].trim() === "") {
        errors[key] = "This field is required";
      }
    });

    if (billing.billing_phone && !/^\d{10}$/.test(billing.billing_phone)) {
      errors.billing_phone = "Enter valid 10 digit phone number";
    }
    if (billing.billing_pincode && !/^\d{6}$/.test(billing.billing_pincode)) {
      errors.billing_pincode = "Enter valid 6 digit pincode";
    }

    setBillingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ================= APPLY COUPON ================= */
  const applyCoupon = async () => {
    try {
      setCouponError("");
      const res = await API.post("/apply-offer", {
        code: coupon,
        cart_total: cart.total,
      });

      setDiscount(res.data.discount || 0);
      setFinalTotal(res.data.final_amount || cart.total);
    } catch (err) {
      setCouponError(err.response?.data?.error || "Invalid coupon");
      setDiscount(0);
      setFinalTotal(cart.total);
    }
  };

  /* ================= PLACE ORDER ================= */
  const placeOrder = async () => {
    if (!validateBilling()) return;
    if (cart.items.length === 0) return alert("Your cart is empty");

    try {
      setPlacing(true);

      const res = await API.post("/orders/place", {
        ...billing,
        total_amount: payableAmount,
        discount_applied: discount,
        coupon_code: coupon || null,
      });

      setOrderId(res.data.order_id);
      alert("🎉 Order placed successfully!");

      setCoupon("");
      setDiscount(0);
      setCouponError("");
      setCheckoutStep(billing.payment_method === "Online" ? "upi" : "cart");

      await fetchCart();
      window.dispatchEvent(new Event("cart-updated"));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "❌ Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  const downloadInvoice = async () => {
    try {
      const res = await API.get(`/orders/${orderId}/invoice`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `DesiFarms_Invoice_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to download invoice");
    }
  };

  /* ================= WISHLIST ACTIONS (SAME AS WORKING PAGE) ================= */
  const addWishlistToCart = async (product_id) => {
    try {
      setWishBusyId(product_id);
      await API.post("/cart/add", { product_id, quantity: 1 }); // ✅ same as Wishlist page
      window.dispatchEvent(new Event("cart-updated"));
      await fetchCart();
      alert("Added to cart 🛒");
    } catch (err) {
      console.error("Add to cart error:", err);
      alert(err.response?.data?.error || "Failed to add to cart");
    } finally {
      setWishBusyId(null);
    }
  };

  const removeWishlistItem = async (wishlist_id) => {
    try {
      setWishBusyId(wishlist_id);
      await API.delete(`/wishlist/${wishlist_id}`); // ✅ same as Wishlist page
      setWishlistItems((prev) => prev.filter((x) => x.wishlist_id !== wishlist_id));
      window.dispatchEvent(new Event("wishlist-updated"));
    } catch (err) {
      console.error("Remove wishlist error:", err);
      alert(err.response?.data?.message || "Failed to remove item");
    } finally {
      setWishBusyId(null);
    }
  };

  if (loading) return <div style={styles.center}>Loading your cart...</div>;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <h2 style={styles.heading}>🛒 Shopping Cart</h2>
          <div style={styles.totalChip}>Items: {itemCount}</div>
        </div>

        {orderId && (
          <div style={styles.successBox}>
            <h3 style={{ margin: 0 }}>🎉 Order Placed Successfully!</h3>
            <p style={{ marginTop: 8, opacity: 0.85 }}>
              Order ID: <b>#{orderId}</b>
            </p>
            <button style={styles.downloadBtn} onClick={downloadInvoice}>
              🧾 Download Bill (PDF)
            </button>
          </div>
        )}

        {cart.items.length === 0 ? (
          <div style={styles.emptyBox}>
            <h3>Your cart is empty</h3>
            <p style={{ opacity: 0.8 }}>Add products to continue shopping.</p>
          </div>
        ) : (
          <>
            {/* CART ITEMS */}
            <div style={styles.itemsGrid}>
              {cart.items.map((item) => (
                <div key={item.id} style={styles.card}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <h3 style={{ margin: 0 }}>{item.name}</h3>
                    <div style={{ opacity: 0.85 }}>
                      ₹ {item.price} • Subtotal: <b>₹ {item.subtotal}</b>
                    </div>

                    <div style={styles.qtyRow}>
                      <button
                        style={styles.qtyBtn}
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        disabled={qtyLoadingId === item.id || item.quantity <= 1}
                      >
                        −
                      </button>
                      <div style={styles.qtyValue}>{item.quantity}</div>
                      <button
                        style={styles.qtyBtn}
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        disabled={qtyLoadingId === item.id}
                      >
                        +
                      </button>

                      {qtyLoadingId === item.id && (
                        <span style={{ fontSize: 12, opacity: 0.8 }}>Updating…</span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <button onClick={() => removeItem(item.id)} style={styles.removeBtn}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ WISHLIST SECTION */}
            <div style={styles.wishlistBox}>
              <div style={styles.wishlistHeader}>
                <h3 style={{ margin: 0 }}>❤️ Wishlist</h3>
                <div style={styles.totalChip}>
                  {wishlistLoading ? "Loading..." : `Items: ${wishlistCount}`}
                </div>
              </div>

              {wishlistLoading ? (
                <div style={{ opacity: 0.85 }}>Loading wishlist…</div>
              ) : wishlistItems.length === 0 ? (
                <div style={{ opacity: 0.8 }}>
                  No wishlist items found. Add items from Products page.
                </div>
              ) : (
                <div style={styles.wishlistGrid}>
                  {wishlistItems.map((item) => (
                    <div key={item.wishlist_id} style={styles.wishlistCard}>
                      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                        {item.image ? (
                          <img
                            src={`http://localhost:5000${item.image}`}
                            alt={item.name}
                            style={styles.wishImg}
                          />
                        ) : null}

                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 900, fontSize: 16 }}>{item.name}</div>
                          <div style={{ marginTop: 6, opacity: 0.9 }}>₹ {item.price}</div>
                          <div style={{ marginTop: 4, opacity: 0.85, fontSize: 12 }}>
                            {item.stock && item.stock > 0 ? "In Stock ✅" : "Out of Stock ❌"}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <button
                            onClick={() => addWishlistToCart(item.product_id)}
                            disabled={!item.stock || item.stock <= 0 || wishBusyId === item.product_id}
                            style={{
                              ...styles.wishlistAddBtn,
                              opacity:
                                !item.stock || item.stock <= 0 || wishBusyId === item.product_id
                                  ? 0.6
                                  : 1,
                              cursor:
                                !item.stock || item.stock <= 0
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                          >
                            {wishBusyId === item.product_id ? "Adding..." : "Add to Cart"}
                          </button>

                          <button
                            onClick={() => removeWishlistItem(item.wishlist_id)}
                            disabled={wishBusyId === item.wishlist_id}
                            style={styles.wishlistRemoveBtn}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COUPON */}
            

            {/* BILLING + PAYMENT METHOD */}
            <div style={styles.billingBox}>
              <h3 style={{ marginTop: 0 }}>🧾 Billing Details</h3>

              <div style={styles.inputGrid}>
                <Field
                  name="billing_name"
                  label="Full Name"
                  value={billing.billing_name}
                  onChange={handleChange}
                  error={billingErrors.billing_name}
                />
                <Field
                  name="billing_phone"
                  label="Phone"
                  value={billing.billing_phone}
                  onChange={handleChange}
                  error={billingErrors.billing_phone}
                />
                <Field
                  name="billing_city"
                  label="City"
                  value={billing.billing_city}
                  onChange={handleChange}
                  error={billingErrors.billing_city}
                />
                <Field
                  name="billing_pincode"
                  label="Pincode"
                  value={billing.billing_pincode}
                  onChange={handleChange}
                  error={billingErrors.billing_pincode}
                />
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={styles.label}>Address</label>
                <textarea
                  name="billing_address"
                  value={billing.billing_address}
                  onChange={handleChange}
                  placeholder="House, street, area..."
                  style={{
                    ...styles.input,
                    height: 90,
                    border: billingErrors.billing_address
                      ? "1px solid rgba(255,80,80,0.9)"
                      : styles.input.border,
                    maxWidth: "100%",
                  }}
                />
                {billingErrors.billing_address && (
                  <p style={styles.errorText}>{billingErrors.billing_address}</p>
                )}
              </div>

              <div style={{ marginTop: 14 }}>
                <label style={styles.label}>Payment Method</label>
                <select
                  name="payment_method"
                  value={billing.payment_method}
                  onChange={handleChange}
                  style={{ ...styles.input, maxWidth: 360 }}
                >
                  <option value="COD">Cash On Delivery (COD)</option>
                  <option value="Online">UPI / Online Payment</option>
                </select>
              </div>
            </div>

            {/* ✅ UPI STEP SCREEN */}
            {billing.payment_method === "Online" && checkoutStep === "upi" && (
              <div style={styles.upiBox}>
                <h3 style={{ marginTop: 0 }}>💳 UPI Payment</h3>
                <p style={{ marginTop: 6, opacity: 0.85 }}>
                  Total payable: <b>₹ {payableAmount}</b>
                </p>

                <button style={styles.payBtn} onClick={() => setCheckoutStep("scanner")}>
                  📷 Pay using scanner
                </button>

                <button style={styles.backPayBtn} onClick={() => setCheckoutStep("cart")}>
                  ← Back to cart
                </button>
              </div>
            )}

            {/* ✅ QR SCANNER SCREEN */}
            {billing.payment_method === "Online" && checkoutStep === "scanner" && (
              <div style={styles.scannerBox}>
                <h3 style={{ marginTop: 0 }}>📷 Scan & Pay</h3>
                <p style={{ marginTop: 6, opacity: 0.85 }}>
                  Scan this QR using any UPI app (GPay / PhonePe / Paytm).
                </p>

                <div style={styles.qrWrap}>
                  <img src={upiQr} alt="UPI QR" style={styles.qrImg} />
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                  <button
                    style={styles.confirmPayBtn}
                    onClick={placeOrder}
                    disabled={placing}
                    title="This will place order after payment"
                  >
                    {placing ? "Processing..." : "✅ I Paid, Place Order"}
                  </button>

                  <button style={styles.backPayBtn} onClick={() => setCheckoutStep("upi")}>
                    ← Back
                  </button>
                </div>

                <p style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
                  Note: This is demo flow. For real verification, integrate payment gateway/webhook.
                </p>
              </div>
            )}

            {/* SUMMARY + COD DIRECT PLACE ORDER */}
            <div style={styles.summaryBox}>
              <div>
                <p style={{ margin: 0, opacity: 0.85 }}>
                  Subtotal: ₹ {Number(cart.total).toFixed(2)}
                </p>
                {discount > 0 && (
                  <p style={{ margin: "6px 0", color: "rgba(126,231,135,0.95)" }}>
                    Discount: − ₹ {Number(discount).toFixed(2)}
                  </p>
                )}
                <h2 style={{ margin: "6px 0" }}>
                  Final Total: ₹ {Number(payableAmount).toFixed(2)}
                </h2>

                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  Payment:{" "}
                  <b>{billing.payment_method === "COD" ? "Cash on Delivery" : "UPI / Online"}</b>
                </div>
              </div>

              {billing.payment_method === "COD" && (
                <button style={styles.orderBtn} onClick={placeOrder} disabled={placing}>
                  {placing ? "Processing..." : "🚀 Place Order (COD)"}
                </button>
              )}

              {billing.payment_method === "Online" && (
                <div style={{ maxWidth: 280, fontSize: 12, opacity: 0.8 }}>
                  Complete payment using UPI. Then click <b>“I Paid, Place Order”</b>.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* Small field helper */
function Field({ label, name, value, onChange, error }) {
  return (
    <div>
      <label style={styles.label}>{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={label}
        style={{
          ...styles.input,
          border: error
            ? "1px solid rgba(255,80,80,0.9)"
            : "1px solid rgba(255,255,255,0.12)",
        }}
      />
      {error && <p style={styles.errorText}>{error}</p>}
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  page: { minHeight: "100vh", padding: "30px 14px 60px" },
  container: { maxWidth: "1050px", margin: "auto", color: "#eaf2ff" },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 18,
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.20)",
    backdropFilter: "blur(10px)",
  },
  heading: { margin: 0, fontSize: 28, fontWeight: 900 },
  totalChip: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    fontWeight: 800,
  },
  center: { textAlign: "center", marginTop: "80px", color: "#eaf2ff" },
  successBox: {
    background: "rgba(126,231,135,0.12)",
    border: "1px solid rgba(126,231,135,0.25)",
    padding: "18px",
    borderRadius: "16px",
    marginBottom: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
  },
  downloadBtn: {
    marginTop: 10,
    background: "linear-gradient(90deg,#5bbcff,#ffd36b)",
    color: "#071018",
    padding: "10px 16px",
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
  },
  emptyBox: {
    textAlign: "center",
    padding: "50px 20px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px)",
  },
  itemsGrid: { display: "flex", flexDirection: "column", gap: "14px" },
  card: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    padding: "18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "16px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.20)",
    backdropFilter: "blur(10px)",
  },
  removeBtn: {
    background: "rgba(255,80,80,0.20)",
    border: "1px solid rgba(255,80,80,0.25)",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 900,
  },
  qtyRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 4 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.08)",
    color: "#eaf2ff",
    fontSize: 18,
    fontWeight: 900,
    cursor: "pointer",
  },
  qtyValue: {
    minWidth: 34,
    textAlign: "center",
    padding: "6px 10px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.10)",
    fontWeight: 900,
  },

  couponBox: {
    marginTop: "18px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  applyBtn: {
    background: "linear-gradient(90deg,#7ee787,#5bbcff)",
    color: "#071018",
    padding: "12px 16px",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 900,
  },
  couponError: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,80,80,0.25)",
    background: "rgba(255,80,80,0.14)",
    fontWeight: 900,
    fontSize: 12,
  },

  // ✅ Wishlist styles
  wishlistBox: {
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px)",
  },
  wishlistHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  wishlistGrid: {
    display: "grid",
    gap: 12,
  },
  wishlistCard: {
    padding: 16,
    borderRadius: 16,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  wishImg: {
    width: 70,
    height: 70,
    objectFit: "contain",
    borderRadius: 12,
    background: "rgba(0,0,0,0.25)",
    padding: 10,
    border: "1px solid rgba(255,255,255,0.08)",
  },
  wishlistAddBtn: {
    background: "linear-gradient(90deg,#7ee787,#5bbcff)",
    color: "#071018",
    padding: "10px 16px",
    border: "none",
    borderRadius: "12px",
    fontWeight: 900,
  },
  wishlistRemoveBtn: {
    background: "rgba(255,80,80,0.20)",
    border: "1px solid rgba(255,80,80,0.25)",
    color: "white",
    padding: "10px 16px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 900,
  },

  inputGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "14px",
    marginTop: "10px",
  },
  label: {
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.85,
    display: "block",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.20)",
    color: "#eaf2ff",
    outline: "none",
    maxWidth: 360,
  },
  errorText: {
    color: "rgba(255,140,140,0.95)",
    fontSize: "12px",
    marginTop: "6px",
    fontWeight: 800,
  },
  billingBox: {
    marginTop: "20px",
    padding: "18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "18px",
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px)",
  },
  summaryBox: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px)",
  },
  orderBtn: {
    background: "linear-gradient(90deg,#ff7aa2,#ffd36b)",
    color: "#071018",
    padding: "14px 26px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    minWidth: 220,
  },

  upiBox: {
    marginTop: "18px",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(91,188,255,0.10)",
    border: "1px solid rgba(91,188,255,0.22)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    backdropFilter: "blur(10px)",
  },
  payBtn: {
    marginTop: 10,
    width: "100%",
    maxWidth: 360,
    padding: "14px 18px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    color: "#071018",
    background: "linear-gradient(90deg,#7ee787,#5bbcff)",
  },
  confirmPayBtn: {
    padding: "14px 18px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    fontWeight: 900,
    color: "#071018",
    background: "linear-gradient(90deg,#7ee787,#ffd36b)",
    minWidth: 220,
  },
  backPayBtn: {
    padding: "14px 18px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.16)",
    cursor: "pointer",
    fontWeight: 900,
    color: "#eaf2ff",
    background: "rgba(255,255,255,0.06)",
  },
  scannerBox: {
    marginTop: "18px",
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,211,107,0.08)",
    border: "1px solid rgba(255,211,107,0.20)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.18)",
    backdropFilter: "blur(10px)",
  },
  qrWrap: {
    marginTop: 12,
    width: "100%",
    maxWidth: 360,
    padding: 14,
    borderRadius: 18,
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  qrImg: { width: "100%", height: "auto", borderRadius: 14, display: "block" },
};