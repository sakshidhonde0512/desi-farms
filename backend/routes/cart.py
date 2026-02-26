from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Cart, Product

cart_bp = Blueprint("cart", __name__)

# ---------------- ADD TO CART ----------------
# POST /api/cart/add
@cart_bp.route("/cart/add", methods=["POST"])
@jwt_required()
def add_to_cart():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    product_id = data.get("product_id")
    quantity = int(data.get("quantity", 1))

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    if quantity <= 0:
        return jsonify({"error": "Quantity must be greater than 0"}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    existing_item = Cart.query.filter_by(user_id=user_id, product_id=product_id).first()

    if existing_item:
        new_quantity = existing_item.quantity + quantity
        if new_quantity > product.stock:
            return jsonify({"error": f"Only {product.stock} items available in stock"}), 400
        existing_item.quantity = new_quantity
    else:
        if quantity > product.stock:
            return jsonify({"error": f"Only {product.stock} items available in stock"}), 400

        cart_item = Cart(user_id=user_id, product_id=product_id, quantity=quantity)
        db.session.add(cart_item)

    db.session.commit()
    return jsonify({"message": "Added to cart"}), 201


# ---------------- GET CART ----------------
# GET /api/cart
@cart_bp.route("/cart", methods=["GET"])
@jwt_required()
def get_cart():
    user_id = int(get_jwt_identity())
    cart_items = Cart.query.filter_by(user_id=user_id).all()

    items = []
    total = 0.0

    for item in cart_items:
        product = Product.query.get(item.product_id)
        if not product:
            continue

        subtotal = float(product.price) * int(item.quantity)
        total += subtotal

        items.append({
            "id": item.id,
            "product_id": product.id,
            "name": product.name,
            "price": float(product.price),
            "quantity": int(item.quantity),
            "subtotal": float(subtotal),
            "stock": int(product.stock),
            "image": product.image
        })

    return jsonify({"items": items, "total": float(total)}), 200


# ---------------- UPDATE QUANTITY ----------------
# PUT /api/cart/item/<item_id>
@cart_bp.route("/cart/item/<int:item_id>", methods=["PUT"])
@jwt_required()
def update_cart_item(item_id):
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    if "quantity" not in data:
        return jsonify({"error": "quantity is required"}), 400

    try:
        new_qty = int(data.get("quantity"))
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid quantity"}), 400

    if new_qty < 1:
        return jsonify({"error": "Quantity must be at least 1"}), 400

    item = Cart.query.filter_by(id=item_id, user_id=user_id).first()
    if not item:
        return jsonify({"error": "Cart item not found"}), 404

    product = Product.query.get(item.product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404

    if new_qty > product.stock:
        return jsonify({"error": f"Only {product.stock} items available in stock"}), 400

    item.quantity = new_qty
    db.session.commit()

    return jsonify({"message": "Quantity updated", "item_id": item.id, "quantity": item.quantity}), 200


# ---------------- REMOVE ITEM ----------------
# DELETE /api/cart/remove/<item_id>
@cart_bp.route("/cart/remove/<int:item_id>", methods=["DELETE"])
@jwt_required()
def remove_item(item_id):
    user_id = int(get_jwt_identity())

    item = Cart.query.filter_by(id=item_id, user_id=user_id).first()
    if not item:
        return jsonify({"error": "Item not found"}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({"message": "Item removed"}), 200


# ---------------- CLEAR CART ----------------
# DELETE /api/cart/clear
@cart_bp.route("/cart/clear", methods=["DELETE"])
@jwt_required()
def clear_cart():
    user_id = int(get_jwt_identity())

    Cart.query.filter_by(user_id=user_id).delete()
    db.session.commit()

    return jsonify({"message": "Cart cleared"}), 200