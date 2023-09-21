import { authTokenManager } from "VSS/Authentication/Services";
export function callApi(url, method, headers, data, success, failure) {
    VSS.getAccessToken().then(function (sessionToken) {
        var authorizationHeaderValue = authTokenManager.getAuthorizationHeader(sessionToken);
        $.ajax({
            url: url,
            method: method,
            data: data || "",
            success: success,
            error: function (jqXHR, _, errorThrown) {
                if (jqXHR.responseJSON || 401 !== jqXHR.status && 403 !== jqXHR.status) {
                    if (jqXHR.responseJSON) {
                        failure(jqXHR.responseJSON, errorThrown, jqXHR.status);
                    }
                    else {
                        failure({ name: "CallFailure", message: "call failed with status code " + jqXHR.status }, errorThrown, jqXHR.status);
                    }
                }
                else {
                    failure({ name: "AuthorizationFailure", message: "unauthorized call" }, errorThrown, jqXHR.status);
                }
            },
            beforeSend: function (jqXHR) {
                jqXHR.setRequestHeader("Authorization", authorizationHeaderValue);
                if (headers) {
                    for (var header in headers) {
                        jqXHR.setRequestHeader(header, headers[header]);
                    }
                }
            },
        });
    });
}
//# sourceMappingURL=RestCall.js.map