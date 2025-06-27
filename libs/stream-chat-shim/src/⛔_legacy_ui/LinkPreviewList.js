"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkPreviewList = exports.LinkPreviewState = void 0;
var react_1 = require("react");
var LinkPreviewState;
(function (LinkPreviewState) {
    LinkPreviewState["DISMISSED"] = "dismissed";
    LinkPreviewState["FAILED"] = "failed";
    LinkPreviewState["LOADED"] = "loaded";
    LinkPreviewState["LOADING"] = "loading";
    LinkPreviewState["QUEUED"] = "queued";
})(LinkPreviewState || (exports.LinkPreviewState = LinkPreviewState = {}));
/**
 * Minimal placeholder for Stream's LinkPreviewList component.
 * Displays loaded link previews in a simple list.
 */
var LinkPreviewList = function (_a) {
    var linkPreviews = _a.linkPreviews;
    if (!linkPreviews || linkPreviews.length === 0)
        return null;
    return (<div data-testid="link-preview-list">
      {linkPreviews.map(function (preview) {
            return preview.state === LinkPreviewState.LOADED ? (<div key={preview.og_scrape_url} data-testid="link-preview-card">
            <a href={preview.og_scrape_url}>{preview.title || preview.og_scrape_url}</a>
            {preview.text && <p>{preview.text}</p>}
          </div>) : null;
        })}
    </div>);
};
exports.LinkPreviewList = LinkPreviewList;
exports.default = exports.LinkPreviewList;
