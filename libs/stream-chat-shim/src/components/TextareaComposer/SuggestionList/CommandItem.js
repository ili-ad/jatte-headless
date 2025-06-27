"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandItem = void 0;
var react_1 = require("react");
var CommandItem = function (props) {
    var entity = props.entity;
    return (<div className='str-chat__slash-command'>
      <span className='str-chat__slash-command-header'>
        <strong>{entity.name}</strong> {entity.args}
      </span>
      <br />
      <span className='str-chat__slash-command-description'>{entity.description}</span>
    </div>);
};
exports.CommandItem = CommandItem;
