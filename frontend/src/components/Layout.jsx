import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useLocation } from 'react-router-dom';

export const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Auto-close sidebar on mobile when route changes
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-[#FDFDFF] flex">
            {/* Sidebar with mobile toggle logic handled inside */}
            <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(false)} />

            <div className="flex-1 flex flex-col min-w-0 lg:ml-72">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 px-4 sm:px-8 py-8 lg:px-12 overflow-x-hidden">
                    <div key={location.pathname} className="max-w-7xl mx-auto page-transition-enter">
                        {children}
                    </div>
                </main>
            </div>

            {/* Backdrop for mobile */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
};
