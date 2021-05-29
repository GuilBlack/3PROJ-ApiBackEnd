const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
var RateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const { dbPassword, dbUsername } = require("./dbUser");
const { routes } = require("./src/Routes/appRoutes");

const app = express();
const PORT = process.env.PORT || 6969;

// const dbUri = `mongodb+srv://${dbUsername}:${dbPassword}@cluster0.cxlt6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// const connectionParams = {
// 	useNewUrlParser: true,
// 	useCreateIndex: true,
// 	useUnifiedTopology: true,
// };

// mongoose.Promise = global.Promise;
// mongoose.connect(dbUri, connectionParams, (err) => {
// 	if (!err) {
// 		console.log("successfully connected to mongoDB");
// 	} else {
// 		console.log("an error occured while connecting to the db: " + err);
// 	}
// });

// mongoose connection
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/PROJ', {
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  useCreateIndex: true
});

// just to be sure that we're correctly connected
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log('Connected to MongoDB!');
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
		allowedHeaders: "Content-Type,Authorization",
		origin: "https://main.d2w06s7g7w0wak.amplifyapp.com",
	})
);
routes(app);

app.listen(PORT, () => {
	console.log(`node express API running on port ${PORT}`);
});
