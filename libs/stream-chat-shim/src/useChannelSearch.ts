import { useCallback, useRef, useState } from 'react';
import type { Channel } from 'stream-chat';

export type ChannelOrUserResponse = Channel | { id: string; name?: string };

export type ChannelSearchFunctionParams = {
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  setResults: React.Dispatch<React.SetStateAction<ChannelOrUserResponse[]>>;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
};

export type SearchController = {
  activateSearch: () => void;
  clearState: () => void;
  exitSearch: () => void;
  inputIsFocused: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onSearch: (event: React.ChangeEvent<HTMLInputElement>) => void;
  query: string;
  results: ChannelOrUserResponse[];
  searchBarRef: React.RefObject<HTMLDivElement>;
  searching: boolean;
  selectResult: (result: ChannelOrUserResponse) => void;
};

export type SearchQueryParams = {
  channelFilters?: unknown;
  userFilters?: unknown;
};

export type ChannelSearchParams = {
  channelType?: string;
  clearSearchOnClickOutside?: boolean;
  disabled?: boolean;
  onSearch?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchExit?: () => void;
  onSelectResult?: (
    params: ChannelSearchFunctionParams,
    result: ChannelOrUserResponse,
  ) => Promise<void> | void;
  searchDebounceIntervalMs?: number;
  searchForChannels?: boolean;
  searchForUsers?: boolean;
  searchFunction?: (
    params: ChannelSearchFunctionParams,
    event: React.BaseSyntheticEvent,
  ) => Promise<void> | void;
  searchQueryParams?: SearchQueryParams;
};

export type ChannelSearchControllerParams = ChannelSearchParams & {
  setChannels?: React.Dispatch<React.SetStateAction<Array<Channel>>>;
};

export const useChannelSearch = (
  params: ChannelSearchControllerParams,
): SearchController => {
  const [inputIsFocused, setInputIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChannelOrUserResponse[]>([]);
  const [searching, setSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  const clearState = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearching(false);
  }, []);

  const activateSearch = useCallback(() => {
    setInputIsFocused(true);
  }, []);

  const exitSearch = useCallback(() => {
    setInputIsFocused(false);
    params.onSearchExit?.();
  }, [params]);

  const onSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      if (params.disabled) return;
      setSearching(true);
      setQuery(event.target.value);
      params.onSearch?.(event);
    },
    [params.disabled, params.onSearch],
  );

  const selectResult = useCallback(
    (result: ChannelOrUserResponse) => {
      params.onSelectResult?.(
        { setQuery, setResults, setSearching },
        result,
      );
      if (params.clearSearchOnClickOutside) {
        exitSearch();
      }
    },
    [exitSearch, params],
  );

  return {
    activateSearch,
    clearState,
    exitSearch,
    inputIsFocused,
    inputRef,
    onSearch,
    query,
    results,
    searchBarRef,
    searching,
    selectResult,
  };
};
