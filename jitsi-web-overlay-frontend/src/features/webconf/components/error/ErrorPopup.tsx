import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ErrorPopupProps {
  message: string;
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({ message }) => {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate('/');
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-30 flex justify-center items-center z-50"
    >
      <div className="bg-white p-6 rounded-lg shadow-md max-w-sm text-center">
        <h2 className="text-xl font-semibold mb-2 text-red-600">Erreur</h2>
        <p className="mb-4">{message}</p>
        <button
          onClick={handleRetry}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
};

export default ErrorPopup;
