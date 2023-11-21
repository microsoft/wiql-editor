import "azure-devops-ui/Core/override.css";
import "es6-promise/auto";
import * as React from "react";
import * as ReactDOM from "react-dom";
// import "./Common.scss";

export function showRootComponent(component: React.ReactElement<any>,  elementId:string) {
    if(elementId === undefined){
        elementId = "root";
    }
    ReactDOM.render(component, document.getElementById(elementId));
}