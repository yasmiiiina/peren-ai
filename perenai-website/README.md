# PEREN AI

## Project Overview
The PEREN AI project is a modern health intelligence platform aiming to create a comprehensive "Digital Twin" for its users. By aggregating health telemetry (such as genetic data, biomarker blood tests, lifestyle, and wearable device metrics), it computes a preventive risk score. This dynamic assessment serves as the foundation for providing personalized recommendations, ensuring users can transition from reactive treatments to proactive health maintenance.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS, React Router
- **Backend**: Python, FastAPI, SQLAlchemy
- **Database**: SQLite (local MVP default), PostgreSQL ready (with Alembic for migrations)
- **Authentication**: JWT & Google OAuth

## Installation Guide

### Option 1: Run with Docker (Recommended)
You can launch the entire stack using Docker Compose:
1. Clone the repository and navigate to the root directory.
2. Ensure you have Docker and Docker Compose installed.
3. Run the following command:
   ```zsh
   cp .env.example .env
   docker compose up --build
   ```
4. Access the frontend at `http://localhost:5173` and the backend API at `http://localhost:8000`.

### Option 2: Local Development Setup
#### Backend
1. Navigate to the `backend` directory.
2. Create and activate a Python virtual environment:
   ```zsh
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. Install dependencies:
   ```zsh
   pip install -r requirements.txt
   ```
4. Setup environment variables:
   ```zsh
   cp .env.example .env
   ```
5. Run the server (auto-creates local SQLite DB):
   ```zsh
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

#### Frontend
1. Navigate to the `frontend` directory.
2. Install Node modules:
   ```zsh
   npm install
   ```
3. Setup environment variables:
   ```zsh
   cp .env.example .env
   ```
4. Start the development server:
   ```zsh
   npm run dev
   ```

## Payment Integration
We utilize **Payzone** as our secure payment gateway to unlock the Premium Dashboard Layer. The flow works as follows:
1. **Initialization**: The user selects a subscription tier in `PremiumSubscription` (`/pricing`) on the frontend.
2. **Server Handshake**: The React client hits our FastAPI backend (`/api/payments/initialize`), which calculates an HMAC-SHA256 signature combining the payload and `PAYZONE_SECRET_KEY`.
3. **Redirect**: The backend returns a secure `payment_url`. The frontend redirects the user to the Payzone checkout page.
4. **Webhook/Callback**: Once the payment is processed, Payzone sends a server-to-server callback to our webhook (`/payments/callback`) where the signature is verified and the user's `is_premium` and `payment_status` flags are updated in the database.
5. **Completion**: The user is sent back to `/payment/success` or `/payment/failure` where their session context is refreshed.

## Environment Variables
Here is the list of `.env` variables required to run the application securely. Make sure never to commit actual secrets into version control.

### Backend (`backend/.env`)
- `DATABASE_URL`: Connection string (e.g., `sqlite:///./perenai.db`)
- `SECRET_KEY`: Very long random string used for JWT signing. **KEEP SECRET.**
- `ALGORITHM`: JWT Algorithm (default `HS256`)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Expiration time for JWT
- `FRONTEND_ORIGIN`: URL for the frontend (e.g., `http://localhost:5173`)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: OAuth credentials for Google Login
- `PAYZONE_MERCHANT_ID`: Your Payzone Merchant ID
- `PAYZONE_SECRET_KEY`: Secret key for signing Payzone requests. **KEEP SECRET.**
- `PAYZONE_BASE_URL`: Payzone base payment endpoint
- `PAYZONE_CALLBACK_URL`: Webhook URL hit by Payzone (must be accessible from the internet)
- `PAYZONE_RETURN_SUCCESS_URL` / `PAYZONE_RETURN_FAILURE_URL`: Redirect URLs post-payment

### Frontend (`frontend/.env`)
- `VITE_API_URL`: The URL pointing to the FastAPI backend (default `http://localhost:8000`)
