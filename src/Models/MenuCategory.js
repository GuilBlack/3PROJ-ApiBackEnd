const mongoose = require("mongoose");
const MenuItemSchema = require("./MenuItem");

const MenuCategorySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	menuItems: [MenuItemSchema],
});

module.exports = mongoose.model("MenuCategory", MenuCategorySchema);
