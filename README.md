# GoCart - A Multi-Vendor E-Commerce Platform

![Project Banner or Screenshot](https://via.placeholder.com/1200x600.png?text=GoCart+Marketplace)

GoCart is a complete, feature-rich multi-vendor e-commerce marketplace built using the latest web technologies. It provides a seamless platform for customers to shop, sellers to manage their stores, and administrators to oversee the entire operation.

The application is designed with three distinct user roles in mind:
1.  **Customers:** Can browse products from various stores, manage their cart, place orders, and review products.
2.  **Sellers:** Can apply to open a store, and once approved by an admin, can add/manage products, view their sales dashboard, and fulfill orders.
3.  **Admins:** Have full control over the platform, including approving new stores, managing site-wide coupons, and viewing analytics.

---

## ✨ Features

### 🛒 For Customers
- **Product Discovery:** Browse products by category or search.
- **Multi-Vendor Shopping:** View products from different seller storefronts (`/shop/[username]`).
- **Shopping Cart:** Add, remove, and update product quantities.
- **Secure Checkout:** Integrated with **Stripe** for reliable payments.
- **Order History:** View past orders and their statuses.
- **Product Ratings:** Leave reviews and ratings on purchased items.
- **Address Management:** Save and manage shipping addresses.

### 🏪 For Sellers
- **Store Creation:** A simple form to apply for a seller account.
- **Seller Dashboard:** A dedicated interface (`/store`) to manage store operations.
- **Product Management:** Add, edit, and remove products. Toggle product stock status.
- **Order Management:** View and manage incoming orders for their store.
- **Sales Analytics:** Visualize sales data with charts on the dashboard.
- **AI-Powered Tools:** Leverage **OpenAI** to generate product descriptions or other content.

### ⚙️ For Admins
- **Admin Dashboard:** A protected, central hub (`/admin`) for site management.
- **Store Approval System:** Review and approve/reject new seller applications.
- **Coupon Management:** Create, view, and manage promotional coupons.
- **Platform Analytics:** Get an overview of platform-wide sales, new users, and stores.
- **User & Store Management:** View all registered stores and their statuses.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **Database ORM:** [Prisma](https://www.prisma.io/)
- **Database:** PostgreSQL (compatible with NeonDB, Vercel Postgres, etc.)
- **Authentication:** [Clerk](https://clerk.com/)
- **Payments:** [Stripe](https://stripe.com/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** [Redux Toolkit](https://redux-toolkit.js.org/)
- **Background Jobs:** [Inngest](https://www.inngest.com/) for handling tasks like email notifications.
- **AI Integration:** [OpenAI API](https://openai.com/)
- **Image Handling:** [ImageKit](https://imagekit.io/) for image optimization and CDN.
- **API Communication:** Axios & SWR for data fetching.

---

## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- A PostgreSQL database instance

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/gocart.git
    cd gocart
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:
    ```sh
    cp .env.example .env
    ```
    Then, fill in the required values for your database, Clerk, Stripe, OpenAI, and other services.

4.  **Push the database schema:**
    This command will sync your Prisma schema with your database.
    ```sh
    npx prisma db push
    ```

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

---

## 🔑 Environment Variables

You will need to set the following environment variables in your `.env` file:

```env
# Prisma
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Stripe Payments
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Inngest
INNGEST_EVENT_KEY=

# OpenAI
OPENAI_API_KEY=

# ImageKit
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=

# Your Site URL
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
