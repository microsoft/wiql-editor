import * as React from "react";
import * as ReactDom from "react-dom";
import * as VSS from "azure-devops-extension-sdk";
import { IHostNavigationService, CommonServiceIds } from "azure-devops-extension-api";
import { FieldType, WorkItem, WorkItemFieldReference, WorkItemQueryResult } from "azure-devops-extension-api/WorkItemTracking";


import { FieldLookup, fieldsVal } from "../cachedData/fields";
import { getHostUrl, getProject } from "../getProject";

function parseDateString(dateString: string): Date {
    return new Date(dateString);
}

class WorkItemRow extends React.Component<{
    wi: WorkItem,
    columns: WorkItemFieldReference[],
    rel?: string,
    fields: FieldLookup,
}, {}> {

    public async componentDidMount() {
        const project = await getProject();
        this.setState({ project: project.name });
    }

    public render() {
        const { fields, columns, wi, rel} = this.props;
        const project  = this.state;
        const host = getHostUrl();

        const wiUrl = `${host}${project}/_workitems?id=${wi.id}&_a=edit&fullScreen=true`;

        const tds: JSX.Element[] = [];
        if (rel) {
            tds.push(<div className={"cell"} title={"Link Type"}>{rel}</div>);
        }
        for (const fieldRef of columns) {
            let value = wi.fields[fieldRef.referenceName];
            const field = fields.getField(fieldRef.referenceName);
            if (field && field.type === FieldType.DateTime) {
                const date = parseDateString(value);
                //TODO: Need to fix this ? 
                // value = localeFormat(date);
            }
            tds.push(<div className={"cell"} title={fieldRef.name}>{value}</div>);
        }
        return (
            <a
                className={"row"}
                tabIndex={0}
                href={wiUrl}
                target={"_blank"}
                rel={"noreferrer"}
                onKeyDown={(e) => {
                    if (e.keyCode === 40) {
                        $(":focus").next().focus();

                    }
                    if (e.keyCode === 38) {
                        $(":focus").prev().focus();

                    }}
                }
                >
                {tds}
            </a>
        );
    }
}

class WorkItemTable extends React.Component<{ workItems: WorkItem[], result: WorkItemQueryResult, fields: FieldLookup }, {}> {
    public render() {
        const wiMap = {} as {[id: string]: WorkItem};
        for (const wi of this.props.workItems) {
            wiMap[wi.id] = wi;
        }
        const workItems = this.props.result.workItems
            .filter((wi) => wi.id in wiMap)
            .map((wi) => wiMap[wi.id]);
        const rows = workItems.map((wi) => <WorkItemRow wi={wi} columns={this.props.result.columns} fields={this.props.fields} />);
        return <div className={"table"}>{rows}</div>;
    }
}

class ResultCountDisclaimer extends React.Component<{ count: number }, {}> {
    public render() {
        const message = this.props.count < 50 ? `Found ${this.props.count} results` : `Showing first 50 results`;
        return <div>{message}</div>;
    }

}

class WorkItemRelationsTable extends React.Component<{ result: WorkItemQueryResult, workItems: WorkItem[], fields: FieldLookup }, {}> {
    public render() {
        const wiMap: { [id: number]: WorkItem } = {};
        for (const workitem of this.props.workItems) {
            wiMap[workitem.id] = workitem;
        }
        const rows = this.props.result.workItemRelations
            .filter((wi) => wi.target.id in wiMap)
            .map((rel) =>
            <WorkItemRow
                rel={rel.rel || "Source"}
                columns={this.props.result.columns}
                wi={wiMap[rel.target.id]}
                fields={this.props.fields}
            />,
        );
        return <div className={"table"}>{rows}</div>;
    }
}

export function renderResult(result: WorkItemQueryResult, workItems: WorkItem[]) {
    let table: JSX.Element;
    fieldsVal.getValue().then((fields) => {
        const props = {workItems, result, fields};
        if (result.workItems) {
            table = <WorkItemTable {...props} />;
        } else {
            table = <WorkItemRelationsTable {...props} />;
        }
        ReactDom.render(
            <div >
                {table}
                <ResultCountDisclaimer count={(result.workItems || result.workItemRelations).length} />
            </div>
            , document.getElementById("query-results") as HTMLElement,
        );
    });
}

export function setError(error: any | string) {
    const message = typeof error === "string" ? error : ((error.serverError || error) as any).message as string;
    ReactDom.render(<div className={"error-message"}>{message}</div>, document.getElementById("query-results") as HTMLElement);
}

export function setMessage(message: string | string[]) {
    if (typeof message === "string") {
        message = [message];
    }
    const messageElems = message.map((m) => <div>{m}</div>);
    ReactDom.render(<div>{messageElems}</div>, document.getElementById("query-results") as HTMLElement);
}

export function setVersion() {
    const elem = document.getElementById("header-bar");
    if (!elem) {
        return;
    }
    ReactDom.render(
            <div className="header">
                <span className="bowtie">
                    <input className="wiq-input" accept=".wiq" type="file"/>
                    <button onClick={() => $(".wiq-input").click()}>Import</button>
                    <button className="wiq-export">Export</button>
                </span>
                <span className="links">
                    <a href="https://marketplace.visualstudio.com/items?itemName=ms-devlabs.wiql-editor#review-details" target="_blank">Review</a>{" | "}
                    <a href="https://github.com/microsoft/wiql-editor/issues" target="_blank">Report an issue</a>{" | "}
                    <a href="mailto:wiqleditor@microsoft.com" target="_blank">Feedback and questions</a>
                </span>
            </div>
        , elem);
}

VSS.getService(CommonServiceIds.HostNavigationService).then((navigationService: IHostNavigationService) => {
    $("body").on("click", "a[href]", (e) => {
        if (!e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            const link = $(e.target).closest("a[href]");
            const href = link.attr("href");
            if (href && !link.attr("download")) {
                navigationService.openNewWindow(href, "");
                e.stopPropagation();
                e.preventDefault();
            }
        }
    });
});
