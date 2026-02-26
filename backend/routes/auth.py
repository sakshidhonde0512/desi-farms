from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from extensions import db
from models import User
import re

auth_bp = Blueprint("auth", __name__)

# ==================================================
# 🔐 REGISTER
# ==================================================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    if not data:
        return jsonify({"message": "Invalid request"}), 400

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")
    role = data.get("role", "parent")

    # ✅ Required field validation
    if not name or not email or not password or not confirm_password:
        return jsonify({"message": "All fields are required"}), 400

    email = email.strip().lower()

    # ✅ Strong Password Validation
    password_pattern = re.compile(
        r"(?=.*[@$!%*?&])"     # at least one special character
        r"[A-Za-z\d@$!%*?&]{8,}$"  # minimum 8 characters
    )

    if not password_pattern.match(password):
        return jsonify({
            "message": "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
        }), 400

    # ✅ Check password match
    if password != confirm_password:
        return jsonify({"message": "Passwords do not match"}), 400

    # ✅ Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "User already exists"}), 400

    # ✅ Create user
    new_user = User(
        name=name.strip(),
        email=email,
        password=generate_password_hash(password),
        role=role
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "User registered successfully"
    }), 201


# ==================================================
# 🔐 LOGIN
# ==================================================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()

    if not data:
        return jsonify({"message": "Invalid request"}), 400

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    email = email.strip().lower()

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid email or password"}), 401

    # 🔥 JWT identity MUST be string
    access_token = create_access_token(identity=str(user.id))

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }), 200
