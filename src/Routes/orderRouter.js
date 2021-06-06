const express = require("express");
const passport = require("passport");
const passportConfig = require("../auth/passport");
const orderRouter = express.Router();
const {
	checkout,
	confirmOrder,
	getUserOrders,
	getOrdersForWaiters,
} = require("../Controllers/orderController");

orderRouter.post(
	"/checkout",
	passport.authenticate("jwt", { session: false }),
	checkout
);

orderRouter.post(
	"/confirm",
	passport.authenticate("jwt", { session: false }),
	confirmOrder
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

module.exports = orderRouter;
