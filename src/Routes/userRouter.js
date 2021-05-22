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

module.exports = userRouter;
