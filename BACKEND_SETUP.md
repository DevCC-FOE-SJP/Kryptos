# Backend Setup for Blockfrost API Key Proxy

This guide outlines the sequential steps to set up a Node.js backend server within your project to securely handle the Blockfrost API key. This approach enhances security by preventing the API key from being exposed in the frontend and allows for better management of API requests.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Node.js:** Version 14 or higher (recommended).
*   **npm (Node Package Manager):** Comes bundled with Node.js.
*   **Git:** For version control.

## Step-by-Step Guide

### Step 1: Create a Dedicated Directory for Your Backend

First, navigate to the root of your `Kryptos` project and create a new directory for your backend server.

1.  Open your terminal or command prompt.
2.  Navigate to your project's root directory:
    ```bash
    cd /Users/himeth/Documents/Engineering/Kryptos
    ```
3.  Create a new directory named `backend` (or `api`, `server`, etc., choose a name that makes sense to you):
    ```bash
    mkdir backend
    ```
4.  Navigate into this newly created `backend` directory:
    ```bash
    cd backend
    ```

### Step 2: Initialize the Node.js Project for Your Backend

Each independent application (your frontend and your backend) needs its own `package.json` file to manage its specific dependencies.

1.  While you are **inside** the `backend` directory, initialize a new Node.js project:
    ```bash
    npm init -y
    ```
    This command creates a `package.json` file specifically for your backend within the `Kryptos/backend/` folder.

### Step 3: Install Necessary Packages for Your Backend

These are the libraries your backend server will need to function.

1.  While still **inside** the `Kryptos/backend/` directory, install the required packages:
    ```bash
    npm install express axios dotenv cors
    ```
    *   `express`: A web framework for building the server.
    *   `axios`: An HTTP client to make requests to the Blockfrost API.
    *   `dotenv`: To load environment variables (like your API key) from a `.env` file.
    *   `cors`: Middleware to handle Cross-Origin Resource Sharing, allowing your frontend to communicate with your backend.

    This will create a `node_modules` folder and a `package-lock.json` file *inside* your `Kryptos/backend/` directory, separate from your frontend's `node_modules`.

### Step 4: Create Your `.env` File for Backend Secrets

This file will hold your sensitive Blockfrost API key. It is crucial that this file is **never committed to your Git repository**.

1.  While still **inside** the `Kryptos/backend/` directory, create a new file named `.env`:
    ```bash
    touch .env
    ```
2.  Open the `.env` file in your text editor and add the following lines:
    ```
    BLOCKFROST_API_KEY=YOUR_BLOCKFROST_API_KEY_HERE
    PORT=5000
    ```
    *   Replace `YOUR_BLOCKFROST_API_KEY_HERE` with your actual Blockfrost API key.
    *   `PORT` is the port your backend server will listen on. You can change it if 5000 is already in use.

3.  **Crucial Step: Update Your Main `.gitignore` File:**
    *   Navigate back to the root of your `Kryptos` repository:
        ```bash
        cd ..
        ```
    *   Open the main `.gitignore` file (located in `/Users/himeth/Documents/Engineering/Kryptos/.gitignore`).
    *   Add the following lines to ensure your backend's `.env` file and its `node_modules` are ignored by Git:
        ```
        # Backend secrets
        /backend/.env

        # Backend dependencies
        /backend/node_modules
        ```

### Step 5: Create Your Backend Server Logic (`server.js`)

This file will contain the code for your proxy server, handling requests from the frontend and forwarding them to Blockfrost.

1.  Navigate back into your `backend` directory:
    ```bash
    cd backend
    ```
2.  Create a new file named `server.js`:
    ```bash
    touch server.js
    ```
3.  Open `server.js` in your text editor. You will write the Express server code here. This code will:
    *   Load your `BLOCKFROST_API_KEY` from the `.env` file.
    *   Configure CORS to allow requests from your frontend (e.g., `http://localhost:3000`).
    *   Define an API endpoint (e.g., `/api/blockfrost`) that your frontend will call.
    *   When a request comes to this endpoint, it will construct the actual request to Blockfrost (using `axios`), add your `BLOCKFROST_API_KEY`, send the request to Blockfrost, receive the response, and then send Blockfrost's response back to your frontend.

### Step 6: Run Your Backend Server

Once you have written the code in `server.js`, you can start your backend server.

1.  While still **inside** the `Kryptos/backend/` directory, run the server:
    ```bash
    node server.js
    ```
    You should see a message in your terminal indicating that the server is running (e.g., "Backend proxy server running on port 5000"). This server will now be listening for requests from your frontend.

### Step 7: Modify Your Frontend Application

Your React application (frontend) currently talks directly to Blockfrost. You need to change it to talk to your new backend proxy instead.

1.  Navigate to your frontend's source code (e.g., `src/services/blockchainService.js`).
2.  **Remove direct Blockfrost API key usage:** The `blockchainService.js` should no longer directly use the Blockfrost API key or construct Blockfrost base URLs.
3.  **Update API calls:** Modify the methods that interact with Blockfrost (e.g., `getAddressTransactions`, `getTransactionMetadata`, `issueCertificate`, `verifyCertificate`) to send their requests to your backend proxy's URL (e.g., `http://localhost:5000/api/blockfrost`).
4.  Your frontend will send the necessary Blockfrost endpoint path, method, and data to your backend, and your backend will handle the actual communication with Blockfrost using the secure API key.

### Step 8: Deployment Considerations

Remember that for your application to be accessible to others on the internet, both your frontend and your backend need to be deployed.

*   **Frontend Deployment:** Deploy your React app to a static hosting service (e.g., Netlify, Vercel).
*   **Backend Deployment:** Deploy your Node.js backend to a server environment (e.g., Heroku, Render, AWS, DigitalOcean). When deploying your backend, you will configure the `BLOCKFROST_API_KEY` as an environment variable directly on the hosting platform, not by uploading your `.env` file.
*   **CORS Update:** In your `server.js`, ensure the CORS configuration allows requests from your *deployed* frontend's domain (e.g., `https://your-frontend-domain.com`) in production.

Following these steps will establish a more secure and robust architecture for your CertiFy application.
