const express = require("express");
const passport = require("passport");
const passportConfig = require("../auth/passport");
const reservationRouter = express.Router();
const { makeReservation } = require("../Controllers/reservationController");

reservationRouter.post(
	"/make",
	passport.authenticate("jwt", { session: false }),
	makeReservation
);

module.exports = reservationRouter;
