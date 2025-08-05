
import React from 'react';
import { ConnectionDetails } from '../types';

interface ConnectionStatusModalProps {
    details: ConnectionDetails[];
    onClose: () => void;
}

const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ErrorIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


const DetailRow: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => {
    if (value === undefined || value === null) return null;
    return (
        <div className="flex flex-col sm:flex-row sm:justify-between py-1">
            <span className="text-text-secondary pr-2">{label}:</span>
            <span className="font-mono text-text-primary text-left sm:text-right break-words">{String(value)}</span>
        </div>
    );
};

const ConnectionStatusModal: React.FC<ConnectionStatusModalProps> = ({ details, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div 
                className="bg-secondary rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" 
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-primary/20 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-text-primary">System Health Report</h2>
                    <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-3xl font-light leading-none">&times;</button>
                </header>
                
                <main className="p-6 space-y-6 overflow-y-auto">
                    {details.map((detail) => {
                        const isConnected = detail.status === 'Connected';
                        const statusColor = isConnected ? 'border-green-500' : 'border-red-500';
                        const statusIcon = isConnected ? <SuccessIcon /> : <ErrorIcon />;

                        return (
                            <div key={detail.name} className={`bg-primary p-5 rounded-lg border-l-4 ${statusColor} shadow-md transition-all duration-300`}>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-xl font-semibold text-text-primary">{detail.name}</h3>
                                    <div className={`flex items-center gap-2 font-bold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                                        {statusIcon}
                                        <span>{detail.status}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                                    {isConnected ? (
                                        <>
                                            <DetailRow label="Response Time" value={detail.responseTime ? `${detail.responseTime} ms` : undefined} />
                                            <DetailRow label="DB Size" value={detail.size} />
                                            <DetailRow label="Identifier" value={detail.identifier} />
                                            <DetailRow label="Version" value={detail.version} />
                                        </>
                                    ) : (
                                        <div className="sm:col-span-2">
                                            <DetailRow label="Error Details" value={detail.error} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </main>

                <footer className="p-4 border-t border-primary/20 text-right flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-accent text-white rounded-md hover:bg-highlight focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-secondary transition-colors"
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ConnectionStatusModal;