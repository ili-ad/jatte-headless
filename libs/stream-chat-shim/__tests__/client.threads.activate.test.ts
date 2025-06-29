import { clientThreadsActivate } from "../src/chatSDKShim";

describe("clientThreadsActivate", () => {
  it("calls client.threads.activate when available", () => {
    const fn = jest.fn();
    clientThreadsActivate({ threads: { activate: fn } } as any);
    expect(fn).toHaveBeenCalled();
  });

  it("does nothing when not implemented", () => {
    expect(() => clientThreadsActivate({} as any)).not.toThrow();
  });
});
