const User = require("../Models/User");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const MenuItem = require("../Models/MenuItem");
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
				balance: 0,
			});
			//save user
			newUser.save((err, user) => {
				if (err)
					res.status(500).json({
						message:
							"An Error Occured while saving this new entry.",
						msgError: true,
					});
				else {
					res.status(201).json({
						id: user._id,
						email: email,
						firstName: firstName,
						lastName: lastName,
						role: role,
						balance: newUser.balance,
						cart: [],
					});
				}
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
	if (req.headers.origin) {
		res.clearCookie("access-token", {
			domain: "guillaumeblackburn.me",
			path: "/",
			secure: true,
		}); //clear cookie from the user's browser
		res.clearCookie("auth-user", {
			domain: "guillaumeblackburn.me",
			path: "/",
			secure: true,
		});
	} else {
		res.clearCookie("access-token"); //clear cookie from the user's browser
		res.clearCookie("auth-user");
	}
	res.json({ user: { email: "", role: "" }, success: true });
};

const login = (req, res) => {
    if (req.isAuthenticated()) {
        const { _id, email, firstName, lastName, role } = req.user;
        const token = signToken(_id);
        const cookiesParams = setCookiesOptions(req.headers.origin);

        res.cookie("access-token", token, cookiesParams[0]);
        res.cookie("auth-user", "authenticated!", cookiesParams[1]); // cookie that can be read from the web client
        User.findById(_id)
            .populate("cart.menuItem")
            .exec((err, user) => {
                if (err)
                    res.status(500).json({
                        message:
                            "There was an error while querying the database",
                        msgError: true,
                    });
                res.status(200).json({
                    id: _id,
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    role: role,
                    balance: req.user.balance,
                    cart: user.cart,
                });
            });
    }
};

const setCookiesOptions = (isFromDomain) => {
	const params = [
		{
			maxAge: 7 * 24 * 60 * 60 * 1000,
			httpOnly: true,
			sameSite: "None",
			// secure: true,
		},
		{
			maxAge: 7 * 24 * 60 * 60 * 1000,
			sameSite: "None",
			// secure: true,
		},
	];
	if (isFromDomain) {
		params[0].domain = "guillaumeblackburn.me";
		params[1].domain = "guillaumeblackburn.me";
		return params;
	} else {
		return params;
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

const addToCart = (req, res) => {
	if (req.body.menuItem && req.body.amount > 0) {
		var menuItem = mongoose.Types.ObjectId(req.body.menuItem);

		MenuItem.findOne({ _id: menuItem }, (err, item) => {
			if (err)
				return res.status(500).json({ message: "An error occurred." });

			if (!item)
				return res
					.status(500)
					.json({ message: "You chose the wrong dish, fool" });

			let isInCart = false;
			let index;

			req.user.cart.forEach((e, i) => {
				if (e.menuItem == req.body.menuItem) {
					isInCart = true;
					index = i;
				}
			});
			if (isInCart) {
				req.user.cart[index].amount += Number(req.body.amount);
			} else
				req.user.cart.push({
					menuItem: { _id: req.body.menuItem },
					amount: req.body.amount,
				});

			req.user.save((err, user) => {
				if (err)
					return res
						.status(500)
						.json({ message: "Something fucked up." });

				User.populate(
					user,
					{ path: "cart.menuItem" },
					(err, newCartUser) => {
						if (err)
							res.status(500).json({
								message:
									"An error occured while querying the database (try to refresh the page).",
							});
						else res.status(200).json(newCartUser.cart);
					}
				);
			});
		});
	} else {
		res.status(400).json({
			message: "You must provide an id and a valid amount!",
		});
	}
};

const getCart = (req, res) => {
	User.findById(req.user._id)
		.populate("cart.menuItem")
		.exec((err, user) => {
			if (err)
				res.status(500).json({
					message: "An error occured while querying the database",
				});
			else res.status(200).json(user.cart);
		});
};

const removeItemFromCart = (req, res) => {
	if (req.body.menuItem) {
		MenuItem.findById(req.body.menuItem, (err, item) => {
			if (err)
				return res.status(500).json({ message: "An error occurred." });

			if (!item)
				return res
					.status(500)
					.json({ message: "You chose the wrong dish, fool" });

			for (i = 0; i < req.user.cart.length; i++) {
				if (req.user.cart[i].menuItem == req.body.menuItem) {
					req.user.cart.splice(i, 1);
					break;
				}
			}

			req.user.save((err, user) => {
				if (err)
					return res
						.status(500)
						.json({ message: "Something fucked up." });

				User.populate(
					user,
					{ path: "cart.menuItem" },
					(err, newCartUser) => {
						if (err)
							res.status(500).json({
								message:
									"An error occured while querying the database (try to refresh the page).",
							});
						else res.status(200).json(newCartUser.cart);
					}
				);
			});
		});
	} else {
		res.status(400).json({
			message: "You must provide an id!",
		});
	}
};

const removeAmountFromCart = (req, res) => {
	if (req.body.menuItem) {
		MenuItem.findById(req.body.menuItem, (err, item) => {
			if (err)
				return res.status(500).json({ message: "An error occurred." });

			if (!item)
				return res
					.status(500)
					.json({ message: "You chose the wrong dish, fool" });

			for (i = 0; i < req.user.cart.length; i++) {
				if (req.user.cart[i].menuItem == req.body.menuItem) {
					req.user.cart[i].amount -= req.body.amount;
					if (req.user.cart[i].amount <= 0) {
						req.user.cart.splice(i, 1);
					}
					break;
				}
			}

			req.user.save((err, user) => {
				if (err)
					return res
						.status(500)
						.json({ message: "Something fucked up." });

				User.populate(
					user,
					{ path: "cart.menuItem" },
					(err, newCartUser) => {
						if (err)
							res.status(500).json({
								message:
									"An error occured while querying the database (try to refresh the page).",
							});
						else res.status(200).json(newCartUser.cart);
					}
				);
			});
		});
	} else {
		res.status(400).json({
			message: "You must provide an id!",
		});
	}
};

module.exports = {
	registerCustomer: registerCustomer,
	registerStaff: registerStaff,
	login: login,
	logout: logout,
	listStaff: listStaff,
	addToCart: addToCart,
	removeItemFromCart: removeItemFromCart,
	getCart: getCart,
	removeAmountFromCart: removeAmountFromCart,
};
