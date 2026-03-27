"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = exports.getRazorpay = exports.isSupabaseConfigured = exports.createSupabaseClient = exports.supabasePublic = exports.supabaseAdmin = void 0;
var supabase_1 = require("./supabase");
Object.defineProperty(exports, "supabaseAdmin", { enumerable: true, get: function () { return supabase_1.supabaseAdmin; } });
Object.defineProperty(exports, "supabasePublic", { enumerable: true, get: function () { return supabase_1.supabasePublic; } });
Object.defineProperty(exports, "createSupabaseClient", { enumerable: true, get: function () { return supabase_1.createSupabaseClient; } });
Object.defineProperty(exports, "isSupabaseConfigured", { enumerable: true, get: function () { return supabase_1.isSupabaseConfigured; } });
var razorpay_1 = require("./razorpay");
Object.defineProperty(exports, "getRazorpay", { enumerable: true, get: function () { return razorpay_1.getRazorpay; } });
var logger_1 = require("./logger");
Object.defineProperty(exports, "createLogger", { enumerable: true, get: function () { return logger_1.createLogger; } });
//# sourceMappingURL=index.js.map