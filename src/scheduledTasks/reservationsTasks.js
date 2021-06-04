const TableArrangement = require("../Models/TableArrangement");

const resetReservations = () => {
	TableArrangement.findOne().exec((err, tableArrangement) => {
		if (err)
			console.log(
				"couldn't find restaurant's layout to clean up the reservations."
			);

		tableArrangement.layout.forEach((table) => {
			table.reservations.forEach((reservation) => {
				reservation.customer = null;
				reservation.isReserved = false;
			});
		});

		tableArrangement.save((err, doc) => {
			if (err)
				console.log(
					"couldn't find restaurant's layout to clean up the reservations."
				);
			else console.log("reservations reset.");
		});
	});
};

module.exports = {
	resetReservations: resetReservations,
};
