const mongoose = require("mongoose");

const MenuItemSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	description: {
		type: String,
		required: true,
	},
	imageUrl: {
		type: String,
		required: true,
	},
	price: {
		type: Number,
		required: true,
	},
	menuCategory: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "MenuCategory",
		required: true,
	},
	ingredients: [
		{
			ingredient: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Ingredient",
				required: true,
			},
			amountUsed: {
				type: Number,
				required: true,
			},
		},
	],
});

module.exports = mongoose.model("MenuItem", MenuItemSchema);
