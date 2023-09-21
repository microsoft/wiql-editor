function makeRegexesAtStart(patterns) {
    return patterns.map(function (p) {
        var match;
        if (p.match instanceof RegExp) {
            match = new RegExp("^(?:" + p.match.source + ")", "i");
        }
        else {
            match = p.match;
        }
        return {
            match: match,
            token: p.token,
            pushState: p.pushState && makeRegexesAtStart(p.pushState),
            popState: p.popState,
        };
    });
}
export function tokenize(lines, patterns) {
    patterns = makeRegexesAtStart(patterns);
    var tokens = [];
    var states = [patterns];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].toLocaleLowerCase();
        var j = 0;
        nextToken: while (j < line.length) {
            var substr = line.substr(j);
            for (var _i = 0, _a = states[states.length - 1]; _i < _a.length; _i++) {
                var tokenPattern = _a[_i];
                var tokenText = void 0;
                var match = void 0;
                // tslint:disable-next-line:no-conditional-assignment
                if (tokenPattern.match instanceof RegExp && (match = substr.match(tokenPattern.match))) {
                    // Preserve case of matching chars
                    tokenText = lines[i].substring(j, j + match[0].length);
                }
                else if (typeof tokenPattern.match === "string"
                    && substr.indexOf(tokenPattern.match.toLocaleLowerCase()) === 0
                    // Make sure string matches are on word boundries
                    && (j + tokenPattern.match.length === line.length
                        || tokenPattern.match[tokenPattern.match.length - 1].match(/\W/)
                        || substr[tokenPattern.match.length] === undefined
                        || substr[tokenPattern.match.length].match(/\W/))) {
                    tokenText = tokenPattern.match;
                }
                if (tokenText) {
                    if (tokenPattern.token) {
                        tokens.push(new tokenPattern.token(i, j, tokenText));
                    }
                    j += tokenText.length;
                    if (tokenPattern.popState) {
                        states.pop();
                    }
                    if (tokenPattern.pushState) {
                        states.push(tokenPattern.pushState);
                    }
                    continue nextToken;
                }
            }
        }
    }
    return tokens;
}
//# sourceMappingURL=tokenizer.js.map