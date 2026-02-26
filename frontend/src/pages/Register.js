import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
    role: "customer", // ✅ fixed role
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  /* =============================
     🔐 PASSWORD CONDITIONS (2)
  ============================== */

  const passwordRules = useMemo(() => {
    const p = data.password || "";
    return {
      length: p.length >= 8,
      special: /[@$!%*?&]/.test(p),
    };
  }, [data.password]);

  const rulesPassed = useMemo(
    () => Object.values(passwordRules).filter(Boolean).length,
    [passwordRules]
  );

  const isStrongPassword = rulesPassed === 2; // ✅ ONLY 2 conditions

  const passwordsMatch =
    data.confirm_password && data.password === data.confirm_password;

  const handleChange = (e) => {
    setData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isStrongPassword) {
      setError("Password must be 8+ chars and include 1 special character (@$!%*?&).");
      return;
    }

    if (!passwordsMatch) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // ✅ ensure role always customer
      const payload = { ...data, role: "customer" };

      const res = await API.post("/register", payload);
      setSuccess(res.data.message || "Account created successfully!");

      setTimeout(() => navigate("/login"), 900);
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={ui.page}>
      <div style={ui.bgGlow} />

      <div style={ui.shell}>
        {/* Left panel */}
        <div style={ui.left}>
          <div style={ui.brandRow}>
            <div style={ui.brandIcon}>🌿</div>
            <div>
              <div style={ui.brandTitle}>Desi Farms</div>
              <div style={ui.brandSub}>Pure • Organic • Trusted</div>
            </div>
          </div>

          <div style={ui.hero}>
            <div style={ui.heroTitle}>Create your account</div>
            <div style={ui.heroText}>
              Get fresh products delivered to your doorstep. Track orders, manage your cart,
              and enjoy offers.
            </div>
          </div>

          <div style={ui.benefits}>
            <Benefit icon="🚚" title="Fast delivery" text="Same-day delivery in select areas." />
            <Benefit icon="🥛" title="Fresh & quality" text="Direct farm-to-home products." />
            <Benefit icon="💳" title="Easy payments" text="COD and UPI supported." />
          </div>

          <div style={ui.leftFooter}>© 2026 Desi Farms</div>
        </div>

        {/* Right card */}
        <div style={ui.card}>
          <div style={ui.cardTop}>
            <div style={ui.cardTitle}>Create Account</div>
            <div style={ui.cardSub}>Sign up in less than a minute</div>
          </div>

          {error && <Alert kind="error" text={error} />}
          {success && <Alert kind="success" text={success} />}

          <form onSubmit={handleSubmit} style={ui.form}>
            <Field label="Full Name">
              <input
                type="text"
                name="name"
                placeholder="Your name"
                value={data.name}
                onChange={handleChange}
                style={ui.input}
                required
              />
            </Field>

            <Field label="Email Address">
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={data.email}
                onChange={handleChange}
                style={ui.input}
                required
              />
            </Field>

            {/* Password */}
            <Field label="Password">
              <div style={ui.inputWrap}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create password"
                  value={data.password}
                  onChange={handleChange}
                  style={{ ...ui.input, paddingRight: 44 }}
                  required
                />
                <button
                  type="button"
                  style={ui.iconBtn}
                  onClick={() => setShowPassword((s) => !s)}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              <div style={ui.rulesGrid}>
                <Rule ok={passwordRules.length} text="8+ characters" />
                <Rule ok={passwordRules.special} text="Special (@$!%*?&)" />
              </div>
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password">
              <div style={ui.inputWrap}>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirm_password"
                  placeholder="Re-enter password"
                  value={data.confirm_password}
                  onChange={handleChange}
                  style={{
                    ...ui.input,
                    paddingRight: 44,
                    borderColor:
                      data.confirm_password && !passwordsMatch
                        ? "rgba(255,80,80,0.7)"
                        : "rgba(255,255,255,0.14)",
                  }}
                  required
                />
                <button
                  type="button"
                  style={ui.iconBtn}
                  onClick={() => setShowConfirm((s) => !s)}
                >
                  {showConfirm ? "🙈" : "👁️"}
                </button>
              </div>

              {data.confirm_password && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    fontWeight: 800,
                    color: passwordsMatch
                      ? "rgba(126,231,135,0.95)"
                      : "rgba(255,140,140,0.95)",
                  }}
                >
                  {passwordsMatch ? "✅ Passwords match" : "❌ Passwords do not match"}
                </div>
              )}
            </Field>

            <button
              type="submit"
              disabled={!isStrongPassword || !passwordsMatch || loading}
              style={{
                ...ui.primaryBtn,
                opacity: !isStrongPassword || !passwordsMatch || loading ? 0.6 : 1,
                cursor:
                  !isStrongPassword || !passwordsMatch || loading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

            <div style={ui.dividerRow}>
              <div style={ui.dividerLine} />
              <div style={ui.dividerText}>Already registered?</div>
              <div style={ui.dividerLine} />
            </div>

            <button type="button" style={ui.secondaryBtn} onClick={() => navigate("/login")}>
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;

/* ---------------- helpers ---------------- */

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={ui.label}>{label}</div>
      {children}
    </div>
  );
}

