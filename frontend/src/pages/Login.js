import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");

    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        navigate(user?.role === "admin" ? "/admin" : "/products", { replace: true });
      } catch {}
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter email and password");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/login", {
        email: email.trim(),
        password,
      });

      const token = res.data?.access_token;
      const user = res.data?.user;

      if (!token) {
        setError("Login failed. Please try again.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user || {}));
      window.dispatchEvent(new Event("auth-changed"));

      navigate(user?.role === "admin" ? "/admin" : "/products", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={ui.page}>
      <div style={ui.glowA} />
      <div style={ui.glowB} />

      <div style={ui.shell}>
        {/* LEFT */}
        <div style={ui.left}>
          <div style={ui.leftTop}>
            <div style={ui.logoBadge}>🌿</div>
            <div>
              <div style={ui.brand}>Desi Farms</div>
              <div style={ui.tagline}>PURE • ORGANIC • TRUSTED</div>
            </div>
          </div>

          <div style={ui.hero}>
            <div style={ui.heroTitle}>Welcome back</div>
            <div style={ui.heroText}>
              Login to continue shopping fresh dairy products. Manage orders, cart and offers.
            </div>
          </div>

          <div style={ui.featureGrid}>
            <Feature icon="⚡" title="Fast Checkout" text="UPI / COD payments supported." />
            <Feature icon="📦" title="Track Orders" text="Real-time order status updates." />
            <Feature icon="🥛" title="Fresh Items" text="Quality products, daily stock." />
          </div>

          <div style={ui.leftFooter}>© 2026 Desi Farms</div>
        </div>

        {/* RIGHT */}
        <div style={ui.card}>
          <div style={ui.cardHeader}>
            <div>
              <div style={ui.cardTitle}>Login</div>
              <div style={ui.cardSub}>Enter your details to continue</div>
            </div>

            <div style={ui.pill}>🔒 Secure</div>
          </div>

          {error && (
            <div style={ui.errorBox}>
              <div style={{ fontWeight: 900 }}>Login failed</div>
              <div style={{ opacity: 0.9 }}>{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} style={ui.form}>
            <div style={ui.field}>
              <label style={ui.label}>Email</label>
              <input
                type="email"
                value={email}
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                style={ui.input}
                autoComplete="email"
              />
            </div>

            <div style={ui.field}>
              <label style={ui.label}>Password</label>
              <div style={ui.passwordWrap}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...ui.input, paddingRight: 52 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  style={ui.eyeBtn}
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label="Toggle password visibility"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...ui.primaryBtn,
                opacity: loading ? 0.75 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Authenticating..." : "Login"}
            </button>

            <div style={ui.dividerRow}>
              <div style={ui.dividerLine} />
              <div style={ui.dividerText}>New here?</div>
              <div style={ui.dividerLine} />
            </div>

            <button
              type="button"
              style={ui.secondaryBtn}
              onClick={() => navigate("/register")}
            >
              Create Account
            </button>

            <div style={ui.smallNote}>
              By continuing, you agree to our <span style={ui.linkLike}>Terms</span> &{" "}
              <span style={ui.linkLike}>Privacy</span>.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ---------- small components ---------- */

function Feature({ icon, title, text }) {
  return (
    <div style={ui.feature}>
      <div style={ui.featureIcon}>{icon}</div>
      <div>
        <div style={{ fontWeight: 900 }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{text}</div>
      </div>
    </div>
  );
}

/* ---------- UI styles ---------- */

const ui = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "22px 14px",
    background: "#070B12",
    color: "#eaf2ff",
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    position: "relative",
    overflow: "hidden",
  },

  glowA: {
    position: "absolute",
    inset: "-200px",
    background:
      "radial-gradient(900px 540px at 18% 15%, rgba(126,231,135,0.20), transparent 55%), radial-gradient(800px 520px at 85% 18%, rgba(91,188,255,0.20), transparent 55%)",
    filter: "blur(18px)",
    pointerEvents: "none",
  },

  glowB: {
    position: "absolute",
    inset: "-220px",
    background:
      "radial-gradient(900px 600px at 55% 90%, rgba(255,211,107,0.10), transparent 55%)",
    filter: "blur(22px)",
    pointerEvents: "none",
  },

  shell: {
    width: "min(1040px, 100%)",
    display: "grid",
    gridTemplateColumns: "1.05fr 1fr",
    borderRadius: 22,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.45)",
    backdropFilter: "blur(14px)",
    position: "relative",
    zIndex: 2,
  },

  /* LEFT */
  left: {
    padding: 22,
    borderRight: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  leftTop: { display: "flex", gap: 12, alignItems: "center" },

  logoBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
    fontSize: 20,
  },

  brand: { fontWeight: 900, fontSize: 16 },
  tagline: { fontSize: 12, opacity: 0.72, marginTop: 2, letterSpacing: 1.6 },

  hero: {
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
  },

  heroTitle: { fontSize: 22, fontWeight: 900 },
  heroText: { marginTop: 8, fontSize: 12, opacity: 0.78, lineHeight: 1.6 },

  featureGrid: { display: "grid", gap: 10 },

  feature: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: 12,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
  },

  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 18,
  },

  leftFooter: { marginTop: "auto", fontSize: 12, opacity: 0.7 },

  /* RIGHT */
  card: {
    padding: 22,
    background: "rgba(255,255,255,0.04)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },

  cardTitle: { fontSize: 20, fontWeight: 900 },
  cardSub: { fontSize: 12, opacity: 0.75, marginTop: 4 },

  pill: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    fontSize: 12,
    fontWeight: 900,
    opacity: 0.9,
    whiteSpace: "nowrap",
  },

  errorBox: {
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,80,80,0.22)",
    background: "rgba(255,80,80,0.12)",
    color: "#ffd0d0",
    display: "grid",
    gap: 4,
    marginTop: 10,
  },

  form: { marginTop: 12, display: "flex", flexDirection: "column", gap: 14 },

  field: { display: "flex", flexDirection: "column", gap: 6 },

  label: { fontSize: 12, fontWeight: 900, opacity: 0.85 },

  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.22)",
    color: "#eaf2ff",
    outline: "none",
    fontSize: 14,
  },

  passwordWrap: { position: "relative", display: "flex", alignItems: "center" },

  eyeBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    height: 34,
    width: 40,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#eaf2ff",
    cursor: "pointer",
    fontWeight: 900,
  },

  primaryBtn: {
    height: 46,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(90deg, #7ee787, #5bbcff)",
    color: "#071018",
    fontWeight: 900,
    fontSize: 15,
    boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
  },

  dividerRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },
  dividerLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.10)" },
  dividerText: { fontSize: 12, opacity: 0.75, fontWeight: 800 },

  secondaryBtn: {
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#eaf2ff",
    fontWeight: 900,
    cursor: "pointer",
  },

  smallNote: {
    marginTop: 10,
    fontSize: 12,
    opacity: 0.7,
    textAlign: "center",
    lineHeight: 1.5,
  },

  linkLike: { textDecoration: "underline", cursor: "pointer", fontWeight: 800 },
};