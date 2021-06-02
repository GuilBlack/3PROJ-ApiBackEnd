const TableArrangement = require("../Models/TableArrangement");

const makeTableArrangement = (req, res) => {
	let layout = [];
	for (i = 0; i < 30; i++) {
		const table = {
			position: i + 1,
			hasTable: false,
			capacity: 4,
			reservations: [
				{
					customer: null,
					isReserved: false,
				},
				{
					customer: null,
					isReserved: false,
				},
				{
					customer: null,
					isReserved: false,
				},
				{
					customer: null,
					isReserved: false,
				},
			],
		};
		layout.push(table);
	}

	const newTableArrangement = new TableArrangement({ layout: layout });
	newTableArrangement.save((err, tableArrangement) => {
		res.status(200).json(tableArrangement);
	});
};

const updateTableArrangement = (req, res) => {
	console.log("TODO: implement this thing...");
};

module.exports = {
	makeTableArrangement: makeTableArrangement,
	updateTableArrangement: updateTableArrangement,
};
