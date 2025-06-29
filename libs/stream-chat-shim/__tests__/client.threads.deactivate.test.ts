import { clientThreadsDeactivate } from "../src/chatSDKShim";

describe("clientThreadsDeactivate", () => {
  it("calls client.threads.deactivate when available", () => {
    const fn = jest.fn();
    clientThreadsDeactivate({ threads: { deactivate: fn } } as any);
    expect(fn).toHaveBeenCalled();
  });

  it("does nothing when not implemented", () => {
    expect(() => clientThreadsDeactivate({} as any)).not.toThrow();
  });
});
