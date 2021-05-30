const fs = require("fs");
const AWS = require("aws-sdk");
const MenuCategory = require("../Models/MenuCategory");
const MenuItem = require("../Models/MenuItem");
const { IncomingForm } = require("formidable");
const { v4: uuidv4 } = require("uuid");

const BUCKET_NAME = "cdn-the-good-fork";
AWS.config.loadFromPath("./src/auth/awsConfig.json");
const s3 = new AWS.S3();

const addMenuCategory = (req, res) => {
	if (req.user.role !== "admin")
		res.status(401).json({ message: "Unauthorized.", msgError: true });
	else {
		if (req.body.name && req.body.type) {
			const menuCategory = new MenuCategory({
				name: req.body.name,
				type: req.body.type,
			});
			menuCategory.save((err) => {
				if (err) {
					if (err.code === 11000) {
						res.status(400).json({
							message: "This category already exists.",
							msgError: true,
						});
					} else if (err.errors.type.properties.type === "enum") {
						res.status(400).json({
							message:
								"choose a type between Appetisers, Main Course, Side Dishes, Desserts or Drinks.",
							msgError: true,
						});
					} else {
						res.status(500).json({
							message:
								"An Error Occured while querying the database.",
							err: err,
							msgError: true,
						});
					}
				} else
					res.status(201).json({
						message: "Menu category successfully created.",
						msgError: false,
					});
			});
		} else {
			res.status(400).json({
				message: "The name or type value is missing!",
			});
		}
	}
};

const addMenuItem = (req, res) => {
	if (req.user.role !== "admin")
		res.status(401).json({ message: "Unauthorized.", msgError: true });
	else {
		const form = new IncomingForm();

		form.parse(req, (err, fields, files) => {
			if (err)
				res.status(500).json({
					message: "Something went wrong when parsing the form.",
					msgError: true,
				});
			else {
				if (
					fields.categoryId &&
					fields.name &&
					fields.ingredients &&
					fields.description &&
					fields.price &&
					files.imagePreview
				) {
					try {
						fields.ingredients = JSON.parse(fields.ingredients);
						MenuCategory.findById(
							fields.categoryId,
							(err, menuCategory) => {
								if (err) {
									if (err.name === "CastError")
										res.status(400).json({
											message:
												"Invalid menu category id.",
											msgError: true,
										});
									else
										res.status(500).json({
											message:
												"An Error Occured while querying the database.",
											msgError: true,
										});
								} else {
									if (menuCategory) {
										const fileContent = fs.readFileSync(
											files.imagePreview.path
										);
										const params = {
											Bucket: BUCKET_NAME,
											Key: `${uuidv4()}-${
												files.imagePreview.name
											}`,
											Body: fileContent,
											ContentType:
												files.imagePreview.type,
										};
										s3.upload(params, (err, data) => {
											if (err)
												res.status(500).json({
													message:
														"couldn't upload to s3",
													err: err,
													msgError: true,
												});
											else {
												try {
													fs.unlinkSync(
														files.imagePreview.path
													);
												} catch {
													console.log(
														"Couldn't delete tmp file."
													);
												}
												const menuItem = new MenuItem({
													name: fields.name,
													description:
														fields.description,
													imageUrl: data.Location,
													price: fields.price,
													menuCategory: {
														_id: fields.categoryId,
													},
													ingredients:
														fields.ingredients,
												});

												menuItem.save((err) => {
													if (err)
														if (err.code === 11000)
															res.status(
																400
															).json({
																message:
																	"This dish already exists.",
																msgError: true,
															});
														else
															res.status(
																500
															).json({
																message:
																	"An Error Occured while querying the database.",
																err: err,
																msgError: true,
															});
													else {
														menuCategory.menuItems.push(
															menuItem
														);
														menuCategory.save(
															(err) => {
																if (err)
																	res.status(
																		500
																	).json({
																		message:
																			"An Error Occured while querying the database.",
																		err: err,
																		msgError: true,
																	});
																else
																	res.status(
																		200
																	).json({
																		menuItem:
																			menuItem,
																	});
															}
														);
													}
												});
											}
										});
									} else {
										res.status(400).json({
											message:
												"Invalid menu category id.",
											msgError: true,
										});
									}
								}
							}
						);
					} catch {
						res.status(400).json({
							message: "Couldn't parse the ingredients.",
							msgError: true,
						});
					}
				} else {
					res.status(400).json({
						message: "a value is missing",
						msgError: true,
					});
				}
			}
		});
	}
};

