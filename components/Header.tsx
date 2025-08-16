import React from 'react';
import { NavLink } from 'react-router-dom';
import { ConnectionStatus } from '../types';
import { useGlobal } from '../contexts/GlobalContext';
import { useAuth } from '../contexts/AuthContext';
import Logo from './Logo';

interface HeaderProps {
    isRunning: boolean;
    statusMessage: string;
    p21Status: ConnectionStatus;
    porStatus: ConnectionStatus;
}

const StatusIndicator: React.FC<{ status: ConnectionStatus, name: string }> = ({ status, name }) => {
    const color = status === 'connected' ? 'bg-green-500' : status === 'testing' ? 'bg-yellow-500' : 'bg-red-500';
    const text = status.charAt(0).toUpperCase() + status.slice(1);
    
    return (
        <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${color}`}></span>
            <span className="text-sm text-text-secondary">{name}: {text}</span>
        </div>
    );
};

const ThemeSwitcher: React.FC = () => {
    const { theme, toggleTheme } = useGlobal();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-text-secondary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-primary"
            aria-label="Toggle theme"
        >
            {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>
    );
};


const Header: React.FC<HeaderProps> = ({ isRunning, statusMessage, p21Status, porStatus }) => {
    const { user, logout, isAdmin } = useAuth();
    
    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            isActive ? 'bg-accent text-white' : 'text-text-secondary hover:bg-secondary hover:text-text-primary'
        }`;

    return (
        <header className="bg-primary shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                           <Logo className="h-8 w-8 text-accent" />
                           <h1 className="text-xl font-bold text-text-primary">Tallman Equipment</h1>
                        </div>
                        <nav className="hidden md:flex space-x-4">
                            <NavLink to="/" className={navLinkClass}>Dashboard</NavLink>
                            {isAdmin && <NavLink to="/admin" className={navLinkClass}>Admin</NavLink>}
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                         <div className="hidden md:flex items-center space-x-4">
                            <StatusIndicator status={p21Status} name="P21" />
                            <StatusIndicator status={porStatus} name="POR" />
                        </div>
                         <div className="flex items-center space-x-2">
                            <span className={`w-4 h-4 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                            <span className="text-sm text-text-secondary truncate hidden lg:block max-w-xs">{statusMessage}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-text-primary hidden sm:block">Welcome, {user?.username}</span>
                            <button onClick={logout} className="p-2 rounded-md text-text-secondary hover:bg-secondary" aria-label="Logout">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                        <ThemeSwitcher />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
