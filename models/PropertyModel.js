const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      minlength: [5, "Too short property title"],
      maxlength: [120, "Too long property title"],
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Property description is required"],
      trim: true,
      minlength: [20, "Too short property description"],
      maxlength: [2000, "Too long property description"],
    },
    location: {
      type: String,
      required: [true, "Property location is required"],
      trim: true,
      maxlength: [120, "Too long property location"],
    },
    latitude: {
      type: Number,
      min: [-90, "Latitude must be between -90 and 90"],
      max: [90, "Latitude must be between -90 and 90"],
    },
    longitude: {
      type: Number,
      min: [-180, "Longitude must be between -180 and 180"],
      max: [180, "Longitude must be between -180 and 180"],
    },
    type: {
      type: String,
      required: [true, "Property type is required"],
      trim: true,
      maxlength: [60, "Too long property type"],
    },
    purpose: {
      type: String,
      enum: ["sale", "rent"],
      default: "sale",
    },
    price: {
      type: Number,
      required: [true, "Property price is required"],
      min: [0, "Price must be greater than or equal to 0"],
    },
    area: {
      type: Number,
      required: [true, "Property area is required"],
      min: [1, "Area must be greater than 0"],
    },
    bedrooms: {
      type: Number,
      default: 0,
      min: [0, "Bedrooms must be greater than or equal to 0"],
    },
    bathrooms: {
      type: Number,
      default: 0,
      min: [0, "Bathrooms must be greater than or equal to 0"],
    },
    image: {
      type: String,
      required: [true, "Property main image is required"],
      trim: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["available", "reserved", "sold"],
      default: "available",
    },
    listedBy: {
      type: String,
      trim: true,
      maxlength: [120, "Too long listed by name"],
    },
    ownerId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
    contactPhone: {
      type: String,
      trim: true,
      maxlength: [20, "Too long phone number"],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
    },
    amenities: [
      {
        type: String,
        trim: true,
      },
    ],
    ratingsAverage: {
      type: Number,
      min: [0, "Rating must be at least 0.0"],
      max: [5, "Rating must be at most 5.0"],
      default: 0,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

PropertySchema.virtual("pricePerMeter").get(function pricePerMeter() {
  if (!this.area) {
    return 0;
  }

  return Math.round(this.price / this.area);
});

// Virtual populate for reviews
PropertySchema.virtual("reviews", {
  ref: "Review",
  foreignField: "property",
  localField: "_id",
});

// Database indexes for search performance
PropertySchema.index({ price: 1 });
PropertySchema.index({ location: 1 });
PropertySchema.index({ type: 1 });
PropertySchema.index({ ownerId: 1 });
PropertySchema.index({ price: 1, location: 1, type: 1 });
PropertySchema.index({ title: 'text', description: 'text', location: 'text' });

const PropertyModel = mongoose.model("Property", PropertySchema);

module.exports = PropertyModel;
