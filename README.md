# Kashvi Creations 🛍️

A full-stack e-commerce platform for ethnic wear and sarees, built with React, Node.js, MongoDB, and Vercel Blob. Features a customer-facing storefront, a dedicated admin panel, Razorpay payments, OTP-based authentication, and an optional Kafka event pipeline for order processing and inventory management.

---

## Live Demo

| App | URL |
|---|---|
| Frontend (Storefront) | https://kashvi-creations-mvli.vercel.app |

---

## Features

### Storefront (Frontend)
- **Product catalogue** with filtering by category, subcategory, price, and color
- **Search** across all products in real time
- **Product detail page** with size selector, color picker, stock awareness, and image gallery
- **Wishlist** — save products for later, persisted across sessions
- **Cart** with quantity controls and size selection
- **Checkout** with full address form and two payment options:
  - Cash on Delivery (COD)
  - Razorpay (UPI, cards, net banking)
- **Order history** page for logged-in users
- **OTP-based email verification** on signup (via Nodemailer + Gmail)
- **JWT authentication** with tokens stored in localStorage
- **Fully responsive** — mobile, tablet, desktop

### Admin Panel
- **Add products** — upload images directly to Vercel Blob CDN; URLs stored in MongoDB
- **Product list** — view all products with image thumbnails, price, category, and per-size stock
- **Delete products** with confirmation
- **Order management** — view all orders with customer address, items, payment method, and status
- **Update order status** — Order Placed → Packing → Shipped → Out for Delivery → Delivered (triggers Kafka event + customer email when Kafka is enabled)

### Backend API
- RESTful Express API with route-level middleware
- **Vercel Blob** for image storage (public CDN URLs)
- **Razorpay** order creation and HMAC signature verification
- **Nodemailer** for transactional emails (OTP signup, order confirmation, status updates)
- **Kafka integration** (optional) — event-driven pipeline for order and inventory processing
- Graceful Kafka shutdown on SIGINT (local dev only)

### Kafka Event Pipeline (optional)
When `ENABLE_KAFKA=true`, the backend becomes event-driven:

| Event | Produced by | Consumed by | Effect |
|---|---|---|---|
| `order-created` | Order controller (COD + Razorpay) | Order handler | Confirms order in DB, sends confirmation email to customer |
| `payment-processed` | Order controller (Razorpay verify) | Payment handler | Updates payment status, triggers `inventory-update` |
| `inventory-update` | Payment handler | Inventory handler | Reduces stock per size for each ordered item |
| `order-status-update` | Order controller (admin update) | Order handler | Updates order status in DB, sends status email to customer |

Retry logic: each handler retries up to 3 times with exponential backoff before logging a dead-letter warning.

When `ENABLE_KAFKA=false` (default), all order flows work synchronously — no Kafka required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router v7, Axios |
| Admin | React 19, Vite, Tailwind CSS v4, React Router v7, Axios |
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Auth | JWT, bcrypt, OTP via Nodemailer |
| Payments | Razorpay |
| Image storage | Vercel Blob |
| Event streaming | Apache Kafka (KafkaJS) — optional |
| Deployment | Vercel (frontend, admin, backend as separate projects) |

---

## Project Structure

```
Kashvi_Creations/
├── frontend/          # Customer storefront (React + Vite)
│   ├── src/
│   │   ├── pages/     # Home, Collection, Product, Cart, Orders, Wishlist, etc.
│   │   ├── components/# Navbar, Footer, Hero, BestSeller, Slider, etc.
│   │   ├── context/   # ShopContext — cart, products, auth state
│   │   └── assets/    # Images, videos
│   └── vercel.json
│
├── admin/             # Admin dashboard (React + Vite)
│   ├── src/
│   │   ├── pages/     # Add, List, Orders
│   │   └── components/# Navbar, Sidebar, Login
│   └── vercel.json
│
└── backend/           # Express API
    ├── config/        # MongoDB + Kafka connection
    ├── controllers/   # User, Product, Cart, Order
    ├── handlers/      # Kafka event handlers (order, payment, inventory)
    ├── middleware/     # Auth (user + admin), Multer
    ├── models/        # User, Product, Order schemas
    ├── routes/        # API routes
    ├── services/      # Kafka producer/consumer, image upload
    └── utils/         # Email service (Nodemailer)
```

---

## Running Locally

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas URI)
- A Gmail account for transactional emails (with App Password)
- Razorpay account (test mode keys are fine)
- Vercel Blob store (or set `STORAGE_TYPE=local` to skip Blob)
- Apache Kafka (only if you want `ENABLE_KAFKA=true`)

### 1. Clone the repo

```bash
git clone https://github.com/pro-jain/Kashvi_Creations.git
cd Kashvi_Creations
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:

```env
# Server
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/kashvi
# or Atlas: mongodb+srv://<user>:<password>@cluster.mongodb.net/kashvi

# JWT
JWT_SECRET=your_jwt_secret_here
ADMIN_EMAIL=admin@kashvi.com
ADMIN_PASSWORD=yourAdminPassword

