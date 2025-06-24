import { useCallback, useRef, useState } from 'react';
import type {
  Channel,
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  UserFilters,
  UserOptions,
  UsersAPIResponse,
  UserSort,
} from 'stream-chat';

// Generic placeholder for channel or user search results
export type ChannelOrUserResponse = any;

export type ChannelSearchFunctionParams = {
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  setResults: React.Dispatch<React.SetStateAction<ChannelOrUserResponse[]>>;
  setSearching: React.Dispatch<React.SetStateAction<boolean>>;
};

// Placeholder controller types
export type SearchBarController = any;
export type SearchInputController = any;
export type SearchResultsController = any;

export type SearchController = SearchInputController &
  SearchBarController &
  SearchResultsController;

export type SearchQueryParams = {
  channelFilters?: {
    filters?: ChannelFilters;
    options?: ChannelOptions;
    sort?: ChannelSort;
  };
  userFilters?: {
    filters?: UserFilters | ((query: string) => UserFilters);
    options?: UserOptions;
    sort?: UserSort;
  };
};

export type ChannelSearchParams = {
  channelType?: string;
  clearSearchOnClickOutside?: boolean;
  disabled?: boolean;
  onSearch?: SearchInputController['onSearch'];
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

/**
 * Lightweight shim for Stream's useChannelSearch hook.
 * Provides the same interface but without real network behaviour.
 */
export const useChannelSearch = (
  params: ChannelSearchControllerParams,
): SearchController => {
  const [inputIsFocused, setInputIsFocused] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ChannelOrUserResponse[]>([]);
  const [searching, setSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const searchBarRef = useRef<HTMLDivElement | null>(null);

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
    inputRef.current?.blur();
    clearState();
    params.onSearchExit?.();
  }, [clearState, params]);

  const onSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      params.onSearch?.(event);
    },
    [params],
  );

  const selectResult = useCallback(async (_result: ChannelOrUserResponse) => {
    throw new Error('useChannelSearch not implemented');
  }, []);

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
  } as SearchController;
};

export default useChannelSearch;
