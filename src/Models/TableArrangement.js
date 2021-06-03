const mongoose = require("mongoose");

const TableArrangementSchema = new mongoose.Schema({
	layout: [
		{
			position: {
				type: Number,
				required: true,
			},
			hasTable: {
				type: Boolean,
				required: true,
			},
			capacity: {
				type: Number,
				required: true,
			},
			reservations: [
				{
					customer: {
						type: mongoose.Schema.Types.ObjectId,
						ref: "User",
					},
					isReserved: {
						type: Boolean,
						required: true,
					},
				},
			],
		},
	],
});

module.exports = mongoose.model("TableArrangement", TableArrangementSchema);
