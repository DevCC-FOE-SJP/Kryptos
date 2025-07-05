Given the hackathon is focused on the **Cardano blockchain** and the tools provided (MeshJS, Blockfrost), we'll focus on ideas that are impressive conceptually but relatively simple to implement on the front end, without needing complex custom smart contracts.

1.  **Verifiable Academic Certificates on Cardano:**
    *   **Idea:** A simple web app where a university (or any user in the demo) can issue a certificate for a student. The app takes a PDF of the certificate, calculates its unique digital fingerprint (a "hash"), and records that hash on the Cardano blockchain in a transaction's metadata. Anyone can then upload a certificate to the app to verify if its hash exists on the blockchain, proving its authenticity.
    *   **Why it's good for a beginner:** This is a classic blockchain use case. You don't need a complex smart contract; you just need to build a transaction with metadata (which MeshJS can help with) and use the Blockfrost API to read transaction data for verification.


**Your Goal:** Create a simple web application with two functions:
1.  **Issue Certificate:** Upload a PDF, connect a wallet, and click a button to anchor its "hash" to the Cardano testnet.
2.  **Verify Certificate:** Upload a PDF, and the app tells you if it's a valid certificate by checking the blockchain.

**The Strategy:** Focus on the **Minimum Viable Product (MVP)** and the **demo video**. Don't try to make it perfect.

#### Day 1: Setup and Frontend UI

**Morning (4 hours): Environment Setup**
1.  **Install Tools:** Make sure you have VS Code, Node.js, and Git installed.
2.  **Create a React App:** Open your terminal and run `npx create-react-app unihack-project`. This gives you a basic web app structure.
3.  **Get a Cardano Wallet:** Install the **Lace** or **Eternl** wallet extension in your browser. Create a new wallet. **Crucially, switch the network to "Pre-production Testnet" or "Preview Testnet" in the wallet settings.** This is where you'll be working, so you don't spend real money.
4.  **Get Testnet ADA:** Find a "Cardano Testnet Faucet" online. You'll enter your testnet wallet address, and they will send you free test ADA to pay for transaction fees. This is essential.
5.  **Get Blockfrost API Key:** Sign up for a free account on [Blockfrost.io](https://blockfrost.io). Create a new project and select the correct Cardano testnet (the same one as your wallet). Copy your API key.

**Afternoon (5 hours): Build the User Interface (No Blockchain Yet!)**
1.  **Layout:** In your React app, design the page. Use a simple UI library like **Tailwind CSS** or **MUI** to make it look clean quickly. You need:
    *   A title: "University of Kelaniya Certificate Verifier"
    *   An "Issue Certificate" section with a file upload button and a "Issue" button.
    *   A "Verify Certificate" section with another file upload button and a "Verify" button.
    *   A space to display messages like "Certificate issued successfully!" or "Verification failed."
2.  **Integrate MeshJS:** Install MeshJS into your project (`npm install @meshsdk/react`). In your main app file, wrap your entire application with the `<MeshProvider>` component. Add the `<CardanoWallet />` component to your header.
3.  **End of Day 1 Goal:** You should have a web page that looks the part and has a "Connect Wallet" button that works. When you click it, your Lace/Eternl wallet should pop up asking for permission. This is a huge first step!

#### Day 2: Blockchain Logic & Submission Prep

**Morning (5 hours): The "Magic" - Connecting to Cardano**
1.  **Hashing the File:** When a user uploads a PDF in the "Issue" section, you need to calculate its hash. Use a JavaScript library like `crypto-js` to calculate the SHA-256 hash of the file's content.
2.  **"Issue" Functionality:**
    *   When the "Issue" button is clicked, use MeshJS to build a transaction.
    *   The transaction will send a very small amount of testnet ADA (e.g., 2 ADA) from your connected wallet back to your own wallet.
    *   **This is the key part:** Use MeshJS's functions to add **metadata** to this transaction. The metadata will contain the file hash you calculated (e.g., `{ "certificate_hash": "abc123..." }`).
    *   When the user signs and submits, the hash is now permanently on the blockchain.
3.  **"Verify" Functionality:**
    *   When a user uploads a file to verify, calculate its hash the same way.
    *   Now, use your **Blockfrost API key** to make a request to the Blockfrost API. You want to fetch the transaction history for the address you used for issuing.
    *   Loop through the recent transactions and check the metadata of each one. If you find a transaction whose metadata contains the hash of the file you're verifying, it's valid!
    *   Display a success or failure message to the user.

**Afternoon (3 hours): Documentation & GitHub**
1.  **Create a `README.md` file:** This is your project's main page on GitHub. Explain:
    *   What the project is (Verifiable Certificates for UniHack 2025).
    *   How it works (uses Cardano transaction metadata).
    *   How to run it locally (list the `npm install` and `npm start` commands).
2.  **Create GitHub Repo:** Go to GitHub, create a new public repository.
3.  **Add License:** Create a file named `LICENSE` and paste the contents of the Apache 2.0 license into it.
4.  **Push Your Code:** Use Git to push all your project files to the new repository.

**Evening (2 hours): The Demo Video (CRITICAL)**
1.  **Plan your script.** Don't just press record.
2.  Use screen recording software (OBS is free, or QuickTime on Mac).
3.  **Show, don't just tell.** Walk through the process clearly:
    *   (30s) Intro: "Hi, we are Team [Name], and this is our project for UniHack 2025, a decentralized certificate verifier built on Cardano."
    *   (1 min) **Issuing:** "First, an administrator uploads the official certificate. Our app calculates its unique hash. We connect our Cardano wallet... and issue the certificate. This records the hash in the transaction metadata on the testnet, making it immutable." *Show the wallet pop-up and confirmation.*
    *   (1 min) **Verifying:** "Now, anyone can verify a certificate. If we upload the correct, original PDF, our app checks the blockchain and... success! It's verified. But if we upload a modified or fake certificate... the hash doesn't match, and verification fails." *Show both a success and a failure case.*
    *   (30s) Outro: "This solves the problem of fake credentials and shows the power of Cardano for creating trust. Thank you."
4.  Keep it between 2-4 minutes. Edit out any boring parts.