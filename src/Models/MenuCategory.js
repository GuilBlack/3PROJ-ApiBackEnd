const mongoose = require("mongoose");
const MenuItemSchema = require("./MenuItem");

const MenuCategorySchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
		unique: true,
	},
	menuItems: [{ type: mongoose.SchemaTypes.ObjectId, ref: "MenuItem" }],
});

module.exports = mongoose.model("MenuCategory", MenuCategorySchema);
