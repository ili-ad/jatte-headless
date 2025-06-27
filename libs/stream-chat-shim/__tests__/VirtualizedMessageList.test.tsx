import { render } from "@testing-library/react";
import { VirtualizedMessageList } from "../src/components/MessageList/VirtualizedMessageList";

test("renders without crashing", () => {
  render(<VirtualizedMessageList />);
});
