const mongoose = require("mongoose");
const connectDB = require("../config/db");

describe("connectDB", () => {
  afterEach(() => jest.restoreAllMocks());

  it("retries until the database is reachable", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    const connect = jest
      .spyOn(mongoose, "connect")
      .mockRejectedValueOnce(new Error("refused"))
      .mockResolvedValueOnce(undefined);
    await connectDB("mongodb://x", { retries: 3, delayMs: 1 });
    expect(connect).toHaveBeenCalledTimes(2);
  });

  it("gives up after the configured number of attempts", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(mongoose, "connect").mockRejectedValue(new Error("refused"));
    await expect(connectDB("mongodb://x", { retries: 2, delayMs: 1 })).rejects.toThrow("refused");
  });
});
