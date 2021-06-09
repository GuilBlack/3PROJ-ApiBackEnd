const Order = require("../Models/Order");
const User = require("../Models/User");
const Ingredient = require("../Models/Ingredient");

//checkout for customers
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
					//check if cart isn't empty
					if (doc.cart.length === 0) {
						res.status(400).json({ message: "cart is empty." });
					} else {
						let items = [];
						let totalCost = 0;
						//calculate cost of each dish + tocal cost of order
						doc.cart.forEach((item) => {
							const newItem = {
								menuItem: item.menuItem,
								amount: item.amount,
								cost: item.amount * item.menuItem.price,
							};
							totalCost += item.amount * item.menuItem.price;
							items.push(newItem);
						});
						//create new order
						const order = new Order({
							items: items,
							totalCost: totalCost,
							onSpot: req.body.onSpot,
							preferences: req.body.preferences,
							customer: req.user.email,
							customerName: `${req.user.firstName} ${req.user.lastName}`,
						});

						//save new order
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
					//check if cart is empty
					if (doc.cart.length === 0) {
						res.status(400).json({ message: "cart is empty." });
					} else {
						//check if this email has an account
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
										//calculate costs
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

//waiter confirmation if true confirm if false cancel
const confirmOrder = (req, res) => {
	if (req.user.role === "waiter") {
		if (req.body.orderId && req.body.confirmed !== undefined) {
			if (req.body.confirmed) {
				//confirm order
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
								//array of ingredients to check later if we have enough ingredients for this order
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

								//check if enough ingredients
								for (i = 0; i < ingredients.length; i++) {
									if (ingredients[i].stock < 0) {
										confirmStock = false;
										break;
									}
								}
								if (confirmStock) {
									//confirming and saving the order
									order.pending = false;
									order.items.forEach((item) => {
										item.preparing = true;
									});
									order.waiter = req.user._id;
									order.save((err, newOrder) => {
										if (err) {
											res.status(500).json({
												message:
													"Couldn't modify the order.",
											});
										} else {
											//update stock
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
											res.status(200).json({
												order: newOrder,
												message:
													"The order has been successfully confirmed. The stock has been updated.",
											});
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
				//cancel order
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

							order.save((err, cancelledOrder) => {
								if (err) {
									res.status(500).json({
										message:
											"An error occured while querying the database.",
									});
								} else {
									res.status(200).json({
										order: cancelledOrder,
										message:
											"Order cancelled because of lack of ingredients.",
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

//all gets methods are for retrieving orders for the different roles
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
					res.status(200).json(newOrders);
				}
			});
	} else {
		res.status(401).json({ message: "Unauthorized." });
	}
};

//for cooks and barmen when the dish/drinks is ready
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
					//search for item in order then check if it exists
					const index = order.items.findIndex((item) => {
						return item._id == req.body.itemId;
					});
					if (index === -1) {
						res.status(400).json({
							message: "Couldn't find the item.",
						});
					} else {
						//change preparing status and update order
						order.items[index].preparing = false;
						order.save((err, newOrder) => {
							if (err) {
								res.status(500).json({
									message:
										"An error occured while querying the database.",
								});
							} else {
								Order.populate(
									newOrder,
									{
										path: "items.menuItem",
										populate: {
											path: "menuCategory",
											match: {
												type:
													req.user.role === "cook"
														? { $ne: "Drinks" }
														: { $eq: "Drinks" },
											},
										},
									},
									(err, formattedOrder) => {
										if (err) {
											res.status(500).json({
												message:
													"An error occured while querying the database.",
											});
										} else {
											let items = [];
											formattedOrder.items.forEach(
												(item) => {
													if (
														item.menuItem
															.menuCategory !==
														null
													) {
														item.menuItem.menuCategory =
															item.menuItem.menuCategory._id;
														items.push(item);
													}
												}
											);
											formattedOrder.items = items;
											res.status(200).json(
												formattedOrder
											);
										}
									}
								);
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

//for waiter to change delivered status when the delivery of all the dishes/drinks if done
const markAsDelivered = (req, res) => {
	if (req.user.role === "waiter" && req.body.orderId) {
		Order.findById(req.body.orderId, (err, order) => {
			if (err) {
				res.status(500).json({
					message: "An error occured while querying the database.",
				});
			} else {
				//check if all the dishes/drinks are ready
				let checkIfReady = true;
				for (i = 0; i < order.items.length; i++) {
					if (order.items[i].preparing) {
						checkIfReady = false;
						break;
					}
				}
				if (checkIfReady) {
					//changing status + updating order
					order.delivered = true;
					order.save((err, newOrder) => {
						if (err) {
							res.status(500).json({
								message:
									"An error occured while querying the database.",
							});
						} else {
							res.status(200).json({
								order: newOrder,
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

//for users when they pay for an order. changes their balance and loyalty points
const markAsPaidForUser = (req, res) => {
	if (req.user.role === "customer") {
		Order.findById(req.body.orderId)
			.populate({ path: "waiter" })
			.exec((err, order) => {
				if (err) {
					res.status(500).json({
						message:
							"An error occured while querying the database.",
					});
				} else {
					if (order) {
						if (
							order.customer === req.user.email &&
							order.pending === false
						) {
							//calculate total cost
							let totalCost;
							if (Number(req.body.loyaltyPoints)) {
								totalCost =
									order.totalCost *
									(1 -
										Number(req.body.loyaltyPoints) /
											100000);
							} else {
								totalCost = order.totalCost;
							}

							if (Number(req.body.tip) > 0) {
								totalCost += Number(req.body.tip);
							}
							//check if user has enough $$$
							if (req.user.balance === undefined) {
								req.user.balance = 0;
							}
							if (
								totalCost > req.user.balance ||
								Number(req.body.loyaltyPoints) >
									req.user.loyaltyPoints
							) {
								if (
									Number(req.body.loyaltyPoints) >
									req.user.loyaltyPoints
								) {
									res.status(400).json({
										message:
											"You don't have enough loyalty points to pay for this order!",
									});
								} else {
									res.status(400).json({
										message:
											"You don't have enough credits to pay for this order!",
									});
								}
							} else {
								//change order paid status + updating it
								order.paid = true;
								order.save((err, newOrder) => {
									if (err) {
										res.status(500).json({
											message:
												"An error occured while querying the database.",
										});
									} else {
										//debiting total cost from user's balance
										req.user.balance -= totalCost;
										if (req.body.loyaltyPoints) {
											req.user.loyaltyPoints -= Number(
												req.body.loyaltyPoints
											);
										} else {
											req.user.loyaltyPoints +=
												order.totalCost * 100;
										}
										req.user.balance =
											Math.round(req.user.balance * 100) /
											100;
										req.user.save((err, customer) => {
											if (err) {
												res.status(500).json({
													message:
														"An error occured while querying the database.",
												});
											} else {
												//adding the tip to the waiter's balance
												if (
													order.waiter.balance ===
													undefined
												) {
													order.waiter.balance =
														Number(req.body.tip);
												} else {
													order.waiter.balance +=
														Number(req.body.tip);
												}
												User.updateOne(
													{ _id: order.waiter._id },
													{
														balance:
															order.waiter
																.balance,
													},
													(err, waiter) => {
														if (err) {
															console.log(
																`Couldn't add ${req.body.tip} to the waiter's balance.`
															);
														}
													}
												);
												res.status(200).json({
													message: `This transaction was approved. You now have ${customer.balance} credits on your account and ${customer.loyaltyPoints} loyalty points.`,
												});
											}
										});
									}
								});
							}
						} else {
							if (order.pending) {
								res.status(400).json({
									message:
										"You can't pay while the order is still pending.",
								});
							} else {
								res.status(400).json({
									message: "Couldn't find your order.",
								});
							}
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

const markAsPaidForWaiter = (req, res) => {
	if (req.user.role === "waiter" && req.body.orderId) {
		Order.findById(req.body.orderId, (err, order) => {
			if (err) {
				res.status(500).json({
					message: "An error occured while querying the database.",
				});
			} else {
				if (order) {
					if (!order.pending) {
						order.paid = true;
						order.save((err, newOrder) => {
							if (err) {
								res.status(500).json({
									message:
										"An error occured while querying the database.",
								});
							} else {
								res.status(200).json(newOrder);
							}
						});
					} else {
						res.status(400).json({
							message:
								"You can't pay while the order is still pending.",
						});
					}
				} else {
					res.status(400).json({
						message: "Couldn't find you order.",
					});
				}
			}
		});
	} else {
		if (!req.body.orderId) {
			res.status(401).json();
		} else {
			res.status(400).json({ message: "A value is missing" });
		}
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
	markAsPaidForWaiter: markAsPaidForWaiter,
};
