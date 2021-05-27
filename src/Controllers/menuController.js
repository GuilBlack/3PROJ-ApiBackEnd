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
		if (req.body.name) {
			const menuCategory = new MenuCategory({
				name: req.body.name,
			});
			menuCategory.save((err) => {
				if (err) {
					if (err.code === 11000) {
						res.status(400).json({
							message: "This category already exists.",
							err: err,
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
						message: "Menu category successfully created.",
						msgError: false,
					});
			});
		} else {
			res.status(400).json({
				message: "The name value is missing!",
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
					fields.price
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
												const menuItem = new MenuItem({
													name: fields.name,
													description:
														fields.description,
													imageUrl: data.Location,
													price: fields.price,
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

module.exports = {
	addMenuCategory: addMenuCategory,
	addMenuItem: addMenuItem,
	getAllCategories: getAllCategories,
};
