"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayKeyId = void 0;
exports.getRazorpay = getRazorpay;
exports.isRazorpayConfigured = isRazorpayConfigured;
const razorpay_1 = __importDefault(require("razorpay"));
const keyId = process.env.RAZORPAY_KEY_ID || '';
exports.razorpayKeyId = keyId;
const keySecret = process.env.RAZORPAY_KEY_SECRET || '';
let razorpayInstance = null;
function getRazorpay() {
    if (!razorpayInstance) {
        if (!keyId || !keySecret) {
            throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
        }
        razorpayInstance = new razorpay_1.default({
            key_id: keyId,
            key_secret: keySecret,
        });
    }
    return razorpayInstance;
}
/**
 * Returns true if Razorpay is configured with real credentials.
 */
function isRazorpayConfigured() {
    return !!keyId && !!keySecret;
}
//# sourceMappingURL=razorpay.js.map