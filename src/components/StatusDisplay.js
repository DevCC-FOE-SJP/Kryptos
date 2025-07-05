import React from 'react';

const StatusDisplay = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Status</h2>
        <div className="text-gray-500 italic">
          Select a certificate file and perform an action to see status updates here.
        </div>
      </div>
    );
  }

  const getMessageIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      default: return '📝';
    }
  };

  const getMessageStyle = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Status & Activity Log</h2>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border-l-4 ${getMessageStyle(message.type)}`}
          >
            <div className="flex items-start">
              <span className="text-lg mr-2 flex-shrink-0">
                {getMessageIcon(message.type)}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium break-words">
                  {message.message}
                </p>
                <p className="text-xs opacity-75 mt-1">
                  {message.timestamp}
                </p>
                {message.details && (
                  <div className="mt-2 text-xs bg-gray-50 rounded p-2 border">
                    {message.details.txHash && (
                      <div><strong>Transaction:</strong> {message.details.txHash}</div>
                    )}
                    {message.details.fileHash && (
                      <div><strong>File Hash:</strong> {message.details.fileHash.substring(0, 16)}...</div>
                    )}
                    {message.details.fileName && (
                      <div><strong>File:</strong> {message.details.fileName}</div>
                    )}
                    {message.details.fileSize && (
                      <div><strong>Size:</strong> {message.details.fileSize}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {messages.length > 5 && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500">
            Showing last {messages.length} messages. Scroll up to see older messages.
          </p>
        </div>
      )}
    </div>
  );
};

export default StatusDisplay;
