"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollOptionVotesList = void 0;
var react_1 = require("react");
var PollVote_1 = require("../../PollVote");
var hooks_1 = require("../../hooks");
var Loading_1 = require("../../../Loading");
var InfiniteScrollPaginator_1 = require("../../../InfiniteScrollPaginator/InfiniteScrollPaginator");
var PollOptionWithVotesHeader_1 = require("./PollOptionWithVotesHeader");
var PollOptionVotesList = function (_a) {
    var option = _a.option;
    var paginationParams = (0, react_1.useMemo)(function () { return ({ filter: { option_id: option.id } }); }, [option.id]);
    var _b = (0, hooks_1.usePollOptionVotesPagination)({
        paginationParams: paginationParams,
    }), error = _b.error, hasNextPage = _b.hasNextPage, loading = _b.loading, loadMore = _b.loadMore, votes = _b.votes;
    return (<div className='str-chat__poll-option str-chat__poll-option--full-vote-list'>
      <PollOptionWithVotesHeader_1.PollOptionWithVotesHeader option={option}/>
      <InfiniteScrollPaginator_1.InfiniteScrollPaginator loadNextOnScrollToBottom={loadMore} threshold={40}>
        <PollVote_1.PollVoteListing votes={votes}/>
        {hasNextPage && (<div className='str-chat__loading-indicator-placeholder'>
            {loading && <Loading_1.LoadingIndicator />}
          </div>)}
      </InfiniteScrollPaginator_1.InfiniteScrollPaginator>
      {error && error.message}
    </div>);
};
exports.PollOptionVotesList = PollOptionVotesList;
exports.default = exports.PollOptionVotesList;
