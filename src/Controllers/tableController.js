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
	if (req.user.role === "admin") {
		TableArrangement.findOne().exec((err, tableArrangement) => {
			if (err)
				res.status(500).json({
					message: "An error occured while querying the database",
				});

			if (req.body.layout) {
				if (req.body.layout.length === 30) {
					req.body.layout.forEach((table) => {
						tableArrangement.layout[table.position - 1].hasTable =
							table.hasTable;
						tableArrangement.layout[table.position - 1].capacity =
							table.capacity;
					});
					tableArrangement.save((err, newTableArrangement) => {
						if (err)
							res.status(500).json({
								message:
									"An error occured while querying the db.",
							});
						res.status(200).json(newTableArrangement.layout);
					});
				} else {
					res.status(400).json({
						message:
							"not all the positions are in the given layout.",
					});
				}
			} else {
				res.status(400).json({
					message: "please give a valid layout.",
				});
			}
		});
	} else {
		res.status(401).json({ message: "Unauthorized." });
	}
};

const getTableArrangement = (req, res) => {
	TableArrangement.findOne().exec((err, tableArrangement) => {
		if (err)
			res.status(500).json({
				message: "An error occured while querying the database",
			});

		res.status(200).json(tableArrangement.layout);
	});
};

module.exports = {
	makeTableArrangement: makeTableArrangement,
	updateTableArrangement: updateTableArrangement,
	getTableArrangement: getTableArrangement,
};
