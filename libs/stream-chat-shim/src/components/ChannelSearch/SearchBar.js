"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchBar = void 0;
var react_1 = require("react");
var clsx_1 = require("clsx");
var icons_1 = require("./icons");
var SearchInput_1 = require("./SearchInput");
var SearchBarButton = function (_a) {
    var children = _a.children, className = _a.className, onClick = _a.onClick;
    return (<button className={(0, clsx_1.default)('str-chat__channel-search-bar-button', className)} data-testid='search-bar-button' onClick={onClick}>
    {children}
  </button>);
};
// todo: add context menu control logic
var SearchBar = function (props) {
    var activateSearch = props.activateSearch, AppMenu = props.AppMenu, _a = props.ClearInputIcon, ClearInputIcon = _a === void 0 ? icons_1.XIcon : _a, exitSearch = props.exitSearch, _b = props.ExitSearchIcon, ExitSearchIcon = _b === void 0 ? icons_1.ReturnIcon : _b, inputIsFocused = props.inputIsFocused, _c = props.MenuIcon, MenuIcon = _c === void 0 ? icons_1.MenuIcon : _c, searchBarRef = props.searchBarRef, _d = props.SearchInput, SearchInput = _d === void 0 ? SearchInput_1.SearchInput : _d, _e = props.SearchInputIcon, SearchInputIcon = _e === void 0 ? icons_1.SearchIcon : _e, inputProps = __rest(props, ["activateSearch", "AppMenu", "ClearInputIcon", "exitSearch", "ExitSearchIcon", "inputIsFocused", "MenuIcon", "searchBarRef", "SearchInput", "SearchInputIcon"]);
    var _f = (0, react_1.useState)(false), menuIsOpen = _f[0], setMenuIsOpen = _f[1];
    var appMenuRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        if (!appMenuRef.current)
            return;
        var handleKeyDown = function (event) {
            if (menuIsOpen && event.key === 'Escape') {
                setMenuIsOpen(false);
            }
        };
        var clickListener = function (e) {
            var _a;
            if (!(e.target instanceof HTMLElement) ||
                !menuIsOpen ||
                ((_a = appMenuRef.current) === null || _a === void 0 ? void 0 : _a.contains(e.target)))
                return;
            setMenuIsOpen(false);
        };
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', clickListener);
        return function () {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('click', clickListener);
        };
    }, [menuIsOpen]);
    (0, react_1.useEffect)(function () {
        if (!props.inputRef.current)
            return;
        var input = props.inputRef.current;
        var handleFocus = function () {
            activateSearch();
        };
        var handleBlur = function (e) {
            e.stopPropagation(); // handle blur/focus state with React state
        };
        input.addEventListener('focus', handleFocus);
        input.addEventListener('blur', handleBlur);
        return function () {
            input.removeEventListener('focus', handleFocus);
            input.removeEventListener('blur', handleBlur);
        };
    }, [activateSearch, props.inputRef]);
    var handleClearClick = (0, react_1.useCallback)(function () {
        var _a;
        exitSearch();
        (_a = inputProps.inputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
    }, [exitSearch, inputProps.inputRef]);
    var closeAppMenu = (0, react_1.useCallback)(function () { return setMenuIsOpen(false); }, []);
    return (<div className='str-chat__channel-search-bar' data-testid='search-bar' ref={searchBarRef}>
      {inputIsFocused ? (<SearchBarButton className='str-chat__channel-search-bar-button--exit-search' onClick={exitSearch}>
          <ExitSearchIcon />
        </SearchBarButton>) : AppMenu ? (<SearchBarButton className='str-chat__channel-search-bar-button--menu' onClick={function () { return setMenuIsOpen(function (prev) { return !prev; }); }}>
          <MenuIcon />
        </SearchBarButton>) : null}

      <div className={(0, clsx_1.default)('str-chat__channel-search-input--wrapper', inputProps.query && 'str-chat__channel-search-input--wrapper-active')}>
        <div className='str-chat__channel-search-input--icon'>
          <SearchInputIcon />
        </div>
        <SearchInput {...inputProps}/>
        <button className='str-chat__channel-search-input--clear-button' data-testid='clear-input-button' disabled={!inputProps.query} onClick={handleClearClick}>
          <ClearInputIcon />
        </button>
      </div>
      {menuIsOpen && AppMenu && (<div ref={appMenuRef}>
          <AppMenu close={closeAppMenu}/>
        </div>)}
    </div>);
};
exports.SearchBar = SearchBar;