function Rule({ ok, text }) {
  return (
    <div style={ui.rule}>
      <span style={{ fontSize: 14 }}>{ok ? "✅" : "⬜"}</span>
      <span style={{ opacity: ok ? 0.95 : 0.7 }}>{text}</span>
    </div>
  );
}

function Alert({ kind = "error", text }) {
  const style = kind === "error" ? ui.alertError : ui.alertSuccess;
  return (
    <div style={style}>
      <div style={{ fontWeight: 900 }}>{kind === "error" ? "Error" : "Success"}</div>
      <div style={{ opacity: 0.9 }}>{text}</div>
    </div>
  );
}

function Benefit({ icon, title, text }) {
  return (
    <div style={ui.benefit}>
      <div style={ui.benefitIcon}>{icon}</div>
      <div>
        <div style={{ fontWeight: 900 }}>{title}</div>
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{text}</div>
      </div>
    </div>
  );
}

/* ---------------- styles (same as your UI) ---------------- */

const ui = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "22px 14px",
    background:
      "radial-gradient(1200px 700px at 15% 10%, rgba(126,231,135,0.22), transparent 55%), radial-gradient(900px 500px at 80% 10%, rgba(91,188,255,0.20), transparent 55%), #070B12",
    color: "#EAF2FF",
    fontFamily: "Inter, system-ui, Arial, sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  bgGlow: {
    position: "absolute",
    inset: -200,
    background:
      "radial-gradient(closest-side at 35% 30%, rgba(126,231,135,0.12), transparent 55%), radial-gradient(closest-side at 70% 35%, rgba(91,188,255,0.12), transparent 55%)",
    filter: "blur(30px)",
    pointerEvents: "none",
  },
  shell: {
    width: "min(1020px, 100%)",
    display: "grid",
    gridTemplateColumns: "1.05fr 1fr",
    borderRadius: 22,
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 30px 90px rgba(0,0,0,0.45)",
    backdropFilter: "blur(14px)",
  },
  left: {
    padding: 22,
    borderRight: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  brandRow: { display: "flex", gap: 12, alignItems: "center" },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  brandTitle: { fontWeight: 900, fontSize: 16 },
  brandSub: { fontSize: 12, opacity: 0.75, marginTop: 2 },
  hero: {
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
  },
  heroTitle: { fontSize: 22, fontWeight: 900 },
  heroText: { marginTop: 8, fontSize: 12, opacity: 0.78, lineHeight: 1.6 },
  benefits: { display: "grid", gap: 10 },
  benefit: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: 12,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
  },
  benefitIcon: {
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
  card: { padding: 22, background: "rgba(255,255,255,0.04)" },
  cardTop: { marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: 900 },
  cardSub: { fontSize: 12, opacity: 0.75, marginTop: 4 },
  form: { display: "flex", flexDirection: "column", gap: 14, marginTop: 10 },
  label: { fontSize: 12, fontWeight: 900, opacity: 0.85 },
  input: {
    width: "100%",
    padding: "12px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.22)",
    color: "#EAF2FF",
    outline: "none",
    fontSize: 14,
  },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  iconBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    height: 34,
    width: 34,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#EAF2FF",
    cursor: "pointer",
    fontWeight: 900,
  },
  rulesGrid: {
    marginTop: 10,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  rule: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    fontSize: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
    padding: "10px 10px",
  },
  primaryBtn: {
    height: 46,
    borderRadius: 16,
    border: "none",
    background: "linear-gradient(90deg, #7ee787, #5bbcff)",
    color: "#071018",
    fontWeight: 900,
    boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
  },
  secondaryBtn: {
    height: 44,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#EAF2FF",
    fontWeight: 900,
    cursor: "pointer",
  },
  dividerRow: { display: "flex", alignItems: "center", gap: 10, marginTop: 4 },
  dividerLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.10)" },
  dividerText: { fontSize: 12, opacity: 0.75, fontWeight: 800 },
  alertError: {
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(255,80,80,0.22)",
    background: "rgba(255,80,80,0.12)",
    color: "#ffd0d0",
    display: "grid",
    gap: 4,
  },
  alertSuccess: {
    padding: 12,
    borderRadius: 16,
    border: "1px solid rgba(126,231,135,0.22)",
    background: "rgba(126,231,135,0.12)",
    color: "#d7ffe0",
    display: "grid",
    gap: 4,
  },
};