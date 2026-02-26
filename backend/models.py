from extensions import db
from datetime import datetime

# ---------------- ORDER ----------------
class Order(db.Model):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    total_amount = db.Column(db.Float, nullable=False)

    status = db.Column(db.String(50), default="Pending")

    # ✅ Billing / Shipping Details (for invoice PDF)
    customer_name = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    address = db.Column(db.String(255))
    city = db.Column(db.String(80))
    pincode = db.Column(db.String(12))
    payment_method = db.Column(db.String(50), default="Cash on Delivery")

    # ✅ Optional invoice number (pretty invoice formatting)
    invoice_no = db.Column(db.String(50), unique=True)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    # Relationship with OrderItem
    items = db.relationship(
        "OrderItem",
        backref="order",
        lazy=True,
        cascade="all, delete-orphan"
    )


# ---------------- ORDER ITEM ----------------
class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)

    order_id = db.Column(
        db.Integer,
        db.ForeignKey("orders.id"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False
    )

    quantity = db.Column(db.Integer, nullable=False)
    price = db.Column(db.Float, nullable=False)

    # ✅ Easy access to product details in invoice
    product = db.relationship("Product", lazy=True)


# ---------------- USER ----------------
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default="user")

    carts = db.relationship("Cart", backref="user", lazy=True)
    orders = db.relationship("Order", backref="user", lazy=True)


# ---------------- PRODUCT ----------------
class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Integer, nullable=False)
    original_price = db.Column(db.Float)
    discount_percent = db.Column(db.Integer, default=0)
    unit = db.Column(db.String(50))
    stock = db.Column(db.Integer, default=0)
    image = db.Column(db.String(200))

    # ✅ Category for filtering
    category = db.Column(db.String(60), default="Dairy")

    carts = db.relationship("Cart", backref="product", lazy=True)


# ---------------- WISHLIST ----------------
class Wishlist(db.Model):
    __tablename__ = "wishlist"

    id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )

    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False
    )

    created_at = db.Column(
        db.DateTime,
        default=db.func.current_timestamp()
    )

    product = db.relationship("Product", backref="wishlist_items")


# ---------------- CART ----------------
class Cart(db.Model):
    __tablename__ = "carts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id"),
        nullable=False
    )
    product_id = db.Column(
        db.Integer,
        db.ForeignKey("products.id"),
        nullable=False
    )
    quantity = db.Column(db.Integer, nullable=False, default=1)


# ---------------- OFFER ----------------
class Offer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    discount_type = db.Column(db.String(20))  # percentage or flat
    discount_value = db.Column(db.Float)
    min_amount = db.Column(db.Float)
    expiry_date = db.Column(db.DateTime)
    active = db.Column(db.Boolean, default=True)