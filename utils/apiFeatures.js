class ApiFeatures {
  constructor(mongooseQuery, queryString) {
    this.mongooseQuery = mongooseQuery;
    this.queryString = queryString;
    this.paginationResult = null;
  }

  filter() {
    const queryObject = { ...this.queryString };
    const excludedFields = [
      "page",
      "sort",
      "limit",
      "fields",
      "search",
      "keyword",
      "types",
      "minPrice",
      "maxPrice",
      "minArea",
      "maxArea",
      "minBedrooms",
      "maxBedrooms",
      "minBathrooms",
      "maxBathrooms",
    ];

    excludedFields.forEach((field) => delete queryObject[field]);

    if (this.queryString.types) {
      queryObject.type = {
        $in: this.queryString.types
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      };
    }

    if (this.queryString.minPrice || this.queryString.maxPrice) {
      queryObject.price = {};

      if (this.queryString.minPrice) {
        queryObject.price.$gte = Number(this.queryString.minPrice);
      }

      if (this.queryString.maxPrice) {
        queryObject.price.$lte = Number(this.queryString.maxPrice);
      }
    }

    if (this.queryString.minArea || this.queryString.maxArea) {
      queryObject.area = {};

      if (this.queryString.minArea) {
        queryObject.area.$gte = Number(this.queryString.minArea);
      }

      if (this.queryString.maxArea) {
        queryObject.area.$lte = Number(this.queryString.maxArea);
      }
    }

    if (this.queryString.bedrooms) {
      queryObject.bedrooms = Number(this.queryString.bedrooms);
    } else if (this.queryString.minBedrooms || this.queryString.maxBedrooms) {
      queryObject.bedrooms = {};

      if (this.queryString.minBedrooms) {
        queryObject.bedrooms.$gte = Number(this.queryString.minBedrooms);
      }

      if (this.queryString.maxBedrooms) {
        queryObject.bedrooms.$lte = Number(this.queryString.maxBedrooms);
      }
    }

    if (this.queryString.bathrooms) {
      queryObject.bathrooms = Number(this.queryString.bathrooms);
    } else if (this.queryString.minBathrooms || this.queryString.maxBathrooms) {
      queryObject.bathrooms = {};

      if (this.queryString.minBathrooms) {
        queryObject.bathrooms.$gte = Number(this.queryString.minBathrooms);
      }

      if (this.queryString.maxBathrooms) {
        queryObject.bathrooms.$lte = Number(this.queryString.maxBathrooms);
      }
    }

    let queryString = JSON.stringify(queryObject);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt|in)\b/g,
      (match) => `$${match}`
    );

    this.mongooseQuery = this.mongooseQuery.find(JSON.parse(queryString));

    return this;
  }

  search(searchableFields = []) {
    const searchValue = this.queryString.keyword || this.queryString.search;

    if (searchValue && searchableFields.length > 0) {
      this.mongooseQuery = this.mongooseQuery.find({
        $or: searchableFields.map((field) => ({
          [field]: { $regex: searchValue, $options: "i" },
        })),
      });
    }

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.sort(sortBy);
    } else {
      this.mongooseQuery = this.mongooseQuery.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.mongooseQuery = this.mongooseQuery.select(fields);
    } else {
      this.mongooseQuery = this.mongooseQuery.select("-__v");
    }

    return this;
  }

  paginate(documentsCount) {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 10;
    const skip = (page - 1) * limit;
    const totalPages = Math.ceil(documentsCount / limit) || 1;

    this.paginationResult = {
      currentPage: page,
      limit,
      totalPages,
      totalDocuments: documentsCount,
    };

    if (page < totalPages) {
      this.paginationResult.next = page + 1;
    }

    if (page > 1) {
      this.paginationResult.prev = page - 1;
    }

    this.mongooseQuery = this.mongooseQuery.skip(skip).limit(limit);

    return this;
  }
}

module.exports = ApiFeatures;
