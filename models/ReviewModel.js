const mongoose = require("mongoose");
const PropertyModel = require("./PropertyModel");

const reviewSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: [100, "Review title is too long"],
    },
    rating: {
      type: Number,
      required: [true, "Review rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating must be at most 5"],
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      maxlength: [500, "Comment is too long"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user"],
    },
    property: {
      type: mongoose.Schema.ObjectId,
      ref: "Property",
      required: [true, "Review must belong to a property"],
    },
  },
  { timestamps: true }
);

// Ensure one review per user per property
reviewSchema.index({ property: 1, user: 1 }, { unique: true });

// Static method to calculate average rating
reviewSchema.statics.calcAverageRatings = async function (propertyId) {
  const result = await this.aggregate([
    { $match: { property: propertyId } },
    {
      $group: {
        _id: "$property",
        avgRating: { $avg: "$rating" },
        numRatings: { $sum: 1 },
      },
    },
  ]);

  if (result.length > 0) {
    await PropertyModel.findByIdAndUpdate(propertyId, {
      ratingsAverage: Math.round(result[0].avgRating * 10) / 10,
      ratingsQuantity: result[0].numRatings,
    });
  } else {
    await PropertyModel.findByIdAndUpdate(propertyId, {
      ratingsAverage: 0,
      ratingsQuantity: 0,
    });
  }
};

// After save: recalculate ratings
reviewSchema.post("save", async function () {
  await this.constructor.calcAverageRatings(this.property);
});

// After delete: recalculate ratings
reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.property);
  }
});

const ReviewModel = mongoose.model("Review", reviewSchema);

module.exports = ReviewModel;
