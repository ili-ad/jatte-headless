import { clientThreadsActivate } from "../src/chatSDKShim";
import { chatAPI } from "../src/api/chatAPI";

describe("clientThreadsActivate", () => {
  it("calls client.threads.activate when available", () => {
    const fn = jest.fn();
    clientThreadsActivate({ threads: { activate: fn } } as any);
    expect(fn).toHaveBeenCalled();
  });

  it("invokes via chatAPI helper", () => {
    const fn = jest.fn();
    chatAPI.clientThreadsActivate({ client: { threads: { activate: fn } } });
    expect(fn).toHaveBeenCalled();
  });

  it("does nothing when not implemented", () => {
    expect(() => clientThreadsActivate({} as any)).not.toThrow();
  });
});
