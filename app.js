const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
var RateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const { dbPassword, dbUsername } = require("./dbUser");
const { routes } = require("./src/Routes/appRoutes");

const app = express();
const PORT = process.env.PORT || 6969;

const dbUri = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.cxlt6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const connectionParams = {
	useNewUrlParser: true,
	useCreateIndex: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
};

mongoose.Promise = global.Promise;
mongoose.connect(dbUri, connectionParams, (err) => {
	if (!err) {
		console.log("successfully connected to mongoDB");
	} else {
		console.log("an error occured while connecting to the db: " + err);
	}
});

var limiter = new RateLimit({
	windowMs: 60 * 1000, // 1 minutes
	max: 100, // limit each IP to 200 requests per windowMs
	delayMs: 0, // disable delaying - full speed until the max limit is reached
});
app.use(limiter);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
	cors({
		credentials: true,
		allowedHeaders: true,
		origin: "https://main.d2w06s7g7w0wak.amplifyapp.com",
	})
);
routes(app);

app.listen(PORT, () => {
	console.log(`node express API running on port ${PORT}`);
});
