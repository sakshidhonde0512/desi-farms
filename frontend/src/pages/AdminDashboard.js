import { useEffect, useMemo, useRef, useState } from "react";
import API from "../services/api";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("products"); // "products" | "orders"

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [productQuery, setProductQuery] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    original_price: "",
    discount_percent: "",
    price: "",
    unit: "",
    stock: "",
    image: null,
  });

  const objectUrlRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- FETCH ---------------- */

  const normalizeProducts = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.products)) return data.products;
    return [];
  };

  const fetchProducts = async () => {
    try {
      setErr("");
      setLoadingProducts(true);
      const res = await API.get("/products");
      setProducts(normalizeProducts(res.data));
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || e.response?.data?.error || "Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setErr("");
      setLoadingOrders(true);
      const res = await API.get("/orders/all");
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || e.response?.data?.error || "Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  /* ---------------- FORM ---------------- */

  const calculateFinalPrice = (originalPrice, discountPercent) => {
    const original = parseFloat(originalPrice) || 0;
    const discount = parseFloat(discountPercent) || 0;
    const finalPrice = original - (original * discount) / 100;
    return finalPrice > 0 ? finalPrice.toFixed(2) : "0.00";
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files?.[0] || null;
      setFormData((p) => ({ ...p, image: file }));
      return;
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "original_price" || name === "discount_percent") {
        const original = name === "original_price" ? value : prev.original_price;
        const discount = name === "discount_percent" ? value : prev.discount_percent;
        updated.price = calculateFinalPrice(original, discount);
      }
      return updated;
    });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      original_price: "",
      discount_percent: "",
      price: "",
      unit: "",
      stock: "",
      image: null,
    });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name ?? "",
      original_price: String(product.original_price ?? ""),
      discount_percent: String(product.discount_percent ?? ""),
      price: String(product.price ?? ""),
      unit: product.unit ?? "",
      stock: String(product.stock ?? ""),
      image: null,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    // do not auto reset form; user might reopen quickly — but we reset on create anyway
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      setSaving(true);

      const data = new FormData();
      data.append("name", formData.name);
      data.append("original_price", formData.original_price);
      data.append("discount_percent", formData.discount_percent || 0);
      data.append("price", formData.price || calculateFinalPrice(formData.original_price, formData.discount_percent));
      data.append("unit", formData.unit);
      data.append("stock", formData.stock);

      if (formData.image) data.append("image", formData.image);

      if (editingId) {
        await API.put(`/products/${editingId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await API.post("/products", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      closeModal();
      resetForm();
      await fetchProducts();
    } catch (e) {
      console.error(e);
      setErr(e.response?.data?.message || e.response?.data?.error || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await API.delete(`/products/${id}`);
      fetchProducts();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || e.response?.data?.error || "Failed to delete product");
    }
  };

  const updateStock = async (id, stock) => {
    const s = Number(stock);
    if (Number.isNaN(s) || s < 0) return alert("Stock must be a valid number");
    try {
      await API.put(`/products/${id}/stock`, { stock: s });
      fetchProducts();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || e.response?.data?.error || "Failed to update stock");
    }
  };

  /* ---------------- ORDERS ---------------- */

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}/status`, { status });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || e.response?.data?.error || "Failed to update order status");
    }
  };

  const statusMeta = (status) => {
    switch (status) {
      case "Pending":
        return { bg: "rgba(255,211,107,0.22)", border: "rgba(255,211,107,0.35)" };
      case "Confirmed":
        return { bg: "rgba(91,188,255,0.22)", border: "rgba(91,188,255,0.35)" };
      case "Shipped":
        return { bg: "rgba(170,120,255,0.20)", border: "rgba(170,120,255,0.30)" };
      case "Delivered":
        return { bg: "rgba(126,231,135,0.18)", border: "rgba(126,231,135,0.30)" };
      case "Cancelled":
        return { bg: "rgba(255,80,80,0.18)", border: "rgba(255,80,80,0.30)" };
      default:
        return { bg: "rgba(255,255,255,0.10)", border: "rgba(255,255,255,0.14)" };
    }
  };

  /* ---------------- DERIVED ---------------- */

  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => (p.name || "").toLowerCase().includes(q));
  }, [products, productQuery]);

  const filteredOrders = useMemo(() => {
    if (!orderStatusFilter) return orders;
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pending = orders.filter((o) => o.status === "Pending").length;
    const delivered = orders.filter((o) => o.status === "Delivered").length;
    const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return { products: products.length, totalOrders, pending, delivered, revenue };
  }, [products.length, orders]);

  const imagePreview = useMemo(() => {
    if (!formData.image) return null;

    // cleanup previous url
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);

    const url = URL.createObjectURL(formData.image);
    objectUrlRef.current = url;
    return url;
  }, [formData.image]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  /* ---------------- UI ---------------- */

  const productsBusy = loadingProducts || saving;
  const ordersBusy = loadingOrders;

  return (
    <div style={ui.app}>
      <aside style={ui.sidebar}>
        <div style={ui.brand}>
          <div style={ui.brandLogo}>🥛</div>
          <div>
            <div style={ui.brandTitle}>Dairy Admin</div>
            <div style={ui.brandSub}>Dashboard</div>
          </div>
        </div>

        <div style={ui.nav}>
          <NavItem
            active={activeTab === "products"}
            label="Products"
            desc="Manage inventory"
            onClick={() => setActiveTab("products")}
          />
          <NavItem
            active={activeTab === "orders"}
            label="Orders"
            desc="Track & update"
            onClick={() => setActiveTab("orders")}
          />
        </div>

        <div style={ui.sidebarFooter}>
          <div style={{ opacity: 0.8, fontSize: 12 }}>Quick Actions</div>
          <button style={ui.secondaryBtn} onClick={fetchProducts} disabled={loadingProducts}>
            {loadingProducts ? "Loading…" : "Refresh Products"}
          </button>
          <button style={ui.secondaryBtn} onClick={fetchOrders} disabled={loadingOrders}>
            {loadingOrders ? "Loading…" : "Refresh Orders"}
          </button>
        </div>
      </aside>

      <main style={ui.main}>
        {/* Topbar */}
        <div style={ui.topbar}>
          <div>
            <div style={ui.pageTitle}>
              {activeTab === "products" ? "Products" : "Orders"}
            </div>
            <div style={ui.pageSub}>
              {activeTab === "products"
                ? "Add, edit, delete products and update stock."
                : "View all orders and update order status."}
            </div>
          </div>

          <div style={ui.topbarRight}>
            {activeTab === "products" && (
              <button style={ui.primaryBtn} onClick={openCreate}>
                + Add Product
              </button>
            )}
          </div>
        </div>

        {err && <Alert kind="error" text={err} onClose={() => setErr("")} />}

        {/* Stats Row */}
        <div style={ui.statsRow}>
          <KpiCard title="Products" value={stats.products} icon="🧺" hint="Total items" />
          <KpiCard title="Orders" value={stats.totalOrders} icon="📦" hint="All orders" />
          <KpiCard title="Pending" value={stats.pending} icon="⏳" hint="Needs attention" />
          <KpiCard title="Revenue" value={`₹ ${stats.revenue.toFixed(2)}`} icon="💰" hint="Gross total" />
        </div>

        {/* Content */}
        {activeTab === "products" ? (
          <section style={ui.card}>
            <div style={ui.cardHeader}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={ui.cardTitle}>Product List</div>
                <div style={ui.cardSub}>
                  {loadingProducts ? "Loading…" : `${products.length} total products`}
                </div>
              </div>

              <div style={ui.cardTools}>
                <input
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search products…"
                  style={ui.search}
                />
              </div>
            </div>

            {loadingProducts ? (
              <div style={ui.empty}>Loading products…</div>
            ) : filteredProducts.length === 0 ? (
              <div style={ui.empty}>No products found.</div>
            ) : (
              <div style={ui.table}>
                <div style={ui.tableHead}>
                  <div style={ui.th}>Product</div>
                  <div style={ui.th}>Price</div>
                  <div style={ui.th}>Stock</div>
                  <div style={ui.th}>Actions</div>
                </div>

                {filteredProducts.map((p) => {
                  const disc = Number(p.discount_percent || 0);
                  const imgSrc = p.image ? `http://127.0.0.1:5000${p.image}` : null;

                  return (
                    <div key={p.id} style={ui.tableRow}>
                      <div style={ui.tdProduct}>
                        <div style={ui.thumb}>
                          {imgSrc ? (
                            <img src={imgSrc} alt={p.name} style={ui.thumbImg} />
                          ) : (
                            <div style={ui.thumbFallback}>No</div>
                          )}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div style={ui.pName} title={p.name}>
                            {p.name}
                          </div>
                          <div style={ui.pMeta}>
                            Unit: <b>{p.unit}</b>{" "}
                            {disc > 0 ? <span style={ui.badge}>{disc}% OFF</span> : null}
                          </div>
                        </div>
                      </div>

                      <div style={ui.td}>
                        {disc > 0 ? (
                          <div>
                            <div style={ui.strike}>₹ {Number(p.original_price || 0).toFixed(2)}</div>
                            <div style={ui.priceGood}>₹ {Number(p.price || 0).toFixed(2)}</div>
                          </div>
                        ) : (
                          <div style={ui.price}>₹ {Number(p.price || 0).toFixed(2)}</div>
                        )}
                      </div>

                      <div style={ui.td}>
                        <input
                          type="number"
                          defaultValue={p.stock}
                          onBlur={(e) => updateStock(p.id, e.target.value)}
                          style={ui.stockInput}
                        />
                      </div>

                      <div style={ui.tdActions}>
                        <button style={ui.smallBtn} onClick={() => openEdit(p)}>
                          Edit
                        </button>
                        <button style={ui.smallDanger} onClick={() => handleDelete(p.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section style={ui.card}>
            <div style={ui.cardHeader}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={ui.cardTitle}>Orders</div>
                <div style={ui.cardSub}>
                  {loadingOrders ? "Loading…" : `${orders.length} total orders`}
                </div>
              </div>

              <div style={ui.cardTools}>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  style={ui.select}
                >
                  <option value="">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {ordersBusy ? (
              <div style={ui.empty}>Loading orders…</div>
            ) : filteredOrders.length === 0 ? (
              <div style={ui.empty}>No orders found.</div>
            ) : (
              <div style={ui.table}>
                <div style={ui.tableHeadOrders}>
                  <div style={ui.th}>Order</div>
                  <div style={ui.th}>User</div>
                  <div style={ui.th}>Total</div>
                  <div style={ui.th}>Status</div>
                  <div style={ui.th}>Change</div>
                </div>

                {filteredOrders.map((o) => {
                  const meta = statusMeta(o.status);
                  return (
                    <div key={o.id} style={ui.tableRowOrders}>
                      <div style={ui.td}>
                        <div style={{ fontWeight: 900 }}>#{o.id}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{o.created_at || ""}</div>
                      </div>

                      <div style={ui.td}>
                        <span style={{ opacity: 0.85 }}>User: </span>
                        <b>{o.user_id}</b>
                      </div>

                      <div style={ui.td}>₹ {Number(o.total || 0).toFixed(2)}</div>

                      <div style={ui.td}>
                        <span style={{ ...ui.statusPill, background: meta.bg, borderColor: meta.border }}>
                          {o.status}
                        </span>
                      </div>

                      <div style={ui.td}>
                        <select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          style={ui.select}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Product Modal */}
        {modalOpen && (
          <Modal title={editingId ? "Edit Product" : "Add Product"} onClose={closeModal}>
            <form onSubmit={handleSubmit} style={ui.modalForm}>
              <Field label="Product Name">
                <input
                  name="name"
                  placeholder="e.g. A2 Cow Milk"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={ui.input}
                />
              </Field>

              <div style={ui.modalGrid2}>
                <Field label="Unit">
                  <input
                    name="unit"
                    placeholder="kg / litre / pack"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    style={ui.input}
                  />
                </Field>
                <Field label="Stock">
                  <input
                    name="stock"
                    type="number"
                    placeholder="e.g. 50"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    style={ui.input}
                  />
                </Field>
              </div>

              <div style={ui.modalGrid3}>
                <Field label="Original (₹)">
                  <input
                    name="original_price"
                    type="number"
                    placeholder="e.g. 100"
                    value={formData.original_price}
                    onChange={handleChange}
                    required
                    style={ui.input}
                  />
                </Field>

                <Field label="Discount %">
                  <input
                    name="discount_percent"
                    type="number"
                    placeholder="e.g. 10"
                    value={formData.discount_percent}
                    onChange={handleChange}
                    style={ui.input}
                  />
                </Field>

                <Field label="Final (₹)">
                  <input
                    name="price"
                    type="number"
                    placeholder="auto"
                    value={formData.price}
                    readOnly
                    style={{ ...ui.input, opacity: 0.9 }}
                  />
                </Field>
              </div>

              <Field label="Image (optional)">
                <input
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleChange}
                  style={ui.fileInput}
                />
                {imagePreview && (
                  <div style={ui.previewWrap}>
                    <img src={imagePreview} alt="preview" style={ui.previewImg} />
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 8 }}>Preview</div>
                  </div>
                )}
              </Field>

              <div style={ui.modalActions}>
                <button type="button" style={ui.secondaryBtn} onClick={closeModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" style={ui.primaryBtn} disabled={saving}>
                  {saving ? "Saving…" : editingId ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </main>
    </div>
  );
}

/* ---------------- Small components ---------------- */

function NavItem({ active, label, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...ui.navItem,
        background: active ? "rgba(255,255,255,0.10)" : "transparent",
        borderColor: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.10)",
      }}
    >
      <div style={{ fontWeight: 900 }}>{label}</div>
      <div style={{ fontSize: 12, opacity: 0.72 }}>{desc}</div>
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={ui.label}>{label}</div>
      {children}
    </div>
  );
}

function KpiCard({ title, value, icon, hint }) {
  return (
    <div style={ui.kpiCard}>
      <div style={ui.kpiTop}>
        <div style={ui.kpiIcon}>{icon}</div>
        <div style={{ minWidth: 0 }}>
          <div style={ui.kpiTitle}>{title}</div>
          <div style={ui.kpiHint}>{hint}</div>
        </div>
      </div>
      <div style={ui.kpiValue}>{value}</div>
    </div>
  );
}

function Alert({ kind = "error", text, onClose }) {
  const style = kind === "error" ? ui.alertError : ui.alertInfo;
  return (
    <div style={style}>
      <div style={{ fontWeight: 900 }}>{kind === "error" ? "Error" : "Info"}</div>
      <div style={{ opacity: 0.9 }}>{text}</div>
      <button style={ui.alertClose} onClick={onClose} aria-label="close">
        ✖
      </button>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={ui.modalOverlay} onMouseDown={onClose}>
      <div style={ui.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={ui.modalHeader}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
          <button style={ui.iconBtn} onClick={onClose} aria-label="close">
            ✖
          </button>
        </div>
        <div style={ui.modalBody}>{children}</div>
      </div>
    </div>
  );
}

/* ---------------- UI Styles (advanced layout) ---------------- */

const ui = {
  app: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "280px 1fr",
    background: "radial-gradient(1200px 700px at 15% 10%, rgba(126,231,135,0.14), transparent 55%), radial-gradient(900px 500px at 70% 10%, rgba(91,188,255,0.14), transparent 55%), #070B12",
    color: "#EAF2FF",
  },

  sidebar: {
    padding: 18,
    borderRight: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(12px)",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  brand: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
  },

  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 20,
  },

  brandTitle: { fontWeight: 900, fontSize: 14 },
  brandSub: { fontSize: 12, opacity: 0.75, marginTop: 2 },

  nav: { display: "flex", flexDirection: "column", gap: 10 },

  navItem: {
    textAlign: "left",
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "transparent",
    color: "#EAF2FF",
    cursor: "pointer",
  },

  sidebarFooter: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    paddingTop: 10,
  },

  main: {
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  topbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "flex-end",
  },

  pageTitle: { fontSize: 22, fontWeight: 900 },
  pageSub: { fontSize: 12, opacity: 0.75, marginTop: 4 },
  topbarRight: { display: "flex", gap: 10, alignItems: "center" },

  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(220px, 1fr))",
    gap: 12,
  },

  kpiCard: {
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.20)",
    backdropFilter: "blur(12px)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minWidth: 0,
  },

  kpiTop: { display: "flex", gap: 12, alignItems: "center" },

  kpiIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 10px 22px rgba(0,0,0,0.22)",
    fontSize: 20,
  },

  kpiTitle: { fontWeight: 900, fontSize: 14 },
  kpiHint: { fontSize: 12, opacity: 0.72, marginTop: 2 },
  kpiValue: { fontSize: 22, fontWeight: 900 },

  card: {
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 16px 40px rgba(0,0,0,0.20)",
    backdropFilter: "blur(12px)",
    padding: 16,
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "flex-end",
    marginBottom: 12,
  },

  cardTitle: { fontWeight: 900, fontSize: 16 },
  cardSub: { fontSize: 12, opacity: 0.72, marginTop: 3 },
  cardTools: { display: "flex", gap: 10, alignItems: "center" },

  label: { fontSize: 12, fontWeight: 900, opacity: 0.85 },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.25)",
    color: "#EAF2FF",
    outline: "none",
    fontSize: "14px",
  },

  fileInput: {
    width: "100%",
    padding: "10px",
    borderRadius: "12px",
    border: "1px dashed rgba(255,255,255,0.18)",
    background: "rgba(0,0,0,0.18)",
    color: "#EAF2FF",
    outline: "none",
    fontSize: "14px",
  },

  search: {
    height: 40,
    width: 320,
    maxWidth: "100%",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.25)",
    color: "#EAF2FF",
    padding: "0 12px",
    outline: "none",
    fontWeight: 800,
  },

  select: {
    height: 40,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.25)",
    color: "#EAF2FF",
    padding: "0 10px",
    outline: "none",
    fontWeight: 800,
    minWidth: 180,
  },

  empty: {
    padding: 18,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    opacity: 0.9,
  },

  table: { display: "flex", flexDirection: "column", gap: 10 },

  tableHead: {
    display: "grid",
    gridTemplateColumns: "1.6fr 0.9fr 0.9fr 1fr",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns: "1.6fr 0.9fr 0.9fr 1fr",
    gap: 10,
    padding: "12px 12px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    alignItems: "center",
  },

  tableHeadOrders: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr 0.9fr 1fr 1fr",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 14,
    background: "rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.10)",
  },

  tableRowOrders: {
    display: "grid",
    gridTemplateColumns: "1.1fr 1fr 0.9fr 1fr 1fr",
    gap: 10,
    padding: "12px 12px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.10)",
    alignItems: "center",
  },

  th: { fontSize: 12, fontWeight: 900, opacity: 0.85 },
  td: { display: "flex", alignItems: "center" },

  tdProduct: { display: "flex", gap: 12, alignItems: "center", minWidth: 0 },

  thumb: {
    width: 46,
    height: 46,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    overflow: "hidden",
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
  },

  thumbImg: { width: "100%", height: "100%", objectFit: "cover" },
  thumbFallback: { fontSize: 12, opacity: 0.7, fontWeight: 900 },

  pName: {
    fontWeight: 900,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 520,
  },

  pMeta: { fontSize: 12, opacity: 0.75, marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap" },

  badge: {
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,80,80,0.30)",
    background: "rgba(255,80,80,0.14)",
    fontWeight: 900,
    fontSize: 12,
  },

  price: { fontWeight: 900 },
  priceGood: { fontWeight: 900, color: "rgba(126,231,135,0.95)" },
  strike: { fontSize: 12, opacity: 0.7, textDecoration: "line-through" },

  stockInput: {
    width: 90,
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.25)",
    color: "#EAF2FF",
    padding: "0 10px",
    outline: "none",
    fontWeight: 900,
  },

  tdActions: { display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" },

  smallBtn: {
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(91,188,255,0.30)",
    background: "rgba(91,188,255,0.12)",
    color: "#EAF2FF",
    cursor: "pointer",
    padding: "0 12px",
    fontWeight: 900,
  },

  smallDanger: {
    height: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,80,80,0.30)",
    background: "rgba(255,80,80,0.12)",
    color: "#fff",
    cursor: "pointer",
    padding: "0 12px",
    fontWeight: 900,
  },

  primaryBtn: {
    height: 40,
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(90deg, #7ee787, #5bbcff)",
    color: "#071018",
    cursor: "pointer",
    padding: "0 14px",
    fontWeight: 900,
    boxShadow: "0 14px 30px rgba(0,0,0,0.25)",
  },

  secondaryBtn: {
    height: 40,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#EAF2FF",
    cursor: "pointer",
    padding: "0 14px",
    fontWeight: 900,
  },

  statusPill: {
    padding: "7px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.14)",
    fontWeight: 900,
    fontSize: 12,
  },

  /* Modal */
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "grid",
    placeItems: "center",
    padding: 14,
    zIndex: 50,
  },

  modal: {
    width: "min(920px, 100%)",
    borderRadius: 18,
    background: "rgba(10,14,22,0.92)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 28px 80px rgba(0,0,0,0.55)",
    backdropFilter: "blur(14px)",
    overflow: "hidden",
  },

  modalHeader: {
    padding: 14,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },

  modalBody: { padding: 14 },

  iconBtn: {
    height: 36,
    width: 36,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#EAF2FF",
    cursor: "pointer",
    fontWeight: 900,
  },

  modalForm: { display: "flex", flexDirection: "column", gap: 12 },
  modalGrid2: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
  modalGrid3: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 },

  previewWrap: {
    marginTop: 10,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    padding: 10,
    width: "fit-content",
  },

  previewImg: { width: 160, height: 120, objectFit: "cover", borderRadius: 12, display: "block" },

  modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 },

  /* Alerts */
  alertError: {
    position: "relative",
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(255,80,80,0.14)",
    border: "1px solid rgba(255,80,80,0.22)",
    color: "#ffd0d0",
    display: "grid",
    gap: 4,
  },

  alertInfo: {
    position: "relative",
    padding: "12px 14px",
    borderRadius: 16,
    background: "rgba(91,188,255,0.14)",
    border: "1px solid rgba(91,188,255,0.22)",
    color: "#d9f0ff",
    display: "grid",
    gap: 4,
  },

  alertClose: {
    position: "absolute",
    right: 10,
    top: 10,
    height: 32,
    width: 32,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#EAF2FF",
    cursor: "pointer",
    fontWeight: 900,
  },
};