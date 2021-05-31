const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
	items: [
		{
			menuItem: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "MenuItem",
				required: true,
			},
			amount: {
				type: Number,
				required: true,
			},
			preparing: {
				type: Boolean,
				required: true,
			},
			cost: {
				type: Number,
				required: true,
			},
		},
	],
	totalCost: {
		type: Number,
		required: true,
	},
	status: {
		type: String,
		enum: ["Pending", "Preparing", "Ready"],
		required: true,
	},
	pending: {
		type: Boolean,
		required: true,
	},
	paid: {
		type: Boolean,
		required: true,
	},
	location: {
		type: String,
		enum: ["On the spot", "Takeaway"],
	},
	table: {
		type: Number,
	},
	customer: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	waiter: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	tip: {
		type: Number,
	},
});

module.exports = mongoose.model("Order", OrderSchema);