const getAllCategories = (req, res) => {
	MenuCategory.find()
		.populate({
			path: "menuItems",
			populate: {
				path: "ingredients",
				populate: {
					path: "ingredient",
				},
			},
		})
		.exec((err, categories) => {
			if (err)
				res.status(500).json({
					message: "An Error Occured while querying the database.",
					err: err,
					msgError: true,
				});
			else res.status(200).json(categories);
		});
};

const deleteMenuItem = (req, res) => {
	if (req.user.role !== "admin")
		res.status(401).json({ message: "Unauthorized.", msgError: true });
	else {
		MenuItem.findByIdAndDelete(req.body.itemId)
			.populate({ path: "menuCategory" })
			.exec((err, menuItem) => {
				if (err) {
					if (err.name === "CastError")
						res.status(400).json({
							message: "Invalid menu item id.",
							msgError: true,
						});
					else
						res.status(500).json({
							message:
								"An Error Occured while querying the database. Couldn't remove the menu item.",
							msgError: true,
						});
				} else {
					if (menuItem) {
						const index = menuItem.menuCategory.menuItems.indexOf(
							menuItem._id
						);
						menuItem.menuCategory.menuItems.splice(index, 1);
						menuItem.menuCategory.save((err) => {
							if (err)
								res.status(500).json({
									message:
										"An Error Occured while querying the database. Couldn't remove the menu item from the menu category.",
									msgError: true,
								});
							else {
								const objectName = menuItem.imageUrl.substring(
									menuItem.imageUrl.lastIndexOf("/") + 1
								);
								const params = {
									Bucket: BUCKET_NAME,
									Key: objectName,
								};

								s3.deleteObject(params, (err, data) => {
									if (err)
										res.status(500).json({
											message:
												"Couldn't delete image from S3 bucket.",
											err: err,
											msgError: true,
										});
									else {
										res.status(200).json({
											message:
												"successfully deleted menuItem.",
											msgError: true,
										});
									}
								});
							}
						});
					} else {
						res.status(400).json({
							message: "Invalid menu item id.",
							msgError: true,
						});
					}
				}
			});
	}
};

const deleteCategory = (req, res) => {
	if (req.user.role !== "admin")
		res.status(401).json({ message: "Unauthorized.", msgError: true });
	else {
		MenuCategory.findByIdAndDelete(req.body.categoryId)
			.populate({ path: "menuItems" })
			.exec((err, menuCategory) => {
				if (err) {
					if (err.name === "CastError")
						res.status(400).json({
							message: "Invalid menu category id.",
							msgError: true,
						});
					else
						res.status(500).json({
							message:
								"An Error Occured while querying the database. Couldn't remove the menu item.",
							msgError: true,
						});
				} else {
					if (menuCategory) {
						const params = {
							Bucket: BUCKET_NAME,
							Delete: {
								Objects: [],
							},
						};
						menuCategory.menuItems.forEach((menuItem) => {
							const objectName = menuItem.imageUrl.substring(
								menuItem.imageUrl.lastIndexOf("/") + 1
							);
							params.Delete.Objects.push({ Key: objectName });
						});
						s3.deleteObjects(params, (err, data) => {
							if (err)
								res.status(500).json({
									message:
										"Couldn't delete image from S3 bucket.",
									err: err,
									msgError: true,
								});
							else
								MenuItem.deleteMany(
									{ menuCategory: menuCategory._id },
									(err) => {
										if (err)
											res.status(500).json({
												message:
													"Couldn't delete menu items from db.",
												err: err,
												msgError: true,
											});
										else
											res.status(200).json({
												message:
													"Successfully deleted category.",
												msgError: false,
											});
									}
								);
						});
					} else {
						res.status(400).json({
							message: "Couldn't delete the category.",
							msgError: true,
						});
					}
				}
			});
	}
};

module.exports = {
	addMenuCategory: addMenuCategory,
	addMenuItem: addMenuItem,
	getAllCategories: getAllCategories,
	deleteMenuItem: deleteMenuItem,
	deleteCategory: deleteCategory,
};
