from flask import Blueprint, request, jsonify
from models import Offer
from extensions import db
from datetime import datetime

offer_bp = Blueprint("offer", __name__)

# Create Offer
@offer_bp.route("/create-offer", methods=["POST"])
def create_offer():
    data = request.json

    offer = Offer(
        title=data["title"],
        code=data["code"].upper(),
        discount_type=data["discount_type"],
        discount_value=data["discount_value"],
        min_amount=data.get("min_amount", 0),
        expiry_date=datetime.strptime(data["expiry_date"], "%Y-%m-%d")
    )

    db.session.add(offer)
    db.session.commit()

    return jsonify({"message": "Offer created successfully"})


# Apply Offer
@offer_bp.route("/apply-offer", methods=["POST"])
def apply_offer():
    data = request.json
    code = data.get("code").upper()
    cart_total = float(data.get("cart_total"))

    offer = Offer.query.filter_by(code=code, active=True).first()

    if not offer:
        return jsonify({"error": "Invalid offer code"}), 400

    if offer.expiry_date < datetime.utcnow():
        return jsonify({"error": "Offer expired"}), 400

    if cart_total < offer.min_amount:
        return jsonify({"error": "Minimum amount not reached"}), 400

    if offer.discount_type == "percentage":
        discount = (offer.discount_value / 100) * cart_total
    else:
        discount = offer.discount_value

    final_amount = cart_total - discount

    return jsonify({
        "discount": round(discount, 2),
        "final_amount": round(final_amount, 2)
    })
