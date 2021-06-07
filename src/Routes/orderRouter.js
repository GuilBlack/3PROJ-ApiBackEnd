const express = require("express");
const passport = require("passport");
const passportConfig = require("../auth/passport");
const orderRouter = express.Router();
const {
	checkout,
	confirmOrder,
	getUserOrders,
	getOrdersForWaiters,
	getOrdersForCooks,
	markItemAsPrepared,
	checkoutForWaiter,
	markAsDelivered,
	getOrdersForBarmen,
} = require("../Controllers/orderController");

orderRouter.post(
	"/checkout",
	passport.authenticate("jwt", { session: false }),
	checkout
);

orderRouter.post(
	"/checkout-for-waiter",
	passport.authenticate("jwt", { session: false }),
	checkoutForWaiter
);

orderRouter.put(
	"/confirm",
	passport.authenticate("jwt", { session: false }),
	confirmOrder
);

orderRouter.put(
	"/mark-as-delivered",
	passport.authenticate("jwt", { session: false }),
	markAsDelivered
);

orderRouter.get(
	"/get-for-user",
	passport.authenticate("jwt", { session: false }),
	getUserOrders
);

orderRouter.get(
	"/get-for-waiter",
	passport.authenticate("jwt", { session: false }),
	getOrdersForWaiters
);

orderRouter.get(
	"/get-for-barmen",
	passport.authenticate("jwt", { session: false }),
	getOrdersForBarmen
);

orderRouter.get(
	"/get-for-cooks",
	passport.authenticate("jwt", { session: false }),
	getOrdersForCooks
);

orderRouter.put(
	"/mark-item-as-prepared",
	passport.authenticate("jwt", { session: false }),
	markItemAsPrepared
);

module.exports = orderRouter;
