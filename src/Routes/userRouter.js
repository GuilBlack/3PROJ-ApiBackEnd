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
	getCustomers,
	dummyRoute,
	dummyPost,
	addToCart
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

userRouter.put('/add-to-cart', passport.authenticate("jwt", { session: false }), addToCart);

userRouter.get("/get-customers", passport.authenticate("jwt", { session: false }), getCustomers);

userRouter.get('/dummyRoute', passport.authenticate("jwt", { session: false }), dummyRoute);

userRouter.post('/dummyPost', passport.authenticate("jwt", {session: false}), dummyPost);

module.exports = userRouter;
