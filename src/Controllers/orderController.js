const Order = require("../Models/Order");
const User = require("../Models/User");
const Ingredient = require("../Models/Ingredient");

const checkout = (req, res) => {
	if (
		(req.user.role === "customer" || req.user.role === "waiter") &&
		req.body.onSpot !== undefined
	) {
		User.findById(req.user._id)
			.populate({
				path: "cart",
				populate: {
					path: "menuItem",
					populate: { path: "ingredients.ingredient" },
				},
			})
			.select("cart -_id")
			.exec((err, doc) => {
				if (err) {
					res.status(500).json({
						message: "An error occured while querying the db.",
					});
				} else {
					if (doc.cart.length === 0) {
						res.status(400).json({ message: "cart is empty." });
					} else {
						let items = [];
						let totalCost = 0;
						doc.cart.forEach((item) => {
							const newItem = {
								menuItem: item.menuItem,
								amount: item.amount,
								cost: item.amount * item.menuItem.price,
							};
							totalCost += item.amount * item.menuItem.price;
							items.push(newItem);
						});
						const order = new Order({
							items: items,
							totalCost: totalCost,
							onSpot: req.body.onSpot,
							preferences: req.body.preferences,
							customer:
								req.user.role === "customer"
									? req.user.email
									: req.body.email,
						});

						order.save((err, newOrder) => {
							if (err) {
								res.status(500).json({
									message: "couldn't save order.",
								});
							} else {
								req.user.cart = [];
								req.user.save((err, user) => {
									if (err) {
										res.status(500).json({
											message:
												"couldn't clear cart but the order is created.",
										});
									} else {
										res.status(200).json(newOrder);
									}
								});
							}
						});
					}
				}
			});
	} else {
		if (req.body.onSpot === undefined) {
			res.status(400).json({
				message: "You must specify wether you will eat on spot or not.",
			});
		} else {
			res.status(401).json({ message: "Unauthorized" });
		}
	}
};

const confirmOrder = (req, res) => {
	if (req.user.role === "waiter") {
		if (req.body.orderId && req.body.confirmed !== undefined) {
			if (req.body.confirmed) {
				Order.findById(req.body.orderId)
					.populate({
						path: "items",
						populate: {
							path: "menuItem",
							populate: { path: "ingredients.ingredient" },
						},
					})
					.exec((err, order) => {
						if (err) {
							res.status(500).json({
								message:
									"An error occured while querying the database",
							});
						} else {
							if (order) {
								//TODO: we need to be able to remove some stock
								let ingredients = [];
								order.items.forEach((item) => {
									item.menuItem.ingredients.forEach(
										(ingredient) => {
											let ingredientIndex = null;
											for (
												i = 0;
												i < ingredients.length;
												i++
											) {
												if (
													ingredient.ingredient
														._id ===
													ingredients[i]._id
												) {
													ingredientIndex = i;
												}
											}

											if (ingredientIndex !== null) {
												ingredients[
													ingredientIndex
												].stock -=
													ingredient.amountUsed *
													item.amount;
											} else {
												ingredients.push({
													_id: ingredient.ingredient
														._id,
													stock:
														ingredient.ingredient
															.stock -
														ingredient.amountUsed *
															item.amount,
												});
											}
										}
									);
								});
								let confirmStock = true;

								for (i = 0; i < ingredients.length; i++) {
									if (ingredients[i].stock < 0) {
										confirmStock = false;
										break;
									}
								}
								if (confirmStock) {
									order.pending = false;
									order.items.forEach((item) => {
										item.preparing = true;
									});
									order.save((err, newOrder) => {
										if (err) {
											res.status(500).json({
												message:
													"Couldn't modify the order.",
											});
										} else {
											ingredients.forEach(
												(ingredient) => {
													Ingredient.findByIdAndUpdate(
														ingredient._id,
														{
															stock: ingredient.stock,
														},
														(err, doc) => {
															if (err) {
																console.log(
																	err
																);
															}
														}
													);
												}
											);
											res.status(200).json(newOrder);
										}
									});
								} else {
									res.status(400).json({
										message:
											"You don't have enough ingredients.",
									});
								}
							} else {
								res.status(400).json({
									message:
										"couldn't find the order that you wanted.",
								});
							}
						}
					});
			} else {
				Order.findByIdAndDelete(req.body.orderId, (err, doc) => {
					if (err) {
						res.status(500).json({
							message:
								"An error occured while querying the database.",
						});
					} else {
						if (doc) {
							res.status(200).json({ message: "Order deleted." });
						} else {
							res.status(400).json({
								message: "Couldn't deleted the given order.",
							});
						}
					}
				});
			}
		} else {
			res.status(400).json({ message: "a value is missing" });
		}
	} else {
		res.status(401).json({ message: "Unauthorized." });
	}
};

module.exports = {
	checkout: checkout,
	confirmOrder: confirmOrder,
};
