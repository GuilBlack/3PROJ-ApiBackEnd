const mongoose = require("mongoose");

const IngredientSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	stock: {
		type: Number,
		required: true,
	},
});

module.exports = mongoose.model("Ingredient", IngredientSchema);
