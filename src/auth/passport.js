const passport = require("passport"),
	LocalStrategy = require("passport-local").Strategy,
	JwtStrategy = require("passport-jwt").Strategy;
const User = require("../Models/User");

//method used to extract the access token from the user's cookies
const cookieExtractor = (req) => {
	var token = null;
	if (req && req.cookies["access-token"]) token = req.cookies["access-token"];
	return token;
};

//used to authorized a user to access a route
passport.use(
	//this start uses the json web token
	new JwtStrategy(
		{
			jwtFromRequest: cookieExtractor, //the token
			secretOrKey: "I l0v3 c4tS mOR3 tH4n D0gS", //secret used to see if the token is valid
		},
		(jwtPayload, done) => {
			User.findById({ _id: jwtPayload.sub }, (err, user) => {
				// find the user associated to this token
				if (err) return done(err, false);
				if (user) return done(null, user);
				//return user else return response unauth
				else return done(null, false);
			});
		}
	)
);

//used to login a user
passport.use(
	//this strat uses a username (id) and a password
	new LocalStrategy((username, password, done) => {
		User.findOne({ email: username }, (err, user) => {
			if (err) return done(err);
			if (!user)
				return done(null, false, { message: "Incorrect email." });
			user.validatePassword(password, done); //function declared with the user schema to validate passwd
		});
	})
);
