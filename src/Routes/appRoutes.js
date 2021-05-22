const userRouter = require("./userRouter");

//routing system for user and city
module.exports = {
	routes: (app) => {
		app.use("/user", userRouter);
	},
};
