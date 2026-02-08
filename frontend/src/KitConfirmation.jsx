
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function KitConfirmation() {
    const [token, setToken] = useState('');
    const [status, setStatus] = useState('pending'); // pending, confirmed, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tokenParam = params.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setStatus('error');
            setMessage('Invalid verification token.');
        }
    }, []);

    const handleConfirm = async () => {
        try {
            if (!token) return;

            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            const response = await fetch(`${backendUrl}/onboarding/kit-received?token=${token}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setStatus('confirmed');
            } else {
                setStatus('error');
                setMessage('Failed to confirm. Please try again or contact HR.');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
            setMessage('Network error. Please check your connection.');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    if (status === 'confirmed') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500/30">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200/40 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-200/40 rounded-full blur-3xl"></div>
                </div>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
                >
                    <div className="bg-white border border-gray-100 py-12 px-6 shadow-xl rounded-2xl sm:px-12 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                            className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 border border-emerald-100 mb-8"
                        >
                            <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </motion.div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Confirmed!</h2>
                        <p className="text-gray-500 text-lg leading-relaxed mb-8">
                            Great! We've noted that you received your kit. Check your email for your official work credentials.
                        </p>
                        <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                            Next step initiated
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-red-500/30">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200/40 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-200/40 rounded-full blur-3xl"></div>
                </div>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                    className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
                >
                    <div className="bg-white border border-gray-100 py-12 px-6 shadow-xl rounded-2xl sm:px-12 text-center">
                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 border border-red-100 mb-8">
                            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
                        <p className="text-gray-500 mb-8">{message}</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30">
            {/* Background Effects matching NewEntry.jsx */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200/40 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-200/40 rounded-full blur-3xl"></div>
            </div>

            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="sm:mx-auto sm:w-full sm:max-w-md relative z-10"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-block p-4 rounded-2xl bg-white border border-gray-100 shadow-lg mb-6"
                    >
                        <svg className="h-12 w-12 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </motion.div>
                    <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">Welcome Kit</h2>
                    <p className="mt-4 text-gray-500 text-lg">Did you receive your package?</p>
                </div>

                <div className="bg-white border border-gray-100 py-10 px-6 shadow-xl rounded-2xl sm:px-12 relative overflow-hidden group">
                    <div className="text-center mb-8 relative z-10">
                        <p className="text-gray-700 text-lg mb-2 font-medium">
                            Please confirm receipt
                        </p>
                        <p className="text-sm text-gray-500">
                            Confirming this helps us initiate your account setup.
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleConfirm}
                        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-semibold text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all duration-200 relative overflow-hidden"
                    >
                        <span className="relative z-10">Yes, I have received the Kit</span>
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}

export default KitConfirmation;
