from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from extensions import db
from models import Product, User
import os

product_bp = Blueprint("products", __name__)

# ----------------------------------------------------
# SEED SAMPLE PRODUCTS (ONE TIME)
# ----------------------------------------------------
@product_bp.route("/seed-products")
def seed_products():
    if Product.query.first():
        return {"message": "Products already added"}

    products = [
        Product(
            name="Fresh Cow Milk",
            price=60,
            unit="1 Litre",
            stock=100,
            image="/uploads/milk.png"
        ),
        Product(
            name="Desi Ghee",
            price=550,
            unit="500 gm",
            stock=50,
            image="/uploads/ghee.png"
        ),
        Product(
            name="Fresh Curd",
            price=80,
            unit="500 gm",
            stock=80,
            image="/uploads/curd.png"
        )
    ]

    db.session.bulk_save_objects(products)
    db.session.commit()

    return {"message": "Products added successfully"}


# ----------------------------------------------------
# GET ALL PRODUCTS (PUBLIC)
# ----------------------------------------------------
@product_bp.route("/products", methods=["GET"])
def get_products():
    products = Product.query.all()

    return jsonify([
        {
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "unit": p.unit,
            "stock": p.stock,
            "image": p.image
        }
        for p in products
    ])


# ----------------------------------------------------
# ADMIN ADD PRODUCT (WITH IMAGE UPLOAD)
# ----------------------------------------------------
@product_bp.route("/products", methods=["POST"])
@jwt_required()
def add_product():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    name = request.form.get("name")
    price = request.form.get("price")
    unit = request.form.get("unit")
    stock = request.form.get("stock")

    image_file = request.files.get("image")
    image_path = None

    if image_file:
        filename = secure_filename(image_file.filename)
        upload_folder = current_app.config["UPLOAD_FOLDER"]

        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        full_path = os.path.join(upload_folder, filename)
        image_file.save(full_path)

        # ✅ Correct path
        image_path = f"/uploads/{filename}"

    product = Product(
        name=name,
        price=price,
        unit=unit,
        stock=stock,
        image=image_path
    )

    db.session.add(product)
    db.session.commit()

    return jsonify({"message": "Product added successfully"}), 201


