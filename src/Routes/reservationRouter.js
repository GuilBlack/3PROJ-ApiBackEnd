const express = require("express");
const passport = require("passport");
const passportConfig = require("../auth/passport");
const reservationRouter = express.Router();
const {
	makeReservation,
	getUserReservations,
	getAllReservations,
} = require("../Controllers/reservationController");

reservationRouter.post(
	"/make",
	passport.authenticate("jwt", { session: false }),
	makeReservation
);

reservationRouter.get(
	"/get-for-user",
	passport.authenticate("jwt", { session: false }),
	getUserReservations
);

reservationRouter.get(
	"/get-all",
	passport.authenticate("jwt", { session: false }),
	getAllReservations
);

module.exports = reservationRouter;
