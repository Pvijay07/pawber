"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletController = exports.WalletController = void 0;
const wallet_service_1 = require("./wallet.service");
class WalletController {
    async get(req, res, _n) {
        const r = await wallet_service_1.walletService.getOrCreate(req.user.id);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async transactions(req, res, _n) {
        const query = {
            type: req.query.type,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0,
        };
        const r = await wallet_service_1.walletService.getTransactions(req.user.id, query);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async addFunds(req, res, _n) {
        const r = await wallet_service_1.walletService.addFunds(req.user.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async pay(req, res, _n) {
        const r = await wallet_service_1.walletService.pay(req.user.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
    async autoRecharge(req, res, _n) {
        const r = await wallet_service_1.walletService.updateAutoRecharge(req.user.id, req.body);
        return res.status(r.success ? 200 : r.statusCode).json(r.success ? { success: true, data: r.data } : { success: false, error: { message: r.error } });
    }
}
exports.WalletController = WalletController;
exports.walletController = new WalletController();
//# sourceMappingURL=wallet.controller.js.map