
import { useState } from 'react';

function NewEntry() {
    const [formData, setFormData] = useState({
        name: 'aditya',
        email: 'adityamaurya1947@gmail.com',
        package: '900000',
        role: 'Developer'
    });
    const [status, setStatus] = useState('idle');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            const response = await fetch(`${backendUrl}/first`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setStatus('success');
                setFormData({ name: '', email: '', package: '', role: '' });
                setTimeout(() => setStatus('idle'), 3000);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decoration - subtle pastels for light mode */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-200/40 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-200/40 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-xl p-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                        New Entry
                    </h1>
                    <p className="text-gray-500 text-sm">Add a new team member to the system</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label htmlFor="name" className="text-sm font-medium text-gray-700 ml-1">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="John Doe"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 transition-all duration-200 hover:bg-white hover:shadow-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="email" className="text-sm font-medium text-gray-700 ml-1">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="john@example.com"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 transition-all duration-200 hover:bg-white hover:shadow-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label htmlFor="package" className="text-sm font-medium text-gray-700 ml-1">Package</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                <input
                                    type="number"
                                    id="package"
                                    name="package"
                                    required
                                    value={formData.package}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 transition-all duration-200 hover:bg-white hover:shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="role" className="text-sm font-medium text-gray-700 ml-1">Role</label>
                            <div className="relative">
                                <select
                                    id="role-select"
                                    value={['Developer', 'Designer', 'Product Manager', 'HR', 'Sales'].includes(formData.role) ? formData.role : 'Custom'}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === 'Custom') {
                                            setFormData(prev => ({ ...prev, role: '' }));
                                        } else {
                                            setFormData(prev => ({ ...prev, role: val }));
                                        }
                                    }}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition-all duration-200 hover:bg-white hover:shadow-sm appearance-none cursor-pointer"
                                >
                                    <option value="Developer">Developer</option>
                                    <option value="Designer">Designer</option>
                                    <option value="Product Manager">Product Manager</option>
                                    <option value="HR">HR</option>
                                    <option value="Sales">Sales</option>
                                    <option value="Custom">Custom Role...</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>

                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${(!['Developer', 'Designer', 'Product Manager', 'HR', 'Sales'].includes(formData.role) || formData.role === '') ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                                <input
                                    type="text"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    placeholder="Type specific role..."
                                    className="w-full px-4 py-3 bg-white border-2 border-blue-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 transition-all duration-200"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className={`w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 ${status === 'loading'
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-black hover:bg-gray-800' // Minimalist black button
                            }`}
                    >
                        {status === 'loading' ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </span>
                        ) : status === 'success' ? (
                            <span className="flex items-center justify-center gap-2 text-green-200">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Submitted
                            </span>
                        ) : (
                            'Submit Application'
                        )}
                    </button>

                    {status === 'error' && (
                        <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg border border-red-100">
                            Something went wrong. Please try again.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}

export default NewEntry;
