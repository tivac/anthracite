import m from "mithril";
import assign from "lodash.assign";
import get from "lodash.get";

import id from "./id";
import label from "./label";

import css from "./types.css";

export default function(type) {
    return {
        controller : function(options) {
            var ctrl    = this,
                content = options.content,
                val     = get(options.field, "attrs.value");
                
            ctrl.id = id(options);
            
            // tivac/crucible#96
            // If this is a new item (never been updated) set the default value
            // Don't want to use that value on every render because it is bad UX,
            // the user becomes unable to clear out the field
            if(val && options.root) {
                options.root.child("updated_at").on("value", function(snap) {
                    if(snap.exists()) {
                        return;
                    }
                    
                    content.setField(options.path, val);
                    
                    m.redraw();
                });
            }
        },

        view : function(ctrl, options) {
            var content = options.content,
                field  = options.field;
            
            return m("div", { class : options.class },
                label(ctrl, options),
                m("input", assign({}, field.attrs || {}, {
                        // attrs
                        id       : ctrl.id,
                        name     : field.name,
                        type     : type || "text",
                        class    : css[type || "text"],
                        value    : options.data || "",
                        required : options.required,

                        // events
                        oninput : m.withAttr("value", content.setField.bind(content, options.path))
                    }
                ))
            );
        }
    };
}
