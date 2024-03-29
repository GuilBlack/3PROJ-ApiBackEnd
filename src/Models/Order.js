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
				default: false,
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
	pending: {
		type: Boolean,
		required: true,
		default: true,
	},
	paid: {
		type: Boolean,
		required: true,
		default: false,
	},
	delivered: {
		type: Boolean,
		required: true,
		default: false,
	},
	cancelled: {
		type: Boolean,
		required: true,
		default: false,
	},
	onSpot: {
		type: Boolean,
		required: true,
	},
	preferences: {
		type: String,
	},
	customer: {
		type: String,
		required: true,
	},
	waiter: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	customerName: {
		type: String,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

module.exports = mongoose.model("Order", OrderSchema);
