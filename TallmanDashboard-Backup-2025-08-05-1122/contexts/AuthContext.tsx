import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedUser } from '../services/DatabaseService';

interface AuthContextType {
    isAuthenticated: boolean;
    user: AuthenticatedUser | null;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'dashboard_user_session';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthenticatedUser | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // On initial load, try to restore session from sessionStorage
        try {
            const storedSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (storedSession) {
                const sessionUser = JSON.parse(storedSession);
                setUser(sessionUser);
            }
        } catch (error) {
            console.error("Could not parse user session:", error);
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    }, []);

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            // Call backend API for authentication
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Authentication failed');
            }

            const data = await response.json();
            
            // Convert backend user format to AuthenticatedUser format
            const authenticatedUser: AuthenticatedUser = {
                id: 1, // Backend doesn't provide ID, using default
                userName: data.user.username,
                privilege: data.user.role === 'admin' ? 'Admin' : 'User'
            };

            setUser(authenticatedUser);
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authenticatedUser));
            
            // Store JWT token for API calls
            sessionStorage.setItem('jwt_token', data.token);
            
            navigate('/', { replace: true });
            return true;
        } catch (error) {
           console.error("Login failed:", error);
           throw error; // Re-throw to show error in UI
        }
    };

    const logout = useCallback(() => {
        setUser(null);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        navigate('/login', { replace: true });
    }, [navigate]);

    return (
        <AuthContext.Provider value={{ 
            isAuthenticated: !!user, 
            user, 
            login, 
            logout,
            isAdmin: user?.privilege === 'Admin' || user?.privilege === 'BackdoorUser'
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
