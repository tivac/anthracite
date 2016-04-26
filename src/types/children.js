"use strict";

var m      = require("mithril"),
    get    = require("lodash.get"),
    assign = require("lodash.assign"),

    input = require("./lib/input"),

    css = require("./lib/types.css"),

    // Bound below
    types;

module.exports = {
    view : function(ctrl, options) {
        var fields = options.fields || [];

        return m("div", options.class ? { class : options.class } : null,
            fields.map(function(field, index) {
                var component = types[field.type || field];

                if(!component) {
                    return m("div",
                        m("p", "Unknown component"),
                        m("pre", JSON.stringify(field, null, 4))
                    );
                }

                return m.component(component, assign({}, options, {
                    field : field,
                    class : css[index ? "field" : "first"],
                    data  : get(options.data, field.key),
                    path  : options.path.concat(field.key)
                }));
            })
        );
    }
};

// Have to bind these down here to avoid circular binding issues
types = {
    // Structural
    fieldset  : require("./fieldset"),
    repeating : require("./repeating"),
    split     : require("./split"),
    tabs      : require("./tabs"),

    // Non-input fields
    instructions : require("./instructions"),
    
    // Custom input types
    relationship : require("./relationship"),
    markdown     : require("./markdown"),
    textarea     : require("./textarea"),
    upload       : require("./upload"),
    
    // Implementations based on lib/multiple.js
    select   : require("./select"),
    radio    : require("./radio"),
    checkbox : require("./checkbox"),

    // Implementations based on lib/input.js
    date     : input("date"),
    datetime : input("datetime-local"),
    email    : input("email"),
    number   : input("number"),
    text     : input("text"),
    time     : input("time"),
    url      : input("url")
};
