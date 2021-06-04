const express = require("express");
const passport = require("passport");
const passportConfig = require("../auth/passport");
const tableRouter = express.Router();
const {
	makeTableArrangement,
	updateTableArrangement,
	getTableArrangement,
} = require("../Controllers/tableController");

// tableRouter.post(
// 	"/make-arrangement",
// 	passport.authenticate("jwt", { session: false }),
// 	makeTableArrangement
// );

tableRouter.put(
	"/update-arrangement",
	passport.authenticate("jwt", { session: false }),
	updateTableArrangement
);

tableRouter.get(
	"/get-arrangement",
	passport.authenticate("jwt", { session: false }),
	getTableArrangement
);

module.exports = tableRouter;
