const express = require("express");
const passport = require("passport");
const passportConfig = require("../auth/passport");
const menuRouter = express.Router();
const {
	addMenuCategory,
	addMenuItem,
	getAllCategories,
	deleteMenuItem,
	deleteCategory,
} = require("../Controllers/menuController");

menuRouter.post(
	"/add-menu-category",
	passport.authenticate("jwt", { session: false }),
	addMenuCategory
);

menuRouter.post(
	"/add-menu-item",
	passport.authenticate("jwt", { session: false }),
	addMenuItem
);

menuRouter.get(
	"/get-all-categories",
	passport.authenticate("jwt", { session: false }),
	getAllCategories
);

menuRouter.delete(
	"/delete-menu-item",
	passport.authenticate("jwt", { session: false }),
	deleteMenuItem
);

menuRouter.delete(
	"/delete-category",
	passport.authenticate("jwt", { session: false }),
	deleteCategory
);

module.exports = menuRouter;
