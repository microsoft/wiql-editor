var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { DelayedFunction } from "VSS/Utils/Core";
var flush = new DelayedFunction(null, 100, "flush", function () {
    var insights = getInsights();
    if (insights) {
        insights.flush();
    }
});
export function flushNow() {
    flush.invokeNow();
}
export function trackEvent(name, properties, measurements) {
    var insights = getInsights();
    if (insights) {
        var host = VSS.getWebContext().host;
        properties = __assign(__assign({}, (properties || {})), { host: host.name || host.authority, location: window.extensionLocation });
        insights.trackEvent(name, properties, measurements);
        flush.reset();
    }
}
export function trackPage(properties, measurements) {
    var insights = getInsights();
    if (insights) {
        var host = VSS.getWebContext().host;
        properties = __assign(__assign({}, (properties || {})), { host: host.name || host.authority });
        insights.trackPageView(undefined, undefined, properties, measurements);
        flush.reset();
    }
}
function getInsights() {
    return window.appInsights;
}
//# sourceMappingURL=events.js.map