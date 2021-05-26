const Ingredient = require("../Models/Ingredient");

const addIngredient = (req, res) => {
	if (req.user.role !== "admin")
		res.status(401).json({ message: "Unauthorized", msgError: true });
	else {
		if (req.body.name && req.body.stock) {
			const ingredient = new Ingredient({
				name: req.body.name,
				stock: req.body.stock,
			});
			ingredient.save((err) => {
				if (err) {
					if (err.code === 11000) {
						res.status(400).json({
							message: "This ingredient already exists.",
							msgError: true,
						});
					} else {
						res.status(500).json({
							message:
								"An Error Occured while querying the database.",
							msgError: true,
						});
					}
				} else
					res.status(201).json({
						message: "ingredient successfully created.",
						msgError: false,
					});
			});
		} else {
			res.status(400).json({
				message: "The name or stock value is missing!",
			});
		}
	}
};

const updateStock = (req, res) => {
	if (req.user.role !== "admin")
		res.status(401).json({ message: "Unauthorized", msgError: true });
	else {
		if (req.body.id) {
			Ingredient.findByIdAndUpdate(
				req.body.id,
				{ stock: req.body.stock },
				(err, doc) => {
					if (err) {
						res.status(500).json({
							message:
								"An Error Occured while querying the database.",
							msgError: true,
						});
					} else {
						if (doc) {
							res.status(200).json({
								message: "successfully saved",
								msgError: false,
							});
						} else {
							res.status(400).json({
								message:
									"The id value provided was probably wrong...",
								msgError: true,
							});
						}
					}
				}
			);
		} else {
			res.status(400).json({
				message: "The id value is missing!",
				msgError: true,
			});
		}
	}
};

const deleteIngredient = (req, res) => {
	if (req.user.role !== "admin")
		res.status(401).json({ message: "Unauthorized", msgError: true });
	else {
		if (req.body.id) {
			Ingredient.findByIdAndDelete(req.body.id, (err, doc) => {
				if (err) {
					res.status(500).json({
						message:
							"An Error Occured while querying the database.",
						msgError: true,
					});
				} else {
					if (doc) {
						res.status(200).json({
							message: "successfully deleted",
							msgError: false,
						});
					} else {
						res.status(400).json({
							message:
								"The id value provided was probably wrong...",
							msgError: true,
						});
					}
				}
			});
		} else {
			res.status(400).json({
				message: "The id value is missing!",
				msgError: true,
			});
		}
	}
};

module.exports = {
	addIngredient: addIngredient,
	updateStock: updateStock,
	deleteIngredient: deleteIngredient,
};
