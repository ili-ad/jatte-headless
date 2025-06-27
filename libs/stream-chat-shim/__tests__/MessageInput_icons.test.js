"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_2 = require("@testing-library/react");
var icons_1 = require("../src/components/MessageInput/icons");
test('renders message input icons without crashing', function () {
    (0, react_2.render)(<>
      <icons_1.LoadingIndicatorIcon />
      <icons_1.UploadIcon />
      <icons_1.CloseIcon />
      <icons_1.RetryIcon />
      <icons_1.DownloadIcon />
      <icons_1.LinkIcon />
      <icons_1.SendIcon />
      <icons_1.MicIcon />
      <icons_1.BinIcon />
      <icons_1.PauseIcon />
      <icons_1.PlayIcon />
      <icons_1.CheckSignIcon />
    </>);
});
