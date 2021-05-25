const userRouter = require("./userRouter");

//routing system for user and city
module.exports = {
	routes: (app) => {
		app.get("/", (req, res) => {
			res.send(
				"welcome to the good fork api! you aren't welcome here :3"
			);
		});
		app.use("/user", userRouter);
	},
};
