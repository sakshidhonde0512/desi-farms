from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import Wishlist, Product

wishlist_bp = Blueprint("wishlist", __name__)

# ===========================
# ADD TO WISHLIST
# POST /api/wishlist/<product_id>
# ===========================
@wishlist_bp.route("/<int:product_id>", methods=["POST"])
@jwt_required()
def add_to_wishlist(product_id):
    user_id = get_jwt_identity()

    # ✅ Check if product exists
    product = db.session.get(Product, product_id) if hasattr(db.session, "get") else Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found"}), 404

    # ✅ Prevent duplicates
    existing = Wishlist.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        return jsonify({"message": "Already in wishlist"}), 400

    item = Wishlist(user_id=user_id, product_id=product_id)
    db.session.add(item)
    db.session.commit()

    return jsonify({
        "message": "Added to wishlist",
        "wishlist_id": item.id,
        "product_id": product_id
    }), 201


# ===========================
# GET WISHLIST
# GET /api/wishlist/
# ===========================
@wishlist_bp.route("/", methods=["GET"])
@jwt_required()
def get_wishlist():
    user_id = get_jwt_identity()

    # ✅ Latest first
    items = Wishlist.query.filter_by(user_id=user_id).order_by(Wishlist.id.desc()).all()

    result = []
    for item in items:
        product = item.product  # relationship
        if not product:
            continue

        result.append({
            "wishlist_id": item.id,
            "product_id": product.id,
            "name": product.name,
            "price": product.price,
            "stock": product.stock,
            "image": product.image
        })

    return jsonify(result), 200


# ===========================
# REMOVE FROM WISHLIST
# DELETE /api/wishlist/<wishlist_id>
# ===========================
@wishlist_bp.route("/<int:wishlist_id>", methods=["DELETE"])
@jwt_required()
def remove_from_wishlist(wishlist_id):
    user_id = get_jwt_identity()

    item = Wishlist.query.filter_by(id=wishlist_id, user_id=user_id).first()
    if not item:
        return jsonify({"message": "Item not found"}), 404

    db.session.delete(item)
    db.session.commit()

    return jsonify({"message": "Removed from wishlist"}), 200