'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // Corrected import for App Router
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login: contextLogin } = useAuth();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Login successful
      console.log('Login successful:', data);
      // Login successful, update auth context
      // Store token in cookie so that middleware can read it
      document.cookie = `token=${data.token}; path=/;`;
      contextLogin(data.user, data.token);

      // Redirect to a protected page, e.g., dashboard
      setTimeout(() => {
        window.location.href = '/';
      }, 50); // slight delay to ensure cookie is set

    } catch (err: any) {
      setError(err.message);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <form 
        onSubmit={handleSubmit} 
        style={{ 
          padding: '40px', 
          borderRadius: '8px', 
          background: 'white', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px'
        }}
      >
        <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#333' }}>Login</h2>
        
        {error && (
          <p style={{ color: 'red', textAlign: 'center', marginBottom: '16px' }}>{error}</p>
        )}
        
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: '8px', color: '#555' }}>Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '8px', color: '#555' }}>Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            width: '100%', 
            padding: '12px',
            borderRadius: '4px', 
            border: 'none', 
            background: isLoading ? '#ccc' : '#007bff',
            color: 'white', 
            cursor: isLoading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
