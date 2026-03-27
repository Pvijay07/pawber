"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRazorpay = getRazorpay;
const razorpay_1 = __importDefault(require("razorpay"));
const config_1 = require("../../config");
let razorpayInstance = null;
function getRazorpay() {
    if (!razorpayInstance) {
        if (!config_1.env.RAZORPAY_KEY_ID || !config_1.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay credentials not configured');
        }
        razorpayInstance = new razorpay_1.default({
            key_id: config_1.env.RAZORPAY_KEY_ID,
            key_secret: config_1.env.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayInstance;
}
//# sourceMappingURL=razorpay.js.map