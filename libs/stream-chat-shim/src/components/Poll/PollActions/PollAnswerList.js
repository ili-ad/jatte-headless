"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PollAnswerList = void 0;
var react_1 = require("react");
var ModalHeader_1 = require("../../Modal/ModalHeader");
var PollVote_1 = require("../PollVote");
var hooks_1 = require("../hooks");
var InfiniteScrollPaginator_1 = require("../../InfiniteScrollPaginator/InfiniteScrollPaginator");
var Loading_1 = require("../../Loading");
var store_1 = require("../../../store");
var context_1 = require("../../../context");
var pollStateSelector = function (nextValue) { return ({
    is_closed: nextValue.is_closed,
    ownAnswer: nextValue.ownAnswer,
}); };
var PollAnswerList = function (_a) {
    var close = _a.close, onUpdateOwnAnswerClick = _a.onUpdateOwnAnswerClick;
    var t = (0, context_1.useTranslationContext)().t;
    var poll = (0, context_1.usePollContext)().poll;
    var _b = (0, store_1.useStateStore)(poll.state, pollStateSelector), is_closed = _b.is_closed, ownAnswer = _b.ownAnswer;
    var _c = (0, hooks_1.usePollAnswerPagination)(), answers = _c.answers, error = _c.error, hasNextPage = _c.hasNextPage, loading = _c.loading, loadMore = _c.loadMore;
    return (<div className='str-chat__modal__poll-answer-list'>
      <ModalHeader_1.ModalHeader close={close} title={t('Poll comments')}/>
      <div className='str-chat__modal__poll-answer-list__body'>
        <InfiniteScrollPaginator_1.InfiniteScrollPaginator loadNextOnScrollToBottom={loadMore} threshold={40}>
          <div className='str-chat__poll-answer-list'>
            {answers.map(function (answer) { return (<div className='str-chat__poll-answer' key={"comment-".concat(answer.id)}>
                {answer.answer_text && (<p className='str-chat__poll-answer__text'>{answer.answer_text}</p>)}
                <PollVote_1.PollVote key={"poll-vote-".concat(answer.id)} vote={answer}/>
              </div>); })}
          </div>
          {hasNextPage && (<div className='str-chat__loading-indicator-placeholder'>
              {loading && <Loading_1.LoadingIndicator />}
            </div>)}
        </InfiniteScrollPaginator_1.InfiniteScrollPaginator>
        {(error === null || error === void 0 ? void 0 : error.message) && <div>{error === null || error === void 0 ? void 0 : error.message}</div>}
      </div>
      {answers.length > 0 && !is_closed && (<button className='str-chat__poll-action' onClick={onUpdateOwnAnswerClick}>
          {ownAnswer ? t('Update your comment') : t('Add a comment')}
        </button>)}
    </div>);
};
exports.PollAnswerList = PollAnswerList;
exports.default = exports.PollAnswerList;
