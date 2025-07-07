
# Frontend Proxy Integration Guide

This guide provides detailed, sequential steps to modify your. This is a more secure approach as it keeps your Blockfrost API key off the client-side.

## Prerequisites

*   You have a working backend proxy server as described in `BACKEND_SETUP.md`.
*   The backend server is running and accessible from your frontend's development environment (e.g., running on `http://localhost:5000`).
*   You have a React application that currently interacts directly with the Blockfrost API.

## Step 1: Verify the Backend Proxy is Running

Before making any frontend changes, ensure your backend proxy is running correctly.

1.  **Start the backend server:**
    ```bash
    cd backend
    npm install
    npm start
    ```
2.  **Check the console output:** You should see a message indicating the server is running and whether the Blockfrost API key is configured.
    ```
    Backend proxy server running on port 5000
    Blockfrost API Key: Configured
    ```

## Step 2: Remove API Key from Frontend Configuration

The first step is to remove the Blockfrost API key from the frontend's state management and UI.

1.  **Edit `src/App.js`:**
    *   Locate the `ConfigurationPanel` component and remove the `onConfigUpdate` prop. The frontend no longer needs to manage the API key.
    *   The `appConfig` state should no longer store the API key.

2.  **Edit `src/components/ConfigurationPanel.js`:**
    *   Remove the input field for the Blockfrost API key.
    *   Remove any state and logic related to handling the API key. The panel should now only manage the network selection.

## Step 3: Modify `blockchainService.js` to Use the Backend Proxy

This is the core of the integration. You will modify the `blockchainService.js` to send all Blockfrost requests to your backend proxy instead of directly to Blockfrost.

1.  **Open `src/services/blockchainService.js`:**

2.  **Update `makeBlockfrostRequest`:** The existing `makeBlockfrostRequest` function is already set up to use the backend proxy. Ensure the `backendUrl` is correct.

    ```javascript
    async makeBlockfrostRequest(endpoint, method = 'get', body = null, params = null, contentType = 'application/json') {
      const backendUrl = 'http://localhost:5000/api/blockfrost'; // Your backend proxy URL

      try {
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            endpoint,
            method,
            body,
            params,
            contentType // Pass content type for specific cases like CBOR
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Backend proxy error: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Error from backend proxy:', error);
        throw new Error(error.message || 'Failed to communicate with backend proxy.');
      }
    }
    ```

3.  **Update `issueCertificate`:** The `issueCertificate` function uses `lucid-cardano`, which needs to be initialized with a `Blockfrost` provider. Since the API key is now on the backend, you can pass a placeholder key to the `Blockfrost` constructor. The actual API key will be added by the backend proxy.

    ```javascript
    // In issueCertificate method
    const lucid = await Lucid.new(
      new Blockfrost(serviceConfig.baseUrl, 'placeholder-api-key'), // The API key is handled by the backend
      lucidNetwork
    );
    ```

4.  **Update `verifyCertificate`:** Similarly, update the `verifyCertificate` function to use a placeholder API key when initializing Lucid.

    ```javascript
    // In verifyCertificate method
    const lucid = await Lucid.new(
      new Blockfrost(serviceConfig.baseUrl, 'placeholder-api-key'), // The API key is handled by the backend
      lucidNetwork
    );
    ```

## Step 4: Update UI Components to Remove API Key Input

Now that the `blockchainService` handles the proxy communication, you need to remove the API key input from the UI components.

1.  **Edit `src/components/SimpleIssueCertificate.js` and `src/components/SimpleVerifyCertificate.js`:**
    *   These components receive a `config` prop. You need to adjust the logic that checks `isConfigured`. Since the API key is no longer configured on the frontend, you can either remove this check or base it on a different condition (e.g., network selection). For simplicity, you can remove the check.

    *   **Before:**
        ```javascript
        const isConfigured = config && config.isValid;
        ```

    *   **After:**
        ```javascript
        const isConfigured = true; // Or based on network selection
        ```

## Step 5: Run and Test the Application

After making these changes, you need to test the application to ensure everything is working correctly.

1.  **Start the frontend development server:**
    ```bash
    npm start
    ```
2.  **Open your browser** to `http://localhost:3000`.
3.  **Test the "Issue Certificate" functionality:**
    *   Select a PDF file.
    *   Connect your wallet.
    *   Click "Issue Certificate on Blockchain".
    *   Check the browser's developer console and the backend server's console for any errors.
4.  **Test the "Verify Certificate" functionality:**
    *   Select a PDF file that you have already issued.
    *   Click "Verify".
    *   Check the console for any errors.

## Conclusion

By following these steps, you have successfully refactored your frontend to use a backend proxy for all Blockfrost API requests. This is a more secure and robust architecture for your application.
