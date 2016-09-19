import m from "mithril";
import assign from "lodash.assign";
import get from "lodash.get";

import css from "./radio.css";
import multiple from "./lib/multiple";

export default multiple({
        multiple : false
    },
        
    function(ctrl, options, children) {
        var field = options.field,
            req = options.required;

        return (children || []).map(function(opt) {
            return m("label", { class : css.choice },
                m("input", assign({}, opt.attrs, {
                    // attrs
                    type    : "radio",
                    name    : field.name,
                    value   : opt.value,
                    checked : opt.selected,

                    required : req,

                    // events
                    onchange : function() {
                        ctrl.value(options, opt.key, opt.value);
                    }
                })),
                " " + opt.name
            );
        });
    }
);
