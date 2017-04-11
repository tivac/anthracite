import m from "mithril";
import assign from "lodash.assign";
import Awesomeplete from "awesomplete";

import db from "../lib/firebase";

import id from "./lib/id";
import label from "./lib/label";
import types from "./lib/types.css";

import removeIcon from "../icons/remove.svg";

import css from "./relationship.css";

export default {
    controller : function(options) {
        var ctrl    = this,
            schema  = options.field.schema,
            content = db.child("content/" + schema);

        ctrl.id      = id(options);
        ctrl.lookup  = null;
        ctrl.handle  = null;
        ctrl.related = null;
        ctrl.names   = [];
        ctrl.baseUrl = "content/" + schema + "/";

        ctrl.options = options;

        ctrl.config = function(el, init) {
            if(init) {
                return;
            }

            ctrl.autocomplete = new Awesomeplete(el, {
                minChars  : 3,
                maxItems  : 10,
                autoFirst : true
            });

            ctrl.input = el;

            el.addEventListener("awesomplete-selectcomplete", ctrl.add);

            ctrl.autocomplete.list = ctrl.names;

            ctrl.load();
        };

        ctrl.load = function() {
            if(ctrl.handle) {
                return;
            }

            ctrl.handle = content.on("value", function(snap) {
                ctrl.lookup  = {};
                ctrl.related = snap.val();
                ctrl.names   = [];

                snap.forEach(function(details) {
                    var val = details.val();

                    ctrl.names.push(val.name);

                    ctrl.lookup[val.name] = details.key();
                });

                if(ctrl.autocomplete) {
                    ctrl.autocomplete.list = ctrl.names;
                    ctrl.autocomplete.evaluate();
                }

                m.redraw();
            });
        };

        // Set up a two-way relationship between these
        ctrl.add = function(e) {
            var key = ctrl.lookup[e.target.value];

            if(!key) {
                console.error(e.target.value);

                return;
            }

            e.target.value = "";

            ctrl.options.update(ctrl.options.path.concat(key), true);

            if(ctrl.options.root) {
                content.child(key + "/relationships/" + ctrl.options.root.key()).set(true);
            }
        };

        // BREAK THE RELATIONSHIP
        ctrl.remove = function(key, e) {
            e.preventDefault();

            ctrl.options.update(ctrl.options.path.concat(key));

            if(ctrl.options.root) {
                content.child(key + "/relationships/" + ctrl.options.root.key()).remove();
            }
        };

        if(options.data) {
            ctrl.load();
        }
    },

    view : function(ctrl, options) {
        var field  = options.field;

        ctrl.options = options;

        return m("div", { class : options.class },
            label(ctrl, options),
            m("input", assign(field.attrs || {}, {
                // Attrs
                id     : ctrl.id,
                class  : types.relationship,
                config : ctrl.config,

                // Events
                onkeydown : function(e) {
                    if(e.keyCode !== 9 || ctrl.autocomplete.opened === false) {
                        return;
                    }

                    ctrl.autocomplete.select();
                }
            })),
            m("ul", { class : css.relationships },
                options.data && Object.keys(options.data).map(function(key) {
                    return m("li", { class : css.li },
                        ctrl.related ?
                            m("div", { class : css.relationship },
                                    m("a", {
                                        href  : ctrl.baseUrl + key,
                                        class : css.link
                                    }, ctrl.related[key].name),
                                m("div", { class : css.actions },
                                    m("button", {
                                            class   : css.button,
                                            onclick : ctrl.remove.bind(ctrl, key),
                                            title   : "Remove",
                                            value   : "Remove"
                                        },
                                        m.trust(removeIcon)
                                    )
                                )
                            ) :
                            "Loading..."
                    );
                })
            )
        );
    }
};
