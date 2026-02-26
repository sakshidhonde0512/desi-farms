import React from "react";

export default function Contact() {
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.heading}>📞 Contact Us</h2>

        <p style={styles.subtitle}>
          Have questions or need support? We’re here to help you 24/7.
        </p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h3>📧 Email</h3>
            <p>vaishnavidivekar3012@gmail.com</p>
          </div>

          <div style={styles.card}>
            <h3>📱 Phone</h3>
            <p>+91 87664 62454</p>
          </div>

          <div style={styles.card}>
            <h3>📍 Address</h3>
            <p>
              Desi Farms HQ <br />
              Panvel, Maharashtra <br />
              India
            </p>
          </div>
        </div>

        <div style={styles.footer}>
          🌿 Thank you for choosing Desi Farms — Eat Clean, Live Green
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "40px 16px",
    background: "linear-gradient(135deg, #0b1220, #111a2e, #0f2b2a)",
    color: "#eaf2ff",
  },

  container: {
    maxWidth: "900px",
    margin: "auto",
    padding: "28px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(10px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
  },

  heading: {
    textAlign: "center",
    fontSize: "32px",
    fontWeight: 900,
    marginBottom: "10px",
  },

  subtitle: {
    textAlign: "center",
    opacity: 0.85,
    marginBottom: "30px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  },

  card: {
    padding: "22px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    textAlign: "center",
    boxShadow: "0 12px 28px rgba(0,0,0,0.2)",
  },

  footer: {
    marginTop: "30px",
    textAlign: "center",
    fontWeight: 700,
    opacity: 0.8,
  },
};