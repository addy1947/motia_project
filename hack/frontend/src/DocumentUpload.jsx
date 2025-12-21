import { useState, useEffect } from 'react';

function DocumentUpload() {
    const [token, setToken] = useState('');
    const [folderLink, setFolderLink] = useState('');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setToken(params.get('token'));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!token) {
            setStatus('error');
            setMessage('Invalid session token.');
            return;
        }

        if (!folderLink.trim()) {
            setStatus('error');
            setMessage('Please provide the folder link.');
            return;
        }

        setStatus('loading');

        try {
            const response = await fetch(`http://localhost:3000/onboarding/documents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    documents: { "Drive_Folder_Link": folderLink }
                }),
            });

            if (response.ok) {
                setStatus('success');
                setMessage('Folder link submitted successfully!');
                setFolderLink('');
            } else {
                const data = await response.json();
                setStatus('error');
                setMessage(data.error || 'Submission failed.');
            }
        } catch (error) {
            console.error('Error submitting:', error);
            setStatus('error');
            setMessage('Network error.');
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-8 text-center">
                    <h1 className="text-xl font-bold text-red-500">Invalid Link</h1>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Textures */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-2xl bg-white border border-gray-100 rounded-2xl shadow-xl p-8 my-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">Submit Document Link</h1>
                    <p className="text-gray-500 text-sm">
                        Please upload your documents (Aadhaar, PAN, etc.) to a public drive folder (e.g., Google Drive) and paste the shareable link below.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 ml-1">Google Drive Folder Link</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            </div>
                            <input
                                type="url"
                                value={folderLink}
                                onChange={(e) => setFolderLink(e.target.value)}
                                placeholder="https://drive.google.com/drive/folders/..."
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className={`w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 ${status === 'loading'
                                ? 'bg-gray-400 cursor-not-allowed'
                                : (status === 'success' ? 'bg-green-600' : 'bg-black hover:bg-gray-800')
                                }`}
                        >
                            {status === 'loading' ? (
                                <span className="flex items-center justify-center gap-2">Processing...</span>
                            ) : status === 'success' ? (
                                <span className="flex items-center justify-center gap-2">
                                    ✓ Submitted
                                </span>
                            ) : (
                                'Submit Link'
                            )}
                        </button>
                    </div>

                    {status === 'error' && (
                        <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg border border-red-100">
                            {message}
                        </p>
                    )}
                    {status === 'success' && (
                        <p className="text-green-600 text-sm text-center bg-green-50 py-2 rounded-lg border border-green-100">
                            {message}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}

export default DocumentUpload;
