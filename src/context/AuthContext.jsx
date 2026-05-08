import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [userRole, setUserRole] = useState('viewer'); 
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  const value = {
    userRole, setUserRole,
    isAuthorized, setIsAuthorized,
    isHost, setIsHost,
    pendingRequests, setPendingRequests
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
