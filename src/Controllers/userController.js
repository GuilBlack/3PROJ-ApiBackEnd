const User = require("../Models/User");
const jwt = require("jsonwebtoken");
const passportConfig = require("../auth/passport");

const register = (req, res, role) => {
	const { email, firstName, lastName, password } = req.body; //extract username and passwd from the req
	//find if there is a user that already exists with this username
	User.findOne({ email: email }, (err, user) => {
		if (err)
			res.status(500).json({
				message: "An Error Occured while querying the database.",
				msgError: true,
			});

		if (user)
			//if user already exists, the user will not be able to register
			res.status(400).json({
				message: "This email is already taken",
				user: user,
				msgError: true,
			});
		else {
			//create new user model
			const newUser = new User({
				email: email,
				firstName: firstName,
				lastName: lastName,
				password: password,
				role: role,
			});
			//save user
			newUser.save((err, user) => {
				if (err)
					res.status(500).json({
						message:
							"An Error Occured while saving this new entry.",
						msgError: true,
					});
				else
					res.status(201).json({
						id: user._id,
						email: email,
						firstName: firstName,
						lastName: lastName,
						role: role,
					});
			});
		}
	});
};

const registerCustomer = (req, res) => {
	if (!req.body.role) register(req, res, "customer");
	else
		res.status(401).json({
			message: "you can't input a role",
			msgError: true,
		});
};

const registerStaff = (req, res) => {
	if (req.user.role !== "admin")
		res.status(401).json({ message: "Unauthorized", msgError: true });
	else {
		const { role } = req.body;
		if (role === "barman" || role === "waiter" || role === "cook")
			register(req, res, role);
		else
			res.status(400).json({
				message: "the role must be barman, waiter or cook",
				msgError: true,
			});
	}
};

const logout = (req, res) => {
	res.clearCookie("access-token"); //clear cookie from the user's browser
	res.clearCookie("auth-user");
	res.json({ user: { email: "", role: "" }, success: true });
};

const login = (req, res) => {
	if (req.isAuthenticated()) {
		const { _id, email, firstName, lastName, role } = req.user;
		const token = signToken(_id);
		res.cookie("access-token", token, {
			maxAge: 7 * 24 * 60 * 60 * 1000,
			httpOnly: true,
			sameSite: "None",
			secure: true,
			domain: "guillaumeblackburn.me",
		});
		res.cookie("auth-user", "authenticated!", {
			maxAge: 7 * 24 * 60 * 60 * 1000,
			sameSite: "None",
			secure: true,
			domain: "guillaumeblackburn.me",
		}); // cookie that can be read from the web client
		res.status(200).json({
			id: _id,
			email: email,
			firstName: firstName,
			lastName: lastName,
			role: role,
		});
	}
};

const listStaff = (req, res) => {
	if (req.user.role !== "admin")
		res.status(401).json({ message: "Unauthorized", msgError: true });
	else {
		User.find({ role: ["waiter", "cook", "barman"] })
			.select("email firstName lastName role -_id")
			.exec((err, users) => {
				if (err)
					res.status(500).json({
						message:
							"An error occured while querying the database.",
					});

				res.status(200).json(users);
			});
	}
};

const signToken = (userID) => {
	//setting up the jwt token
	return jwt.sign(
		{
			issuer: "www.thegoodfork.com",
			sub: userID,
		},
		"I l0v3 c4tS mOR3 tH4n D0gS", //secret
		{ algorithm: "HS512", expiresIn: "7 days" } //sets max age and encryption algorithm for this token
	);
};

module.exports = {
	registerCustomer: registerCustomer,
	registerStaff: registerStaff,
	login: login,
	logout: logout,
	listStaff: listStaff,
};
