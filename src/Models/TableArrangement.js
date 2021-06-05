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
						type: String,
					},
					isReserved: {
						type: Boolean,
						required: true,
					},
					totalNumberOfPeople: {
						type: Number,
					},
				},
			],
		},
	],
});

module.exports = mongoose.model("TableArrangement", TableArrangementSchema);
