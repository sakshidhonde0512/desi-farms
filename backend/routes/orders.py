from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from extensions import db
from models import Cart, Product, Order, User, OrderItem
from datetime import datetime
import io

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm

order_bp = Blueprint("orders", __name__)


# ---------------- PLACE ORDER ----------------
# POST /api/orders/place
@order_bp.route("/orders/place", methods=["POST"])
@jwt_required()
def place_order():
    user_id = int(get_jwt_identity())
    cart_items = Cart.query.filter_by(user_id=user_id).all()

    if not cart_items:
        return jsonify({"error": "Cart is empty"}), 400

    data = request.get_json() or {}

    # ✅ Billing details (optional but recommended for invoice)
    customer_name = data.get("customer_name")
    phone = data.get("phone")
    address = data.get("address")
    city = data.get("city")
    pincode = data.get("pincode")
    payment_method = data.get("payment_method", "Cash on Delivery")

    # ✅ calculate total + check stock
    total = 0.0
    for item in cart_items:
        product = Product.query.get(item.product_id)
        if not product:
            return jsonify({"error": "Some product is missing"}), 400

        if item.quantity > product.stock:
            return jsonify({"error": f"Only {product.stock} left for {product.name}"}), 400

        total += float(product.price) * int(item.quantity)

    # ✅ Create order
    # invoice_no example: DF-20260220-000123
    invoice_no = f"DF-{datetime.utcnow().strftime('%Y%m%d')}-{str(user_id).zfill(6)}-{int(datetime.utcnow().timestamp())}"

    new_order = Order(
        user_id=user_id,
        total_amount=total,
        status="Pending",
        customer_name=customer_name,
        phone=phone,
        address=address,
        city=city,
        pincode=pincode,
        payment_method=payment_method,
        invoice_no=invoice_no
    )

    db.session.add(new_order)
    db.session.flush()  # ✅ get new_order.id without full commit yet

    # ✅ Create order items + reduce stock
    for item in cart_items:
        product = Product.query.get(item.product_id)

        order_item = OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            quantity=item.quantity,
            price=float(product.price)
        )
        db.session.add(order_item)

        product.stock -= int(item.quantity)

    # ✅ Clear Cart
    Cart.query.filter_by(user_id=user_id).delete()

    db.session.commit()

    return jsonify({
        "message": "Order placed successfully",
        "order_id": new_order.id
    }), 201


