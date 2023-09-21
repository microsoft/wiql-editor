import "promise-polyfill/src/polyfill";
import { trackEvent } from "../events";
import { getCurrentTheme } from "../getCurrentTheme";
import { showDialog } from "../queryEditor/queryDialog";
trackEvent("pageLoad");
var menuAction = {
    getMenuItems: function (context) {
        if (!context || !context.query) {
            return [];
        }
        return [{
                text: "Edit query wiql",
                icon: getCurrentTheme() === "dark" ? "img/smallDarkThemeLogo.png" : "img/smallLogo.png",
                action: function (actionContext) {
                    showDialog(actionContext.query);
                },
            }];
    },
};
var extensionContext = VSS.getExtensionContext();
VSS.register(extensionContext.publisherId + "." + extensionContext.extensionId + ".query-menu", menuAction);
VSS.register(extensionContext.publisherId + "." + extensionContext.extensionId + ".query-results-menu", menuAction);
//# sourceMappingURL=queryContext.js.map