# ----------------------------------------------------
# UPDATE PRODUCT
# ----------------------------------------------------
@product_bp.route("/products/<int:id>", methods=["PUT"])
@jwt_required()
def update_product(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    product = Product.query.get_or_404(id)

    product.name = request.form.get("name")
    product.price = request.form.get("price")
    product.unit = request.form.get("unit")
    product.stock = request.form.get("stock")

    image_file = request.files.get("image")

    if image_file:
        filename = secure_filename(image_file.filename)
        upload_folder = current_app.config["UPLOAD_FOLDER"]

        full_path = os.path.join(upload_folder, filename)
        image_file.save(full_path)

        # ✅ Correct path
        product.image = f"/uploads/{filename}"

    db.session.commit()

    return jsonify({"message": "Product updated successfully"})


# ----------------------------------------------------
# DELETE PRODUCT
# ----------------------------------------------------
@product_bp.route("/products/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_product(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    product = Product.query.get_or_404(id)

    db.session.delete(product)
    db.session.commit()

    return jsonify({"message": "Product deleted successfully"})


from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from extensions import db
from models import Product, User
import os

product_bp = Blueprint("products", __name__)

# ----------------------------------------------------
# SEED SAMPLE PRODUCTS (ONE TIME)
# ----------------------------------------------------
@product_bp.route("/seed-products")
def seed_products():
    if Product.query.first():
        return {"message": "Products already added"}

    products = [
        Product(
            name="Fresh Cow Milk",
            price=60,
            original_price=70,
            discount_percent=14,
            unit="1 Litre",
            stock=100,
            image="/uploads/milk.png"
        ),
        Product(
            name="Desi Ghee",
            price=450,
            original_price=560,
            discount_percent=20,
            unit="500 gm",
            stock=50,
            image="/uploads/ghee.png"
        ),
        Product(
            name="Fresh Curd",
            price=70,
            original_price=80,
            discount_percent=12,
            unit="500 gm",
            stock=80,
            image="/uploads/curd.png"
        )
    ]

    db.session.bulk_save_objects(products)
    db.session.commit()

    return {"message": "Products added successfully"}


# ----------------------------------------------------
# GET ALL PRODUCTS (PUBLIC)
# ----------------------------------------------------
@product_bp.route("/products", methods=["GET"])
def get_products():
    products = Product.query.all()

    return jsonify([
        {
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "original_price": p.original_price,
            "discount_percent": p.discount_percent,
            "unit": p.unit,
            "stock": p.stock,
            "image": p.image
        }
        for p in products
    ])


# ----------------------------------------------------
# ADMIN ADD PRODUCT (WITH IMAGE UPLOAD)
# ----------------------------------------------------
@product_bp.route("/products", methods=["POST"])
@jwt_required()
def add_product():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    name = request.form.get("name")
    price = float(request.form.get("price", 0))
    original_price = float(request.form.get("original_price", price))
    unit = request.form.get("unit")
    stock = int(request.form.get("stock", 0))

    # Auto calculate discount %
    discount_percent = 0
    if original_price > price:
        discount_percent = round(
            ((original_price - price) / original_price) * 100
        )

    image_file = request.files.get("image")
    image_path = None

    if image_file:
        filename = secure_filename(image_file.filename)
        upload_folder = current_app.config["UPLOAD_FOLDER"]

        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        full_path = os.path.join(upload_folder, filename)
        image_file.save(full_path)

        image_path = f"/uploads/{filename}"

    product = Product(
        name=name,
        price=price,
        original_price=original_price,
        discount_percent=discount_percent,
        unit=unit,
        stock=stock,
        image=image_path
    )

    db.session.add(product)
    db.session.commit()

    return jsonify({"message": "Product added successfully"}), 201


# ----------------------------------------------------
# UPDATE PRODUCT
# ----------------------------------------------------
@product_bp.route("/products/<int:id>", methods=["PUT"])
@jwt_required()
def update_product(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    product = Product.query.get_or_404(id)

    product.name = request.form.get("name")
    product.price = float(request.form.get("price", product.price))
    product.original_price = float(
        request.form.get("original_price", product.original_price)
    )
    product.unit = request.form.get("unit")
    product.stock = int(request.form.get("stock", product.stock))

    # Recalculate discount
    if product.original_price > product.price:
        product.discount_percent = round(
            ((product.original_price - product.price) /
             product.original_price) * 100
        )
    else:
        product.discount_percent = 0

    image_file = request.files.get("image")

    if image_file:
        filename = secure_filename(image_file.filename)
        upload_folder = current_app.config["UPLOAD_FOLDER"]

        full_path = os.path.join(upload_folder, filename)
        image_file.save(full_path)

        product.image = f"/uploads/{filename}"

    db.session.commit()

    return jsonify({"message": "Product updated successfully"})


# ----------------------------------------------------
# DELETE PRODUCT
# ----------------------------------------------------
@product_bp.route("/products/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_product(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != "admin":
        return jsonify({"error": "Admin access required"}), 403

    product = Product.query.get_or_404(id)

    db.session.delete(product)
    db.session.commit()

    return jsonify({"message": "Product deleted successfully"})

@product_bp.route("/products/<int:id>/stock", methods=["PUT"])
@jwt_required()
def update_stock(id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or user.role != "admin":
        return jsonify({"message": "Admin access required"}), 403

    product = Product.query.get_or_404(id)

    data = request.get_json()

    if not data or "stock" not in data:
        return jsonify({"message": "Stock value required"}), 400

    try:
        new_stock = int(data["stock"])

        if new_stock < 0:
            return jsonify({"message": "Stock cannot be negative"}), 400

        product.stock = new_stock
        db.session.commit()

    except (ValueError, TypeError):
        return jsonify({"message": "Invalid stock value"}), 400

    return jsonify({
        "message": "Stock updated successfully",
        "product": {
            "id": product.id,
            "name": product.name,
            "stock": product.stock,
            "price": product.price,
            "original_price": product.original_price,
            "discount_percent": product.discount_percent
        }
    })
