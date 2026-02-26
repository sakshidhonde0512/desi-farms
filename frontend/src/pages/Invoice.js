import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

export default function Invoice() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      const res = await API.get(`/orders/${id}`);
      setInvoice(res.data);
    };
    fetchInvoice();
  }, [id]);

  if (!invoice) return <h2>Loading invoice...</h2>;

  return (
    <div style={{ maxWidth: "800px", margin: "50px auto" }}>
      <h1>🧾 Invoice</h1>
      <p>Order ID: {invoice.order_id}</p>
      <p>Date: {invoice.date}</p>

      <hr />

      {invoice.items.map((item, index) => (
        <div key={index} style={{ marginBottom: "15px" }}>
          <strong>{item.name}</strong>
          <p>₹{item.price} × {item.quantity}</p>
          <p>Subtotal: ₹{item.subtotal}</p>
        </div>
      ))}

      <hr />
      <h2>Total: ₹{invoice.total}</h2>
    </div>
  );
}
