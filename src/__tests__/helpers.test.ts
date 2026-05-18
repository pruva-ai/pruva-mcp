import { jsonResult, wrapToolHandler } from "../tools/helpers.js";

describe("jsonResult", () => {
  it("returns correct MCP result structure", () => {
    const data = { id: "1", name: "Test" };
    const result = jsonResult(data);

    expect(result).toEqual({
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    });
  });

  it("handles arrays", () => {
    const data = [1, 2, 3];
    const result = jsonResult(data);

    expect(result.content).toEqual([
      { type: "text", text: JSON.stringify(data, null, 2) },
    ]);
  });

  it("handles nested objects", () => {
    const data = { a: { b: { c: "deep" } } };
    const result = jsonResult(data);

    expect(result.content).toEqual([
      { type: "text", text: JSON.stringify(data, null, 2) },
    ]);
  });

  it("handles null", () => {
    const result = jsonResult(null);

    expect(result.content).toEqual([{ type: "text", text: "null" }]);
  });
});

describe("wrapToolHandler", () => {
  it("passes through successful result", async () => {
    const expected = {
      content: [{ type: "text" as const, text: "ok" }],
    };
    const fn = vi.fn().mockResolvedValue(expected);
    const wrapped = wrapToolHandler(fn);

    const result = await wrapped({ foo: "bar" });

    expect(fn).toHaveBeenCalledWith({ foo: "bar" }, undefined);
    expect(result).toBe(expected);
  });

  it("catches Error and returns isError result", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Something broke"));
    const wrapped = wrapToolHandler(fn);

    const result = await wrapped({});

    expect(result).toEqual({
      isError: true,
      content: [{ type: "text", text: "Something broke" }],
    });
  });

  it("catches non-Error throws and converts via String()", async () => {
    const fn = vi.fn().mockRejectedValue("string error");
    const wrapped = wrapToolHandler(fn);

    const result = await wrapped({});

    expect(result).toEqual({
      isError: true,
      content: [{ type: "text", text: "string error" }],
    });
  });
});