# ---------------- USER ORDER HISTORY ----------------
# GET /api/orders
@order_bp.route("/orders", methods=["GET"])
@jwt_required()
def order_history():
    user_id = int(get_jwt_identity())
    orders = Order.query.filter_by(user_id=user_id).order_by(Order.id.desc()).all()

    return jsonify([
        {
            "id": o.id,
            "invoice_no": o.invoice_no,
            "total": float(o.total_amount),
            "status": o.status,
            "created_at": o.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for o in orders
    ]), 200


# ---------------- ADMIN UPDATE ORDER STATUS ----------------
# PUT /api/orders/<id>/status
@order_bp.route("/orders/<int:id>/status", methods=["PUT"])
@jwt_required()
def update_order_status(id):
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user or user.role != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    data = request.get_json() or {}
    order = Order.query.get(id)

    if not order:
        return jsonify({"message": "Order not found"}), 404

    new_status = data.get("status")
    if not new_status:
        return jsonify({"message": "Status is required"}), 400

    order.status = new_status
    db.session.commit()

    return jsonify({"message": "Order status updated"}), 200


# ---------------- ADMIN GET ALL ORDERS ----------------
# GET /api/orders/all
@order_bp.route("/orders/all", methods=["GET"])
@jwt_required()
def get_all_orders():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user or user.role != "admin":
        return jsonify({"message": "Unauthorized"}), 403

    orders = Order.query.order_by(Order.id.desc()).all()

    result = []
    for order in orders:
        result.append({
            "id": order.id,
            "invoice_no": order.invoice_no,
            "user_id": order.user_id,
            "total": float(order.total_amount),
            "status": order.status,
            "created_at": order.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })

    return jsonify(result), 200


# ---------------- GET SINGLE ORDER (JSON INVOICE DATA) ----------------
# GET /api/orders/<order_id>
@order_bp.route("/orders/<int:order_id>", methods=["GET"])
@jwt_required()
def get_invoice(order_id):
    user_id = int(get_jwt_identity())

    order = Order.query.filter_by(id=order_id, user_id=user_id).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404

    invoice_items = []
    for item in order.items:
        product = Product.query.get(item.product_id)
        invoice_items.append({
            "name": product.name if product else "Deleted Product",
            "price": float(item.price),
            "quantity": int(item.quantity),
            "subtotal": float(item.price) * int(item.quantity)
        })

    return jsonify({
        "order_id": order.id,
        "invoice_no": order.invoice_no,
        "total": float(order.total_amount),
        "status": order.status,
        "date": order.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "customer": {
            "name": order.customer_name,
            "phone": order.phone,
            "address": order.address,
            "city": order.city,
            "pincode": order.pincode,
            "payment_method": order.payment_method
        },
        "items": invoice_items
    }), 200


# ---------------- DOWNLOAD INVOICE PDF ----------------
# GET /api/orders/<order_id>/invoice
@order_bp.route("/orders/<int:order_id>/invoice", methods=["GET"])
def download_invoice(order_id):
    # ✅ Verify JWT manually (works for file download)
    verify_jwt_in_request()
    user_id = int(get_jwt_identity())

    order = Order.query.filter_by(id=order_id, user_id=user_id).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=f"Invoice {order.invoice_no or order.id}"
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "title_style",
        parent=styles["Title"],
        fontSize=18,
        spaceAfter=6
    )

    small = ParagraphStyle(
        "small",
        parent=styles["Normal"],
        fontSize=10,
        leading=13
    )

    elements = []

    # ---------- HEADER ----------
    elements.append(Paragraph("Desi Farms", title_style))
    elements.append(Paragraph("Fresh & Organic Products", small))
    elements.append(Spacer(1, 10))

    # ---------- INVOICE META + CUSTOMER ----------
    invoice_no = order.invoice_no or f"DF-{order.id}"
    meta_left = [
        ["Invoice No:", invoice_no],
        ["Order ID:", f"#{order.id}"],
        ["Date:", order.created_at.strftime("%d-%m-%Y %H:%M")],
        ["Status:", order.status],
        ["Payment:", order.payment_method or "Cash on Delivery"],
    ]

    customer_right = [
        ["Bill To:", order.customer_name or "Customer"],
        ["Phone:", order.phone or "-"],
        ["Address:", (order.address or "-")],
        ["City / PIN:", f"{order.city or '-'} / {order.pincode or '-'}"],
    ]

    meta_table = Table(
        [[Table(meta_left, colWidths=[55*mm, 65*mm]),
          Table(customer_right, colWidths=[55*mm, 65*mm])]],
        colWidths=[90*mm, 90*mm]
    )

    meta_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.whitesmoke),
        ("BACKGROUND", (0, 0), (-1, -1), colors.whitesmoke),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))

    elements.append(meta_table)
    elements.append(Spacer(1, 14))

    # ---------- ITEMS TABLE ----------
    data = [["#", "Item", "Qty", "Unit Price (₹)", "Subtotal (₹)"]]

    grand_total = 0.0
    for idx, item in enumerate(order.items, start=1):
        product = Product.query.get(item.product_id)
        name = product.name if product else "Deleted Product"

        subtotal = float(item.price) * int(item.quantity)
        grand_total += subtotal

        data.append([
            str(idx),
            name,
            str(int(item.quantity)),
            f"{float(item.price):.2f}",
            f"{subtotal:.2f}"
        ])

    data.append(["", "", "", "Grand Total", f"₹ {grand_total:.2f}"])

    table = Table(
        data,
        colWidths=[10*mm, 80*mm, 15*mm, 30*mm, 30*mm],
        hAlign="LEFT"
    )

    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),

        ("GRID", (0, 0), (-1, -2), 0.3, colors.grey),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("ALIGN", (2, 1), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("FONTSIZE", (0, 1), (-1, -1), 10),

        # Total row styling
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.whitesmoke),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.black),
        ("SPAN", (0, -1), (3, -1)),
        ("ALIGN", (3, -1), (3, -1), "RIGHT"),
        ("ALIGN", (4, -1), (4, -1), "RIGHT"),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 18))

    elements.append(Paragraph("Thank you for shopping with Desi Farms!", small))
    elements.append(Paragraph("For support: vaishnavidivekar3012@gmail.com", small))

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"DesiFarms_Invoice_{order.id}.pdf",
        mimetype="application/pdf"
    )

# ---------------- CANCEL ORDER (USER) ----------------
# DELETE /api/orders/<order_id>/cancel
@order_bp.route("/orders/<int:order_id>/cancel", methods=["DELETE"])
@jwt_required()
def cancel_order(order_id):
    user_id = int(get_jwt_identity())

    order = Order.query.filter_by(id=order_id, user_id=user_id).first()
    if not order:
        return jsonify({"message": "Order not found"}), 404

    # ✅ Only pending can be cancelled
    if order.status != "Pending":
        return jsonify({"message": "Only Pending orders can be cancelled"}), 400

    # ✅ Mark cancelled
    order.status = "Cancelled"

    # ✅ OPTIONAL: Restock items (recommended)
    for item in order.items:
        product = Product.query.get(item.product_id)
        if product:
            product.stock += int(item.quantity)

    db.session.commit()

    return jsonify({"message": "Order cancelled successfully"}), 200  