import os
from flask import Flask, send_from_directory, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from extensions import db


def create_app():
    app = Flask(__name__, static_folder="static")

    # ==========================
    # BASE DIRECTORY
    # ==========================
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    db_path = os.path.join(BASE_DIR, "desi_farms.db")
    upload_folder = os.path.join(BASE_DIR, "static", "uploads")

    # ==========================
    # CONFIGURATION
    # ==========================
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + db_path
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = "jwt-secret"
    app.config["UPLOAD_FOLDER"] = upload_folder

    # ==========================
    # CORS CONFIG (CORRECT ✅)
    # ==========================
    CORS(
        app,
        resources={
            r"/api/*": {
                "origins": [
                    "http://localhost:3000",
                    "http://127.0.0.1:3000"
                ]
            }
        },
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

    # ==========================
    # INIT EXTENSIONS
    # ==========================
    db.init_app(app)
    jwt = JWTManager(app)

    # 🔥 Prevent JWT redirect issues
    @jwt.unauthorized_loader
    def unauthorized_callback(callback):
        return jsonify({"message": "Missing or invalid token"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(callback):
        return jsonify({"message": "Invalid token"}), 401

    # ==========================
    # CREATE UPLOAD FOLDER
    # ==========================
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    # ==========================
    # REGISTER BLUEPRINTS
    # ==========================
    from routes.auth import auth_bp
    from routes.products import product_bp
    from routes.cart import cart_bp
    from routes.orders import order_bp
    from routes.offer_routes import offer_bp
    from routes.wishlist import wishlist_bp

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(product_bp, url_prefix="/api")
    app.register_blueprint(cart_bp, url_prefix="/api")
    app.register_blueprint(order_bp, url_prefix="/api")
    app.register_blueprint(offer_bp, url_prefix="/api")
    app.register_blueprint(wishlist_bp, url_prefix="/api/wishlist")

    # ==========================
    # SERVE UPLOADED IMAGES
    # ==========================
    @app.route("/uploads/<filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    @app.route('/')
    def serve():
        return send_from_directory('static', 'index.html')

    # ==========================
    # CREATE DATABASE TABLES
    # ==========================
    with app.app_context():
        db.create_all()
        print("✅ Database tables created")
        print("📁 Database location:", db_path)

    return app


# ==========================
# RUN APP
# ==========================
app = create_app()

if __name__ == "__main__":
    app.run()