import React from 'react';

export default function ModernButton({ children, onClick, className = "", type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md ${className}`}
    >
      {children}
    </button>
  );
}