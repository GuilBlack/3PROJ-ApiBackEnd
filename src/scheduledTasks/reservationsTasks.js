const TableArrangement = require("../Models/TableArrangement");

//clear reservations at midnight everyday
const resetReservations = () => {
	TableArrangement.findOne().exec((err, tableArrangement) => {
		if (err)
			console.log(
				"couldn't find restaurant's layout to clean up the reservations."
			);

		tableArrangement.layout.forEach((table) => {
			table.reservations.forEach((reservation) => {
				reservation.customer = null;
				reservation.customerName = null;
				reservation.isReserved = false;
				reservation.totalNumberOfPeople = 0;
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
