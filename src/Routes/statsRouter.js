const express = require("express");
const passport = require("passport");
const passportConfig = require("../auth/passport");
const statsRouter = express.Router();
const {
	getStatsForToday,
	getStatsFromDate,
} = require("../Controllers/statsController");

statsRouter.get(
	"/today",
	passport.authenticate("jwt", { session: false }),
	getStatsForToday
);

statsRouter.get(
	"/from-date",
	passport.authenticate("jwt", { session: false }),
	getStatsFromDate
);

module.exports = statsRouter;
