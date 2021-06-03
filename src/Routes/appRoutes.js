const userRouter = require("./userRouter");
const ingredientRouter = require("./ingredientRouter");
const menuRouter = require("./menuRouter");
const tableRouter = require("./tableRoute");

//routing system for user and city
module.exports = {
	routes: (app) => {
		app.get("/", (req, res) => {
			res.send(
				"welcome to the good fork api! you aren't welcome here :3"
			);
		});
		app.use("/user", userRouter);
		app.use("/ingredient", ingredientRouter);
		app.use("/menu", menuRouter);
		app.use("/table", tableRouter);
	},
};
