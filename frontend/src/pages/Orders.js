import React, { useEffect, useMemo, useState } from "react";
import API from "../services/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);

  const steps = useMemo(() => ["Pending", "Confirmed", "Shipped", "Delivered"], []);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setRefreshing(true);
      const res = await API.get("/orders");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Orders fetch error:", err);
      alert("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders(true);
    // ✅ no polling (better performance)
  }, []);

  const getStepIndex = (status) => {
    const idx = steps.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "rgba(255,211,107,0.18)";
      case "Confirmed":
        return "rgba(91,188,255,0.18)";
      case "Shipped":
        return "rgba(173,93,255,0.18)";
      case "Delivered":
        return "rgba(126,231,135,0.18)";
      case "Cancelled":
        return "rgba(255,80,80,0.20)";
      default:
        return "rgba(255,255,255,0.10)";
    }
  };

  const getStatusBorder = (status) => {
    switch (status) {
      case "Pending":
        return "rgba(255,211,107,0.35)";
      case "Confirmed":
        return "rgba(91,188,255,0.35)";
      case "Shipped":
        return "rgba(173,93,255,0.35)";
      case "Delivered":
        return "rgba(126,231,135,0.35)";
      case "Cancelled":
        return "rgba(255,80,80,0.35)";
      default:
        return "rgba(255,255,255,0.16)";
    }
  };

  const cancelOrder = async (orderId) => {
    const ok = window.confirm(
      `Cancel Order #${orderId}?\nThis can only be done while status is Pending.`
    );
    if (!ok) return;

    try {
      setCancelLoadingId(orderId);

      // ✅ backend route to implement:
      // DELETE /api/orders/<id>/cancel
      await API.delete(`/orders/${orderId}/cancel`);

      // ✅ update UI instantly
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "Cancelled" } : o))
      );

      alert("Order cancelled");
    } catch (err) {
      console.error("Cancel error:", err);
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to cancel order");
      // fallback refresh
      fetchOrders(true);
    } finally {
      setCancelLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div style={styles.centerBox}>
        <div style={styles.loader} />
        <h3 style={{ marginTop: 10 }}>Loading your orders...</h3>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.emptyCard}>
            <h2 style={{ margin: 0 }}>No Orders Yet</h2>
            <p style={{ marginTop: 8, opacity: 0.8 }}>
              Place your first order today.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topRow}>
          <h2 style={styles.heading}>📦 Your Orders</h2>

          <button
            style={{ ...styles.refreshBtn, opacity: refreshing ? 0.7 : 1 }}
            disabled={refreshing}
            onClick={() => fetchOrders(false)}
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>

        <div style={styles.grid}>
          {orders.map((order) => {
            const status = order.status || "Pending";
            const currentStep = getStepIndex(status);
            const canCancel = status === "Pending";

            return (
              <div key={order.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <div style={styles.orderId}>Order #{order.id}</div>
                    <div style={styles.total}>
                      Total: <b>₹{Number(order.total || 0).toFixed(2)}</b>
                    </div>
                  </div>

                  <div style={styles.rightHeader}>
                    <span
                      style={{
                        ...styles.badge,
                        background: getStatusColor(status),
                        borderColor: getStatusBorder(status),
                      }}
                    >
                      {status}
                    </span>

                    {canCancel && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        disabled={cancelLoadingId === order.id}
                        style={{
                          ...styles.cancelBtn,
                          opacity: cancelLoadingId === order.id ? 0.7 : 1,
                        }}
                        title="Cancel order (only Pending)"
                      >
                        {cancelLoadingId === order.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>

                {/* PROGRESS */}
                {status !== "Cancelled" ? (
                  <div style={styles.progressWrap}>
                    {steps.map((step, index) => {
                      const done = index <= currentStep;

                      return (
                        <div key={step} style={styles.step}>
                          <div
                            style={{
                              ...styles.circle,
                              background: done
                                ? "rgba(126,231,135,0.22)"
                                : "rgba(255,255,255,0.10)",
                              borderColor: done
                                ? "rgba(126,231,135,0.45)"
                                : "rgba(255,255,255,0.14)",
                              color: done ? "#eaf2ff" : "rgba(234,242,255,0.7)",
                            }}
                          >
                            {done ? "✓" : ""}
                          </div>

                          <div
                            style={{
                              ...styles.stepText,
                              color: done
                                ? "rgba(126,231,135,0.95)"
                                : "rgba(234,242,255,0.55)",
                            }}
                          >
                            {step}
                          </div>

                          {index !== steps.length - 1 && (
                            <div
                              style={{
                                ...styles.line,
                                background: index < currentStep
                                  ? "rgba(126,231,135,0.55)"
                                  : "rgba(255,255,255,0.12)",
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={styles.cancelledBox}>
                    ❌ This order has been cancelled.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: "center", marginTop: 18, opacity: 0.7, fontSize: 12 }}>
          Tip: You can cancel only while status is <b>Pending</b>.
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: {
    minHeight: "100vh",
    padding: "22px 14px 60px",
    color: "#eaf2ff",
  },

  container: {
    maxWidth: "1050px",
    margin: "auto",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 16,
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.20)",
    backdropFilter: "blur(10px)",
  },

  heading: { margin: 0, fontSize: 28, fontWeight: 900 },

  refreshBtn: {
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "#eaf2ff",
    cursor: "pointer",
    fontWeight: 900,
    padding: "0 14px",
  },

  grid: { display: "flex", flexDirection: "column", gap: 14 },

  card: {
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.20)",
    backdropFilter: "blur(10px)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 14,
  },

  orderId: { fontWeight: 900, fontSize: 16 },
  total: { marginTop: 6, opacity: 0.9 },

  rightHeader: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },

  badge: {
    padding: "7px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.16)",
    fontSize: 12,
    fontWeight: 900,
    color: "#eaf2ff",
  },

  cancelBtn: {
    height: 34,
    borderRadius: 12,
    border: "1px solid rgba(255,80,80,0.30)",
    background: "rgba(255,80,80,0.18)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
    padding: "0 12px",
  },

  progressWrap: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    alignItems: "center",
  },

  step: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
  },

  circle: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,255,255,0.14)",
    fontWeight: 900,
  },

  stepText: { fontSize: 12, fontWeight: 900 },

  line: {
    position: "absolute",
    top: 23,
    left: "50%",
    width: "100%",
    height: 3,
    transform: "translateX(50%)",
    borderRadius: 99,
    zIndex: 0,
  },

  cancelledBox: {
    marginTop: 6,
    padding: "14px",
    borderRadius: 14,
    border: "1px solid rgba(255,80,80,0.25)",
    background: "rgba(255,80,80,0.12)",
    fontWeight: 900,
    color: "rgba(255,200,200,0.95)",
  },

  emptyCard: {
    marginTop: 100,
    textAlign: "center",
    padding: "40px 20px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.22)",
    backdropFilter: "blur(10px)",
    color: "#eaf2ff",
  },

  centerBox: {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#eaf2ff",
  },

  loader: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    border: "4px solid rgba(255,255,255,0.15)",
    borderTop: "4px solid rgba(126,231,135,0.85)",
    animation: "spin 1s linear infinite",
  },
};