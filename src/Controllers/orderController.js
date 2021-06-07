const Order = require("../Models/Order");
const User = require("../Models/User");
const Ingredient = require("../Models/Ingredient");

const checkout = (req, res) => {
	if (req.user.role === "customer" && req.body.onSpot) {
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
							customer: req.user.email,
							customerName: `${req.user.firstName} ${req.user.lastName}`,
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
		if (req.user.role !== "customer") {
			res.status(401).json({ message: "Unauthorized" });
		} else {
			res.status(400).json({
				message: "You must specify wether you will eat on spot or not.",
			});
		}
	}
};

const checkoutForWaiter = (req, res) => {
	if (
		req.user.role === "waiter" &&
		req.body.onSpot &&
		req.body.email &&
		req.body.name
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
						User.findOne(
							{ email: req.body.email },
							(err, customer) => {
								if (err) {
									res.status(500).json({
										message:
											"An error occured while querying the db.",
									});
								} else {
									if (customer) {
										res.status(400).json({
											message:
												"This customer is already registered.",
										});
									} else {
										let items = [];
										let totalCost = 0;
										doc.cart.forEach((item) => {
											const newItem = {
												menuItem: item.menuItem,
												amount: item.amount,
												cost:
													item.amount *
													item.menuItem.price,
											};
											totalCost +=
												item.amount *
												item.menuItem.price;
											items.push(newItem);
										});
										const order = new Order({
											items: items,
											totalCost: totalCost,
											onSpot: req.body.onSpot,
											preferences: req.body.preferences,
											customer: req.body.email,
											customerName: req.body.name,
										});
										order.save((err, newOrder) => {
											if (err) {
												res.status(500).json({
													message:
														"couldn't save order.",
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
														res.status(200).json(
															newOrder
														);
													}
												});
											}
										});
									}
								}
							}
						);
					}
				}
			});
	} else {
		if (req.user.role !== "waiter") {
			res.status(401).json({ message: "Unauthorized" });
		} else {
			res.status(400).json({
				message: "A value is missing.",
			});
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
									order.message = req.body.message;
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
				Order.findById(req.body.orderId).exec((err, order) => {
					if (err) {
						res.status(500).json({
							message:
								"An error occured while querying the database.",
						});
					} else {
						if (order) {
							order.cancelled = true;
							order.pending = false;
							order.message = req.body.message;

							order.save((err, cancelledOrder) => {
								if (err) {
									res.status(500).json({
										message:
											"An error occured while querying the database.",
									});
								} else {
									res.status(200).json({
										message: "Order cancelled.",
									});
								}
							});
						} else {
							res.status(400).json({
								message: "Couldn't cancel the given order.",
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

const getUserOrders = (req, res) => {
	if (req.user.role === "customer") {
		Order.find({ customer: req.user.email })
			.populate({ path: "items", populate: { path: "menuItem" } })
			.sort({ createdAt: -1 })
			.exec((err, orders) => {
				if (err)
					res.status(500).json({
						message: "Something went wrong with the database...",
					});
				else res.status(200).json(orders);
			});
	} else {
		res.status(401).json({ message: "Unauthorized." });
	}
};

const getOrdersForWaiters = (req, res) => {
	if (req.user.role === "waiter") {
		Order.find({
			$and: [
				{
					$or: [{ paid: false }, { delivered: false }],
				},
				{ cancelled: false },
			],
		})
			.populate({ path: "items", populate: { path: "menuItem" } })
			.sort({ createdAt: -1 })
			.exec((err, orders) => {
				if (err)
					res.status(500).json({
						message: "Something went wrong with the database...",
					});
				else res.status(200).json(orders);
			});
	} else {
		res.status(401).json({ message: "Unauthorized." });
	}
};

const getOrdersForCooks = (req, res) => {
	if (req.user.role === "cook") {
		Order.find({ "items.preparing": true, pending: false })
			.populate({
				path: "items.menuItem",
				populate: {
					path: "menuCategory",
					match: { type: { $ne: "Drinks" } },
				},
			})
			.sort({ createdAt: -1 })
			.exec((err, orders) => {
				if (err) {
					res.status(500).json({
						message:
							"An error occured while querying the database.",
					});
				} else {
					let newOrders = [];
					orders.forEach((order) => {
						let items = [];
						order.items.forEach((item) => {
							if (item.menuItem.menuCategory !== null) {
								item.menuItem.menuCategory =
									item.menuItem.menuCategory._id;
								items.push(item);
							}
						});
						if (items.length > 0) {
							order.items = items;
							newOrders.push(order);
						}
					});

					res.status(200).json(newOrders);
				}
			});
	} else {
		res.status(401).json({ message: "Unauthorized." });
	}
};

const getOrdersForBarmen = (req, res) => {
	if (req.user.role === "barman") {
		Order.find({ "items.preparing": true, pending: false })
			.populate({
				path: "items.menuItem",
				populate: {
					path: "menuCategory",
					match: { type: { $eq: "Drinks" } },
				},
			})
			.sort({ createdAt: -1 })
			.exec((err, orders) => {
				if (err) {
					res.status(500).json({
						message:
							"An error occured while querying the database.",
					});
				} else {
					let newOrders = [];
					orders.forEach((order) => {
						let items = [];
						order.items.forEach((item) => {
							if (item.menuItem.menuCategory !== null) {
								item.menuItem.menuCategory =
									item.menuItem.menuCategory._id;
								items.push(item);
							}
						});
						if (items.length > 0) {
							order.items = items;
							newOrders.push(order);
						}
					});
					res.status(200).json(orders);
				}
			});
	} else {
		res.status(401).json({ message: "Unauthorized." });
	}
};

const markItemAsPrepared = (req, res) => {
	if (req.user.role === "cook" || req.user.role === "barman") {
		if (req.body.itemId || req.body.orderId) {
			Order.findById(req.body.orderId, (err, order) => {
				if (err) {
					res.status(500).json({
						message:
							"An error occured while querying the database.",
					});
				} else {
					const index = order.items.findIndex((item) => {
						return item._id == req.body.itemId;
					});
					if (index === -1) {
						res.status(400).json({
							message: "Couldn't find the item.",
						});
					} else {
						order.items[index].preparing = false;
						order.save((err, newOrder) => {
							if (err) {
								res.status(500).json({
									message:
										"An error occured while querying the database.",
								});
							} else {
								res.status(200).json({
									message: "Marked as prepared.",
								});
							}
						});
					}
				}
			});
		} else {
			res.status(400).json({ message: "A value is missing!" });
		}
	} else {
		res.status(401).json({ message: "Unauthorized." });
	}
};

const markAsDelivered = (req, res) => {
	if (req.user.role === "waiter" && req.body.orderId) {
		Order.findById(req.body.orderId, (err, order) => {
			if (err) {
				res.status(500).json({
					message: "An error occured while querying the database.",
				});
			} else {
				let checkIfReady = true;
				for (i = 0; i < order.items.length; i++) {
					if (order.items[i].preparing) {
						checkIfReady = false;
						break;
					}
				}
				if (checkIfReady) {
					order.delivered = true;
					order.save((err, newOrder) => {
						if (err) {
							res.status(500).json({
								message:
									"An error occured while querying the database.",
							});
						} else {
							res.status(200).json({
								message: "Order successfully delivered.",
							});
						}
					});
				} else {
					res.status(400).json({
						message:
							"You can't mark the order as delivered if all the dishes aren't ready!",
					});
				}
			}
		});
	} else {
		if (req.user.role !== "waiter") {
			res.status(401).json({ message: "Unauthorized." });
		} else {
			res.status(400).json({ message: "A value is missing!" });
		}
	}
};

const markAsPaidForUser = (req, res) => {
	if (req.user.role === "customer") {
		Order.findById(req.body.orderId, (err, order) => {
			if (err) {
				res.status(500).json({
					message: "An error occured while querying the database.",
				});
			} else {
				if (order) {
					if (order.customer === req.user.email) {
						let totalCost = order.totalCost;
						if (Number(req.body.tip) > 0) {
							totalCost += tip;
						}
						if (req.user.balance === undefined) {
							req.user.balance = 0;
						}
						if (totalCost > req.user.balance) {
							res.status(400).json({
								message:
									"You don't have enough credits to pay for this order!",
							});
						} else {
							order.paid = true;
							order.save((err, newOrder) => {
								if (err) {
									res.status(500).json({
										message:
											"An error occured while querying the database.",
									});
								} else {
									req.user.balance -= totalCost;
									if (req.user.loyaltyPoints === undefined) {
										req.user.loyaltyPoints =
											order.totalCost * 10;
									} else {
										req.user.loyaltyPoints +=
											order.totalCost * 10;
									}
									req.user.save((err, customer) => {
										if (err) {
											res.status(500).json({
												message:
													"An error occured while querying the database.",
											});
										} else {
											res.status(200).json({
												message: `This transaction was approved. You now have ${customer.balance} credits on your account and ${customer.loyaltyPoints} loyalty points.`,
											});
										}
									});
								}
							});
						}
					} else {
						res.status(400).json({
							message: "Couldn't find your order.",
						});
					}
				} else {
					res.status(400).json({
						message: "Couldn't find your order.",
					});
				}
			}
		});
	} else {
		res.status(401).json({ message: "Unauthorized." });
	}
};

module.exports = {
	checkout: checkout,
	confirmOrder: confirmOrder,
	getUserOrders: getUserOrders,
	getOrdersForWaiters: getOrdersForWaiters,
	getOrdersForCooks: getOrdersForCooks,
	markItemAsPrepared: markItemAsPrepared,
	checkoutForWaiter: checkoutForWaiter,
	markAsDelivered: markAsDelivered,
	getOrdersForBarmen: getOrdersForBarmen,
	markAsPaidForUser: markAsPaidForUser,
};
