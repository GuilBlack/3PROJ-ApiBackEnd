const Order = require("../Models/Order");

const deleteCancelledOrders = () => {
	Order.deleteMany({ cancelled: true }, (err) => {
		if (err) {
			console.log(err);
		} else {
			console.log("cancelled orders successfully deleted.");
		}
	});
};

module.exports = {
	deleteCancelledOrders: deleteCancelledOrders,
};
