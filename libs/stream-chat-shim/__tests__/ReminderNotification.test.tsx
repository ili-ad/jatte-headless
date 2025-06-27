import React from "react";
import { render } from "@testing-library/react";
import { ReminderNotification } from "../src/components/Message/ReminderNotification";

test("renders without crashing", () => {
  render(<ReminderNotification />);
});
