const TableArrangement = require("../Models/TableArrangement");

const makeReservation = (req, res) => {
	TableArrangement.findOne().exec((err, tableArrangement) => {
		if (err)
			res.status(500).json({
				message: "Can't connect to the database.",
			});
		else {
			let email;
			let checkEmail = false;

			if (req.user.role === "waiter") {
				if (req.body.email) {
					email = req.body.email;
					checkEmail = true;
				} else {
					res.status(400).json({
						message: "Where is the email ma dude?",
					});
				}
			} else if (req.user.role === "customer") {
				email = req.user.email;
				checkEmail = true;
			} else {
				res.status(401).json(
					"You must be either a customer or a waiter."
				);
			}

			if (req.body.timeSlot && req.body.seats && checkEmail) {
				let freeTables = [];

				tableArrangement.layout.forEach((table) => {
					if (
						!table.reservations[req.body.timeSlot - 1].isReserved &&
						table.hasTable
					) {
						freeTables.push(table);
					}
				});

				freeTables.sort((a, b) => {
					return Number(a.capacity) - Number(b.capacity);
				});

				let reservedTables = recursiveShit(
					freeTables,
					req.body.timeSlot,
					req.body.seats,
					[]
				);

				reservedTables.forEach((table) => {
					table.reservations[req.body.timeSlot - 1].customer = email;
					table.reservations[req.body.timeSlot - 1].isReserved = true;
					table.reservations[
						req.body.timeSlot - 1
					].totalNumberOfPeople = req.body.seats;
				});

				tableArrangement.save((err, doc) => {
					if (err)
						res.status(500).json({
							message:
								"Couldn't make reservation due to a problem with the db.",
						});
					else {
						let reservedTablesForUser = [];

						for (i = 0; i < 4; i++) {
							let timeSlot = {
								timeSlot: i + 1,
								totalNumberOfPeople: null,
								tables: [],
							};
							doc.layout.forEach((table) => {
								if (table.hasTable === true) {
									if (
										table.reservations[i].customer === email
									) {
										timeSlot.tables.push(table.position);
										timeSlot.totalNumberOfPeople =
											table.reservations[
												i
											].totalNumberOfPeople;
									}
								}
							});
							if (timeSlot.tables.length > 0) {
								reservedTablesForUser.push(timeSlot);
							}
						}
						res.status(200).json(reservedTablesForUser);
					}
				});
			} else {
				if (checkEmail) {
					res.status(400),
						json({ message: "Something is missing..." });
				}
			}
		}
	});
};

function recursiveShit(freeTables, timeSlot, seats, reservedTables) {
	if (freeTables.length === 0) {
		return [];
	}
	if (seats <= 6) {
		for (i = 0; i < freeTables.length; i++) {
			if (seats <= freeTables[i].capacity) {
				// freeTables[i].reservations[timeSlot - 1].isReserved = true;
				reservedTables.push(freeTables[i]);
				return reservedTables;
			}
		}
		if (seats - freeTables[freeTables.length - 1].capacity > 0) {
			// freeTables[freeTables.length - 1].reservations[
			// 	timeSlot - 1
			// ].isReserved = true;
			reservedTables.push(freeTables[freeTables.length - 1]);
			const capacity = freeTables[freeTables.length - 1].capacity;
			freeTables.splice(freeTables.length - 1, 1);
			return recursiveShit(
				freeTables,
				timeSlot,
				seats - capacity,
				reservedTables
			);
		} else {
			return [];
		}
	} else {
		// freeTables[freeTables.length - 1].reservations[
		// 	timeSlot - 1
		// ].isReserved = true;
		reservedTables.push(freeTables[freeTables.length - 1]);
		const capacity = freeTables[freeTables.length - 1].capacity;
		freeTables.splice(freeTables.length - 1, 1);
		return recursiveShit(
			freeTables,
			timeSlot,
			seats - capacity,
			reservedTables
		);
	}
}

const getUserReservations = (req, res) => {
	if (req.user.role === "customer") {
		TableArrangement.findOne().exec((err, tableArrangement) => {
			if (err) {
				res.status(500).json({
					message: "Can't connect to the database.",
				});
			} else {
				let reservedTablesForUser = [];

				for (i = 0; i < 4; i++) {
					let timeSlot = {
						timeSlot: i + 1,
						totalNumberOfPeople: null,
						tables: [],
					};
					tableArrangement.layout.forEach((table) => {
						if (table.hasTable === true) {
							if (
								table.reservations[i].customer ===
								req.user.email
							) {
								timeSlot.tables.push(table.position);
								timeSlot.totalNumberOfPeople =
									table.reservations[i].totalNumberOfPeople;
							}
						}
					});
					if (timeSlot.tables.length > 0) {
						reservedTablesForUser.push(timeSlot);
					}
				}
				res.status(200).json(reservedTablesForUser);
			}
		});
	} else {
		res.status(500).json({ message: "you must be a customer." });
	}
};

const getAllReservations = (req, res) => {
	if (req.user.role === "waiter") {
		TableArrangement.findOne().exec((err, tableArrangement) => {
			if (err) {
				res.status(500).json({
					message: "Can't connect to the database.",
				});
			} else {
				let reservedTables = [];
				tableArrangement.layout.forEach((table) => {
					if (table.hasTable === true) {
						reservedTables.push(table);
					}
				});
				res.status(200).json(reservedTables);
			}
		});
	} else {
		res.status(401).json({ message: "You must be a waiter." });
	}
};

module.exports = {
	makeReservation: makeReservation,
	getUserReservations: getUserReservations,
	getAllReservations: getAllReservations,
};
