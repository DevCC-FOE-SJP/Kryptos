import { CardanoWallet, MeshProvider } from '@meshsdk/react';

function App() {
  return (
    <MeshProvider>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">University of Kelaniya Certificate Verifier</h1>
            <CardanoWallet />
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold mb-4">Issue Certificate</h2>
                  <input type="file" className="mb-4" />
                  <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Issue
                  </button>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h2 className="text-2xl font-bold mb-4">Verify Certificate</h2>
                  <input type="file" className="mb-4" />
                  <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                    Verify
                  </button>
                </div>
              </div>
              <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Status</h2>
                <p>...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </MeshProvider>
  );
}

export default App;