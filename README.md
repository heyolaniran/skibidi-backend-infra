# ⚡ Skibidi Breez Infra ⚡

Welcome to the Skibidi Breez Infra ! This is a powerful Express.js server that lets you create and pay Lightning and on-chain Bitcoin invoices using the Breez Liquid SDK. It's a nodeless, self-custodial solution for seamless Bitcoin payments.

## ✨ Features

-   **Create Lightning Invoices:** Generate BOLT 11 and BOLT 12 invoices.
-   **On-Chain Transactions:** Receive Bitcoin directly to an on-chain address.
-   **Pay Invoices:** Pay any BOLT 11, BOLT 12, or Bitcoin address.
-   **Health Check:** A simple endpoint to check the status of your Breez SDK connection.
-   **Stylish Logging:** Colorful, NestJS-style console logs for easy debugging.

## 🛠️ Setup

Getting started is easy. Just follow these steps:

1.  **Prerequisites:**
    *   Node.js (v16 or later)
    *   A Breez API key (get one [here](https://breez.technology/request-api-key/))
    *   A 12-word mnemonic seed phrase from a Breez wallet. DO NOT LEAK IT EVER !! ⚠️ Just Keep a small balance on this wallet and make sure to withdraw to another wallet.
2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Create `.env` File:**
    Create a `.env` file in the project root and add your credentials:
    ```
    BREEZ_API_KEY="YOUR_BREEZ_API_KEY"
    BREEZ_MNEMONIC="your twelve word breez mnemonic seed phrase here"
    ```

## 🚀 Running the API

To start the server in development mode (with auto-reloading), run:

```bash
npm run dev
```

For production, use:

```bash
npm start
```

The API will be running at `http://localhost:3000`.

## 📝 API Endpoints

### `GET /health`

Check the health of the service and your wallet balance.

### `POST /create-invoice`

Create a standard BOLT 11 Lightning invoice.

**Body:**
```json
{
  "amountMsat": 10000,
  "description": "Invoice for a coffee"
}
```

### `POST /bolt12/create-invoice`

Create a BOLT 12 offer.

**Body:**
```json
{
  "amountMsat": 25000,
  "description": "Donation"
}
```

### `POST /receive-onchain`

Get a Bitcoin address for on-chain payments.

**Body:**
```json
{
  "amountMsat": 50000,
  "description": "On-chain payment"
}
```

### `POST /pay-invoice`

Pay any BOLT 11, BOLT 12, or Bitcoin address.

**Body:**
```json
{
  "destination": "lnbc... or bc1...",
  "amountMsat": 10000 // Required for BOLT 12 and on-chain
}
```

## 🏗️ Architecture

This project follows a standard Model-View-Controller (MVC)-like pattern, separating concerns to improve maintainability and scalability.

-   **`index.js`**: The main entry point of the application. It initializes the Express server, connects to the Breez service, and mounts the API routes.
-   **`services/`**: Contains the business logic.
    -   `breez.service.js`: A singleton service that encapsulates all interactions with the Breez SDK. It handles SDK initialization, state management, and provides methods for creating/paying invoices and managing wallet information.
-   **`controllers/`**: Handles the request/response cycle.
    -   `invoice.controller.js`: Receives API requests, calls the appropriate methods on the `BreezService`, and sends back a formatted response to the client.
-   **`routes/`**: Defines the API endpoints.
    -   `invoice.routes.js`: Maps the HTTP routes (e.g., `/health`, `/create-invoice`) to their corresponding controller functions.
-   **`listeners/`**: Handles asynchronous events.
    -   `listen.js`: Contains the event listener for the Breez SDK, which logs SDK events to the console and a file.

This structure ensures that the core business logic (`BreezService`) is decoupled from the web layer (controllers and routes), making the application easier to test, debug, and extend.

## 📚 API Documentation

This project uses Swagger to provide interactive API documentation. Once the server is running, you can access the documentation by navigating to [/api-docs](http://localhost:3000/api-docs) in your browser.

The documentation is automatically generated from the JSDoc comments in the `routes/` files, so it will always be up-to-date with the latest API changes.

## 📜 Logging

This API uses a NestJS-style logger for clear and informative console output. All events from the Breez SDK are also logged to `events.log` in JSON format for easy analysis.

---
