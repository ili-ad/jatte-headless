"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadListItem = exports.useThreadListItemContext = void 0;
var react_1 = require("react");
var context_1 = require("../../../context");
var ThreadListItemUI_1 = require("./ThreadListItemUI");
var ThreadListItemContext = (0, react_1.createContext)(undefined);
var useThreadListItemContext = function () { return (0, react_1.useContext)(ThreadListItemContext); };
exports.useThreadListItemContext = useThreadListItemContext;
var ThreadListItem = function (_a) {
    var thread = _a.thread, threadListItemUIProps = _a.threadListItemUIProps;
    var _b = (0, context_1.useComponentContext)().ThreadListItemUI, ThreadListItemUI = _b === void 0 ? ThreadListItemUI_1.ThreadListItemUI : _b;
    return (<ThreadListItemContext.Provider value={thread}>
      <ThreadListItemUI {...threadListItemUIProps}/>
    </ThreadListItemContext.Provider>);
};
exports.ThreadListItem = ThreadListItem;
// const App = () => {
//
//   return (
//     <Chat>
//       {route === '/channels' && (
//         <Channel>
//           <MessageList />
//           <Thread />
//         </Channel>
//       )}
//       {route === '/threads' && (
//         <Threads>
//           <ThreadList />
//           <ThreadProvider>
//             <Thread />
//           </ThreadProvider>
//         </Threads>
//       )}
//     </Chat>
//   );
// };
// pre-built layout
{
    <Chat client={chatClient}>
  <Views>
    // has default
    <ViewSelector onItemPointerDown=/>
    <View.Chat>
      <Channel>
        <MessageList />
        <MessageInput />
      </Channel>
    </View.Chat>
    <View.Thread> < />-- activeThread state
      <ThreadList /> < />-- uses context for click handler
      <WrappedThread /> < />-- ThreadProvider + Channel combo
    </View.Thread>
  </Views>
    </Chat>;
        * /;
}
