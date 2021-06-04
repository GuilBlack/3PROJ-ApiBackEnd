const TableArrangement = require("../Models/TableArrangement");

const makeReservation = (req, res) => {
	TableArrangement.findOne().exec((err, tableArrangement) => {
		if (err)
			res.status(500).json({
				message:
					"S-Sowwy... database-chan ha-has a lil' pwoblem. UwU 👉👈",
			});

		let email;

		if (req.user.role === "waiter") {
			if (req.body.email) {
				email = req.body.email;
			} else {
				res.status(400).json({
					message: "Where is the email ma dude?",
				});
			}
		} else {
			email = req.user.email;
		}

		if (req.body.timeSlot && req.body.seats) {
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
				table.reservations[req.body.timeSlot - 1].isReserved = true;
			});
			console.log(reservedTables);
			res.status(200).json(tableArrangement.layout);
		} else {
			res.status(400), json({ message: "Something is missing..." });
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

module.exports = {
	makeReservation: makeReservation,
};
