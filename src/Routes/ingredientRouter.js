const express = require("express");
const passport = require("passport");
const passportConfig = require("../auth/passport");
const ingredientRouter = express.Router();
const {
	addIngredient,
	updateStock,
	deleteIngredient,
} = require("../Controllers/ingredientController");

ingredientRouter.post(
	"/add",
	passport.authenticate("jwt", { session: false }),
	addIngredient
);

ingredientRouter.put(
	"/update-stock",
	passport.authenticate("jwt", { session: false }),
	updateStock
);

ingredientRouter.delete(
	"/delete",
	passport.authenticate("jwt", { session: false }),
	deleteIngredient
);

module.exports = ingredientRouter;