# Email (Gmail + App Password)
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Image Storage
STORAGE_TYPE=local
# For Vercel Blob (production):
# STORAGE_TYPE=vercel-blob
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxx

# CORS — comma-separated list of allowed frontend origins
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Kafka (optional — set to false to skip entirely)
ENABLE_KAFKA=false
# If true, also set:
# KAFKA_BROKERS=localhost:9092
```

Start the backend:

```bash
npm run dev     # uses nodemon
# or
node server.js
```

Backend runs at `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd ../frontend
npm install
```

Create `.env` in `/frontend`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

```bash
npm run dev
```

Storefront runs at `http://localhost:5173`.

### 4. Set up the admin panel

```bash
cd ../admin
npm install
```

Create `.env` in `/admin`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

```bash
npm run dev
```

Admin panel runs at `http://localhost:5174`.

---

## Gmail App Password Setup

Gmail blocks plain password auth. You need an App Password:

1. Go to your Google Account → Security → 2-Step Verification (enable if off)
2. Search "App passwords" → generate one for "Mail"
3. Use the 16-character code as `EMAIL_PASSWORD` in your `.env`

---

## Razorpay Setup

1. Sign up at [razorpay.com](https://razorpay.com) → go to Settings → API Keys
2. Generate test mode keys
3. Copy `Key ID` → `RAZORPAY_KEY_ID`
4. Copy `Key Secret` → `RAZORPAY_KEY_SECRET`

In test mode, use Razorpay's [test card numbers](https://razorpay.com/docs/payments/payments/test-integration/) to simulate payments.

---

## Vercel Blob Setup (for image uploads)

1. Vercel Dashboard → Storage → Create Store → Blob
2. Name it (e.g. `kashvi-images`) → Create
3. In the store → `.env Local` tab → copy `BLOB_READ_WRITE_TOKEN`
4. Set the store to **Public** access (Settings → Access)
5. In backend `.env`: set `STORAGE_TYPE=vercel-blob` and paste the token

Without this, set `STORAGE_TYPE=local` — images are saved to `/backend/uploads/` locally (not suitable for production on Vercel since the filesystem is ephemeral).

---

## Kafka Setup (optional)

Kafka is entirely optional. When `ENABLE_KAFKA=false`, all order flows (confirmation, inventory updates, status emails) still work synchronously.

To enable Kafka locally:

### Using Docker (recommended)

```bash
docker-compose up -d
```

Add a `docker-compose.yml` in the repo root:

```yaml
version: '3'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on: [zookeeper]
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
```

Then in backend `.env`:

```env
ENABLE_KAFKA=true
KAFKA_BROKERS=localhost:9092
```

### Kafka topics created automatically

The producer is configured with `allowAutoTopicCreation: true`, so these topics are created on first use:

- `order-created`
- `payment-processed`
- `inventory-update`
- `order-status-update`

### Event flow with Kafka enabled

```
Customer places COD order
  → backend publishes order-created
    → consumer confirms order in DB
    → consumer sends confirmation email to customer

Customer pays via Razorpay
  → backend verifies signature → publishes payment-processed
    → consumer updates payment status
    → consumer publishes inventory-update
      → consumer reduces stock for each item/size
  → backend also publishes order-created
    → consumer sends confirmation email

Admin updates order status
  → backend publishes order-status-update
    → consumer updates status in DB
    → consumer sends status update email to customer
```

---

## Deployment on Vercel

Three separate Vercel projects — one per folder.

| Project | Root Directory | Framework |
|---|---|---|
| Frontend | `frontend` | Vite |
| Admin | `admin` | Vite |
| Backend | `backend` | Node.js (`@vercel/node`) |

Each project needs its own environment variables set in the Vercel dashboard (Settings → Environment Variables). Copy the variables from your local `.env` files.

> **Note:** Kafka is not supported on Vercel's serverless runtime. Keep `ENABLE_KAFKA=false` in production. All order flows work without it.

---

## API Reference

### Auth (`/api/user`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/register` | Register with OTP email verification |
| POST | `/verify-otp` | Verify OTP and create account |
| POST | `/login` | Login, returns JWT |

### Products (`/api/product`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/list` | — | Get all products |
| POST | `/single` | — | Get one product by ID |
| POST | `/add` | Admin | Add product (with Blob URLs) |
| POST | `/remove` | Admin | Delete product |

### Orders (`/api/order`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/place` | User | Place order (COD or Razorpay) |
| POST | `/verify-razorpay` | User | Verify Razorpay payment signature |
| GET | `/list` | Admin | Get all orders |
| POST | `/userorders` | User | Get logged-in user's orders |
| POST | `/status` | Admin | Update order status |

### Upload (`/api/upload`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Admin | Upload images to Vercel Blob, returns URLs |
| GET | `/status` | — | Check current storage type |

### Cart (`/api/cart`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/add` | User | Add item to cart |
| POST | `/update` | User | Update cart item quantity |
| POST | `/get` | User | Get user's cart |

---
### Frontend & Admin

| Variable | Required | Description |
|---|---|---|
| `VITE_BACKEND_URL` | ✅ | Backend base URL (no trailing slash) |

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

---

## License

MIT
