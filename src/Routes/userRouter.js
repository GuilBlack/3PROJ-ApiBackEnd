const express = require("express");
const passport = require("passport");
const passportConfig = require("../auth/passport");
const userRouter = express.Router();
const {
	registerCustomer,
	registerStaff,
	login,
	logout,
	listStaff,
	addToCart,
	removeItemFromCart,
	getCart,
	removeAmountFromCart,
} = require("../Controllers/userController");

userRouter.post("/register-customer", registerCustomer);

userRouter.post(
	"/login",
	passport.authenticate("local", { session: false }), //used to authenticate user
	login
);

userRouter.get(
	"/logout",
	passport.authenticate("jwt", { session: false }), //used to see if the user is authorize
	logout
);

userRouter.post(
	"/register-staff",
	passport.authenticate("jwt", { session: false }), //used to see if the user is authorize
	registerStaff
);

userRouter.get(
	"/list-staff",
	passport.authenticate("jwt", { session: false }), //used to see if the user is authorize
	listStaff
);

userRouter.put(
	"/add-to-cart",
	passport.authenticate("jwt", { session: false }), //used to see if the user is authorize
	addToCart
);

userRouter.delete(
	"/delete-item-from-cart",
	passport.authenticate("jwt", { session: false }), //used to see if the user is authorize
	removeItemFromCart
);

userRouter.get(
	"/get-cart",
	passport.authenticate("jwt", { session: false }), //used to see if the user is authorize
	getCart
);

userRouter.put(
	"/remove-amount-from-cart",
	passport.authenticate("jwt", { session: false }), //used to see if the user is authorize
	removeAmountFromCart
);

module.exports = userRouter;
