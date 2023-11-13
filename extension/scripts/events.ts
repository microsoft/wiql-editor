// import { DelayedFunction } from "VSS/Utils/Core";
import ApplicationInsights from "applicationinsights-js";
import * as VSS from "azure-devops-extension-sdk";

export interface IValueWithTimings<T> {
    value: T;
    properties: IProperties;
    measurements: IMeasurements;
}
export interface IProperties {
    [name: string]: string;
}
export interface IMeasurements {
    [name: string]: number;
}

//TODO: Need to re-write this part  
// const flush = new DelayedFunction(null, 100, "flush", () => {
//     const insights = getInsights();
//     if (insights) {
//         insights.flush();
//     }
// });
// export function flushNow() {
//     flush.invokeNow();
// }

export function trackEvent(name: string, properties?: IProperties, measurements?: IMeasurements) {
    const insights = getInsights();
    if (insights) {
        const  host  = VSS.getHost();
        properties = {
            ...(properties || {}),
            host: host.name,
            location: (window as any).extensionLocation as string,
        };
        insights.trackEvent(name, properties, measurements);
        // flush.reset();
    }
}

export function trackPage(properties?: IProperties, measurements?: IMeasurements) {
    const insights = getInsights();
    if (insights) {
        const host = VSS.getHost();
        properties = { ...(properties || {}), host: host.name};
        insights.trackPageView(undefined,  properties, measurements);
        // flush.reset();
    }
}

function getInsights(): ApplicationInsights.IAppInsights | undefined {
    return (window as any).appInsights;
}
