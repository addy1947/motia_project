import mongoose from 'mongoose';

const EmployeeSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    role: {
        type: String,
    },
    package: {
        type: String, // String to handle formatting or Number if pure value
    },
    token: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
        default: 'PENDING',
    },
    documents: {
        type: Map,
        of: String,
        default: {}
    },
    ocrData: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    details: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    welcomeKit: {
        status: String,
        trackingNumber: String,
        labelUrl: String,
        orderedAt: Date
    },
    workCredentials: {
        workEmail: String,
        initialPassword: String,
        generatedAt: Date
    },

    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Helper to prevent overwriting model during hot reloads
export default mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
