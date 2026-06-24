import { useState } from 'react';
import { loginAdmin } from '../api/apiService';

/**
 * useAuth
 * Manages admin authentication state and persists the JWT in localStorage.
 *
 * Returns:
 *   isAuthenticated  – boolean
 *   loginError       – string | ""
 *   handleLogin      – async (FormEvent) => void
 *   handleLogout     – () => void
 */
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('admin_token')
  );
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const data = await loginAdmin(
        e.target.username.value,
        e.target.password.value
      );
      localStorage.setItem('admin_token', data.token);
      setIsAuthenticated(true);
    } catch (err) {
      setLoginError(err.message || 'Error de conexión');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, loginError, handleLogin, handleLogout };
}
