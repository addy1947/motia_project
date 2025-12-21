import React, { useState, useEffect } from 'react';

// Define components outside of the main component to prevent re-creation on render
const SectionHeader = ({ title, icon }) => (
    <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-2">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
);

const InputField = ({ label, name, type = "text", required = false, placeholder, className = "", value, onChange }) => (
    <div className={`flex flex-col gap-1 ${className}`}>
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 transition-all duration-200 hover:bg-white hover:shadow-sm"
        />
    </div>
);

const SelectField = ({ label, name, options, required = false, value, onChange }) => (
    <div className="flex flex-col gap-1">
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            required={required}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 transition-all duration-200 hover:bg-white hover:shadow-sm appearance-none"
        >
            <option value="">Select an option</option>
            {options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
            ))}
        </select>
    </div>
);

const EmployeeDetailsForm = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        dob: '',
        mobile: '',
        gender: '',
        residenceAddress: '',
        presentAddress: '',
        altMobile: '',
        emergencyName: '',
        emergencyContact: '',
        emergencyRelation: '',
        shirtSize: '',
        bankAccount: '',
        ifscCode: '',
        uan: ''
    });

    const [status, setStatus] = useState({ type: '', message: '' });
    const [submitting, setSubmitting] = useState(false);

    // Extract Token
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');

    // Cookie Helpers
    const setCookie = (name, value, days) => {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (encodeURIComponent(value) || "") + expires + "; path=/";
    };

    const getCookie = (name) => {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    };

    useEffect(() => {
        // Load Draft
        const savedDraft = getCookie('employeeFormDraft');
        if (savedDraft) {
            try {
                const parsed = JSON.parse(savedDraft);
                setFormData(prev => ({ ...prev, ...parsed }));
                setStatus({ type: 'info', message: 'Loaded saved draft.' });
                setTimeout(() => setStatus({ type: '', message: '' }), 3000);
            } catch (e) {
                console.error("Error parsing draft cookie", e);
            }
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCopyAddress = () => {
        setFormData(prev => ({ ...prev, presentAddress: prev.residenceAddress }));
    };

    const handleSaveDraft = () => {
        setCookie('employeeFormDraft', JSON.stringify(formData), 7);
        setStatus({ type: 'success', message: 'Draft saved successfully to browser cookies.' });
        setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus({ type: '', message: '' });

        if (!token) {
            // No-op for now based on previous instructions/usage
        }

        try {
            const response = await fetch(`http://localhost:3000/onboarding/details`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token || 'demo-token', // Fallback for UI testing
                    details: formData
                })
            });

            const result = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: 'Details submitted successfully!' });
                setCookie('employeeFormDraft', '', -1); // Clear draft
            } else {
                setStatus({ type: 'error', message: result.error || 'Submission failed.' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error. Please ensure the backend is running.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
            {/* Background decoration matching Respond.jsx */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                        Employee Onboarding
                    </h1>
                    <p className="text-gray-500 font-medium">Please complete your profile details below.</p>
                </div>

                {/* Status Message */}
                {status.message && (
                    <div className={`mb-8 p-4 rounded-xl flex items-center justify-center gap-2 shadow-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        status.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                        <span>{status.message}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mb-24 space-y-8">

                    {/* Section 1: Personal Details */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
                        <SectionHeader title="Personal Details" icon="👤" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label="Full Name"
                                name="fullName"
                                required
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                            <InputField
                                label="Date of Birth"
                                name="dob"
                                type="date"
                                required
                                value={formData.dob}
                                onChange={handleChange}
                            />
                            <SelectField
                                label="Gender"
                                name="gender"
                                options={['Male', 'Female', 'Other', 'Prefer not to say']}
                                required
                                value={formData.gender}
                                onChange={handleChange}
                            />
                            <SelectField
                                label="T-Shirt Size"
                                name="shirtSize"
                                options={['XS', 'S', 'M', 'L', 'XL', 'XXL']}
                                required
                                value={formData.shirtSize}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Section 2: Contact Info */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
                        <SectionHeader title="Contact Information" icon="📞" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label="Mobile Number"
                                name="mobile"
                                type="tel"
                                required
                                placeholder="+91 98765 43210"
                                value={formData.mobile}
                                onChange={handleChange}
                            />
                            <InputField
                                label="Alternate Mobile (Optional)"
                                name="altMobile"
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={formData.altMobile}
                                onChange={handleChange}
                            />
                            <InputField
                                label="Emergency Contact Name"
                                name="emergencyName"
                                required
                                placeholder="Parent / Spouse Name"
                                value={formData.emergencyName}
                                onChange={handleChange}
                            />
                            <InputField
                                label="Emergency Contact Number"
                                name="emergencyContact"
                                type="tel"
                                required
                                placeholder="+91 ..."
                                value={formData.emergencyContact}
                                onChange={handleChange}
                            />
                            <InputField
                                label="Emergency Relationship"
                                name="emergencyRelation"
                                required
                                placeholder="Father / Spouse / Sister"
                                value={formData.emergencyRelation}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Section 3: Address */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
                        <SectionHeader title="Address Details" icon="🏠" />
                        <div className="space-y-6">

                            <div className="flex flex-col gap-2">
                                <label htmlFor="residenceAddress" className="text-sm font-medium text-gray-700">
                                    Residence Address <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="residenceAddress"
                                    id="residenceAddress"
                                    rows="3"
                                    value={formData.residenceAddress}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 transition-all duration-200 hover:bg-white hover:shadow-sm resize-none"
                                    placeholder="Permanent Address"
                                />
                            </div>

                            <div className="flex flex-col gap-2 relative">
                                <div className="flex justify-between items-end">
                                    <label htmlFor="presentAddress" className="text-sm font-medium text-gray-700">
                                        Present Address <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleCopyAddress}
                                        className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 py-1.5 px-3 rounded-lg transition-colors border border-blue-100 font-semibold"
                                    >
                                        Same as Residence
                                    </button>
                                </div>
                                <textarea
                                    name="presentAddress"
                                    id="presentAddress"
                                    rows="3"
                                    value={formData.presentAddress}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 placeholder-gray-400 transition-all duration-200 hover:bg-white hover:shadow-sm resize-none"
                                    placeholder="Current Address"
                                />
                            </div>

                        </div>
                    </div>

                    {/* Section 4: Banking & Work */}
                    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
                        <SectionHeader title="Banking & Work Details" icon="💼" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                label="Bank Account Number"
                                name="bankAccount"
                                type="text"
                                required
                                placeholder="Account Number"
                                value={formData.bankAccount}
                                onChange={handleChange}
                            />
                            <InputField
                                label="IFSC Code"
                                name="ifscCode"
                                type="text"
                                required
                                placeholder="SBIN000...."
                                className="uppercase"
                                value={formData.ifscCode}
                                onChange={handleChange}
                            />
                            <InputField
                                label="Previous Employer UAN"
                                name="uan"
                                type="text"
                                placeholder="UAN Number (if any)"
                                value={formData.uan}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="max-w-4xl mx-auto flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={handleSaveDraft}
                                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all border border-gray-200"
                            >
                                Save as Draft
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-8 py-3 bg-black hover:bg-gray-800 text-white rounded-xl font-bold shadow-lg shadow-gray-200 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Submitting...' : 'Submit Details'}
                            </button>
                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EmployeeDetailsForm;
