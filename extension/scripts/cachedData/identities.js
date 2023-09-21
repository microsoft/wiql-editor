var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { CachedValue } from "./CachedValue";
import { getIdentities } from "./identities/getIdentities";
export var identitiesVal = new CachedValue(getIdentityStrings);
function getIdentityStrings() {
    return __awaiter(this, void 0, void 0, function () {
        var identities;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getIdentities()];
                case 1:
                    identities = _a.sent();
                    return [2 /*return*/, identities.map(function (m) { return m.isContainer ?
                            m.displayName :
                            m.displayName + " <" + m.uniqueName + ">"; })];
            }
        });
    });
}
/** No way to know if identity field from extension api, just hardcode the system ones */
var knownIdentities = [
    "System.AuthorizedAs",
    "System.ChangedBy",
    "System.AssignedTo",
    "System.CreatedBy",
    "Microsoft.VSTS.Common.ActivatedBy",
    "Microsoft.VSTS.Common.ResolvedBy",
    "Microsoft.VSTS.Common.ClosedBy",
    "Microsoft.VSTS.CodeReview.AcceptedBy",
    "Microsoft.VSTS.Common.ReviewedBy",
    "Microsoft.VSTS.CMMI.SubjectMatterExpert1",
    "Microsoft.VSTS.CMMI.SubjectMatterExpert2",
    "Microsoft.VSTS.CMMI.SubjectMatterExpert3",
    "Microsoft.VSTS.CMMI.CalledBy",
    "Microsoft.VSTS.CMMI.RequiredAttendee1",
    "Microsoft.VSTS.CMMI.RequiredAttendee2",
    "Microsoft.VSTS.CMMI.RequiredAttendee3",
    "Microsoft.VSTS.CMMI.RequiredAttendee4",
    "Microsoft.VSTS.CMMI.RequiredAttendee5",
    "Microsoft.VSTS.CMMI.RequiredAttendee6",
    "Microsoft.VSTS.CMMI.RequiredAttendee7",
    "Microsoft.VSTS.CMMI.RequiredAttendee8",
    "Microsoft.VSTS.CMMI.OptionalAttendee1",
    "Microsoft.VSTS.CMMI.OptionalAttendee2",
    "Microsoft.VSTS.CMMI.OptionalAttendee3",
    "Microsoft.VSTS.CMMI.OptionalAttendee4",
    "Microsoft.VSTS.CMMI.OptionalAttendee5",
    "Microsoft.VSTS.CMMI.OptionalAttendee6",
    "Microsoft.VSTS.CMMI.OptionalAttendee7",
    "Microsoft.VSTS.CMMI.OptionalAttendee8",
    "Microsoft.VSTS.CMMI.ActualAttendee1",
    "Microsoft.VSTS.CMMI.ActualAttendee2",
    "Microsoft.VSTS.CMMI.ActualAttendee3",
    "Microsoft.VSTS.CMMI.ActualAttendee4",
    "Microsoft.VSTS.CMMI.ActualAttendee5",
    "Microsoft.VSTS.CMMI.ActualAttendee6",
    "Microsoft.VSTS.CMMI.ActualAttendee7",
    "Microsoft.VSTS.CMMI.ActualAttendee8",
];
export function isIdentityField(fields, refNameOrName) {
    var field = fields.getField(refNameOrName);
    if (!field) {
        return false;
    }
    // Use the new field flag to detect if identity when available
    // this is the only way to detect if custom fields are identity fields
    return field.isIdentity || knownIdentities.indexOf(field.referenceName) >= 0;
}
//# sourceMappingURL=identities.js.map