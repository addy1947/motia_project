import React, { useState, useEffect } from 'react';

function Respond() {
    const [status, setStatus] = useState('confirm'); // 'confirm', 'loading', 'success', 'error'
    const [message, setMessage] = useState('');
    const [token, setToken] = useState('');
    const [action, setAction] = useState('');

    useEffect(() => {
        // Extract query params manually since we aren't using React Router hooks yet
        const params = new URLSearchParams(window.location.search);
        setToken(params.get('token'));
        setAction(params.get('action'));
    }, []);

    const handleConfirm = async () => {
        setStatus('loading');
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            const response = await fetch(`${backendUrl}/onboarding/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, action }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage(data.message || 'Response recorded successfully! Details have been sent to your email.');
            } else {
                setStatus('error');
                setMessage(data.error || 'Something went wrong. Please try again.');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Network error. Please check your connection.');
        }
    };

    if (!token || !action) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="relative z-10 w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-8 text-center">
                    <h1 className="text-2xl font-bold text-red-500 mb-2">Link Error</h1>
                    <p className="text-gray-500">Invalid link. Please check your email again or contact HR.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">

                {status === 'confirm' && (
                    <div className="text-center space-y-6">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Confirmation</h1>
                            <p className="text-gray-600 text-lg">
                                You are about to <strong className={action === 'yes' ? "text-emerald-600 font-bold" : "text-rose-600 font-bold"}>
                                    {action === 'yes' ? 'ACCEPT' : 'DECLINE'}
                                </strong> the offer.
                            </p>
                            <p className="text-gray-400 text-sm">Are you sure you want to proceed?</p>
                        </div>

                        <div className="flex gap-4 justify-center pt-2">
                            <button
                                onClick={handleConfirm}
                                className={`px-8 py-3 rounded-xl font-bold text-white shadow-md transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 ${action === 'yes'
                                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200'
                                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-200'
                                    }`}
                            >
                                Yes, I'm Sure
                            </button>
                            {/* Optional cancel button could go here */}
                        </div>
                    </div>
                )}

                {status === 'loading' && (
                    <div className="text-center space-y-6 py-8">
                        <div className="relative w-16 h-16 mx-auto">
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-gray-100 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                        <h2 className="text-xl font-medium text-gray-900 animate-pulse">Processing...</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center space-y-4 py-4">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Success!</h1>
                        <p className="text-gray-600 text-lg leading-relaxed">{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center space-y-4 py-4">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                            <svg className="w-8 h-8 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">Error</h1>
                        <p className="text-gray-600 text-lg">{message}</p>
                        <button
                            onClick={() => setStatus('confirm')}
                            className="mt-4 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors text-sm font-medium border border-gray-200"
                        >
                            Try Again
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Respond;
