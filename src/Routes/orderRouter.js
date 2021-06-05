const express = require("express");
const passport = require("passport");
const passportConfig = require("../auth/passport");
const orderRouter = express.Router();
const { checkout, confirmOrder } = require("../Controllers/orderController");

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

module.exports = orderRouter;
