const mongoose = require("mongoose");

const connectWithUri = async (uri, label) => {
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log(`Database Connected (${label}): ${conn.connection.host}`);
  return conn;
};

const dbConnection = async () => {
  const atlasUri = process.env.DB_URI;
  const localUri =
    process.env.DB_URI_LOCAL || "mongodb://127.0.0.1:27017/SquareNet";

  try {
    if (atlasUri) {
      await connectWithUri(atlasUri, "atlas");
      return;
    }

    await connectWithUri(localUri, "local");
  } catch (err) {
    const canFallbackToLocal =
      process.env.NODE_ENV === "development" && atlasUri && localUri;

    if (canFallbackToLocal) {
      console.warn(
        `Atlas connection failed, falling back to local MongoDB. Reason: ${err.message}`
      );

      try {
        await mongoose.disconnect();
      } catch (disconnectError) {
        // Ignore disconnect failure before retrying a fresh local connection.
      }

      try {
        await connectWithUri(localUri, "local");
        return;
      } catch (localErr) {
        console.error(`Local Database Error: ${localErr.message}`);
        process.exit(1);
      }
    }

    console.error(`Database Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = dbConnection;
