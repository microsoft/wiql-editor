export function getCurrentTheme() {
    var styles = $("style[type='text/css']").toArray().map(function (s) { return s.innerHTML; });
    var themeStyle = styles.filter(function (s) { return s.indexOf("palette-neutral-0: ") > 0; })[0];
    if (!themeStyle) {
        return "light";
    }
    /** given the rgb values of the background color grab the red value */
    var backgroundRed = themeStyle.match(/--palette-neutral-0: (\d+)/);
    var amountofRed = backgroundRed && +backgroundRed[1];
    return amountofRed === 255 ? "light" : "dark";
}
//# sourceMappingURL=getCurrentTheme.js.map