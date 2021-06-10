const Order = require("../Models/Order");

const getStatsForToday = (req, res) => {
	if (req.user.role === "admin") {
		var today = new Date();
		today.setHours(0, 0, 0, 0);
		var tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);
		Order.aggregate([
			{
				$match: {
					createdAt: { $gte: today, $lt: tomorrow },
					paid: true,
				},
			},
			{ $unwind: "$items" },
			{
				$lookup: {
					from: "menuitems",
					localField: "items.menuItem",
					foreignField: "_id",
					as: "items.menuItem",
				},
			},
			{
				$lookup: {
					from: "menucategories",
					localField: "items.menuItem.menuCategory",
					foreignField: "_id",
					as: "items.menuCategory",
				},
			},
			{ $unwind: "$items.menuItem" },
			{ $unwind: "$items.menuCategory" },
			{
				$group: {
					_id: "$items.menuItem.name",
					menuCategory: { $first: "$items.menuCategory.name" },
					type: { $first: "$items.menuCategory.type" },
					income: { $sum: "$items.cost" },
				},
			},
		]).exec((err, stats) => {
			if (err) {
				res.status(500).json({
					message: "An error occured while querying the database",
				});
			} else {
				res.status(200).json(stats);
			}
		});
	} else {
		res.status(401).json({ message: "Unauthorized" });
	}
};

const getStatsFromDate = (req, res) => {
	if (req.user.role === "admin" && req.query.date) {
		var today = new Date();
		today.setHours(0, 0, 0, 0);
		var tomorrow = new Date(today);
		tomorrow.setDate(today.getDate() + 1);
		Order.aggregate([
			{
				$match: {
					createdAt: {
						$gte: new Date(req.query.date),
						$lt: tomorrow,
					},
					paid: true,
				},
			},
			{ $unwind: "$items" },
			{
				$lookup: {
					from: "menuitems",
					localField: "items.menuItem",
					foreignField: "_id",
					as: "items.menuItem",
				},
			},
			{
				$lookup: {
					from: "menucategories",
					localField: "items.menuItem.menuCategory",
					foreignField: "_id",
					as: "items.menuCategory",
				},
			},
			{ $unwind: "$items.menuItem" },
			{ $unwind: "$items.menuCategory" },
			{
				$group: {
					_id: "$items.menuItem.name",
					menuCategory: { $first: "$items.menuCategory.name" },
					type: { $first: "$items.menuCategory.type" },
					income: { $sum: "$items.cost" },
				},
			},
		]).exec((err, stats) => {
			if (err) {
				res.status(500).json({
					message: "An error occured while querying the database",
				});
			} else {
				res.status(200).json(stats);
			}
		});
	} else {
		if (req.user.role !== "admin") {
			res.status(401).json({ message: "Unauthorized" });
		} else {
			res.status(400).json({ message: "Where is the date?" });
		}
	}
};

module.exports = {
	getStatsForToday: getStatsForToday,
	getStatsFromDate: getStatsFromDate,
};
