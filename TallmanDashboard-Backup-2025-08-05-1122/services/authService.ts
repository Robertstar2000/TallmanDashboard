import { User, UserRole } from '../types';

const USERS_STORAGE_KEY = 'dashboard_users';

// --- User List Management ---

const initializeUsers = () => {
    const existingUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (!existingUsers) {
        const defaultUsers: User[] = [
            { id: 1, username: 'BobM', role: 'admin' },
        ];
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    }
};

initializeUsers();

export const getUsers = async (): Promise<User[]> => {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
};

export const addUser = async (newUser: Omit<User, 'id'>): Promise<User> => {
    const users = await getUsers();
    const usernameExists = users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (usernameExists) {
        throw new Error(`User with username '${newUser.username}' already exists.`);
    }

    const user: User = {
        id: Date.now(), // Simple unique ID
        ...newUser
    };
    users.push(user);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return user;
};

export const updateUser = async (id: number, updates: Partial<User>): Promise<User> => {
    let users = await getUsers();
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
        throw new Error('User not found.');
    }
    users[userIndex] = { ...users[userIndex], ...updates };
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return users[userIndex];
};

export const deleteUser = async (id: number): Promise<void> => {
    let users = await getUsers();
    const filteredUsers = users.filter(u => u.id !== id);
    if (users.length === filteredUsers.length) {
        throw new Error('User not found.');
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(filteredUsers));
};


// --- Authentication Logic ---

const ldapAuth = async (username: string, password: string): Promise<boolean> => {
    try {
        // Extract just the username part (remove @domain if present)
        const cleanUsername = username.split('@')[0];
        
        // Construct the user DN for binding
        const userDN = `CN=${cleanUsername},${process.env.LDAP_SEARCH_BASE}`;
        
        // In a browser environment, we need to make an API call to a backend service
        // that can perform LDAP authentication. For now, we'll simulate the LDAP call
        // but structure it to use the actual LDAP credentials from .env
        
        const ldapConfig = {
            url: process.env.LDAP_URL,
            bindDN: process.env.LDAP_BIND_DN,
            bindPassword: process.env.LDAP_BIND_PASSWORD,
            searchBase: process.env.LDAP_SEARCH_BASE,
            userDN: userDN
        };
        
        // TODO: Replace this with actual LDAP authentication via backend API
        // For now, simulate successful authentication for valid credentials
        if (cleanUsername.toLowerCase() === 'bobm' && password) {
            return true;
        }
        
        // Simulate other domain users
        return password && password.length >= 3;
        
    } catch (error) {
        console.error('LDAP authentication error:', error);
        return false;
    }
};

export const login = async (username: string, password: string): Promise<{ success: boolean; user?: User | { username: string; role: UserRole; id: number; }; message?: string }> => {
    try {
        // Call backend authentication API
        const response = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error('Authentication failed');
        }

        const { token, user } = await response.json();
        
        // Store JWT token for future API calls
        localStorage.setItem('token', token);
        
        // Convert backend user format to frontend format
        const frontendUser: User = {
            id: Date.now(), // Generate ID for frontend
            username: user.username,
            role: user.role as UserRole
        };

        return {
            success: true,
            user: frontendUser
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            message: 'Authentication failed. Please check your credentials.'
        };
    }
};
