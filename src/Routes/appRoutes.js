const userRouter = require("./userRouter");
const ingredientRouter = require("./ingredientRouter");
const menuRouter = require("./menuRouter");
const tableRouter = require("./tableRoute");
const reservationRouter = require("./reservationRouter");
const orderRouter = require("./orderRouter");
const statsRouter = require("./statsRouter");

//routing system for the app
//you'll see the full route to the endpoints if you go in the router files
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
		app.use("/reservation", reservationRouter);
		app.use("/order", orderRouter);
		app.use("/stats", statsRouter);
	},
};
