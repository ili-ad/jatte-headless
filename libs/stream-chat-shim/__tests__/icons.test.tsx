import React from "react";
import { render } from "@testing-library/react";
import { Icon } from "../src/components/ChannelPreview/icons";

test("renders ArchiveBox icon", () => {
  const { container } = render(<Icon.ArchiveBox />);
  expect(container.querySelector("svg")).toBeTruthy();
});
