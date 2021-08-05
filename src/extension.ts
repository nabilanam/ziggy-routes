import * as vscode from "vscode";
import RouteProvider from "./RouteProvider";

export function activate(context: vscode.ExtensionContext) {
  vscode.window.setStatusBarMessage("Ziggy Routes Activated.");

  if (
    vscode.workspace.workspaceFolders instanceof Array &&
    vscode.workspace.workspaceFolders.length > 0
  ) {
    const provider = new RouteProvider(
      vscode.window.createOutputChannel("Ziggy Routes")
    );

    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        { scheme: "file", language: "vue" },
        provider,
        "\"'"
      )
    );
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        { scheme: "file", language: "javascript" },
        provider,
        "\"'"
      )
    );
  }
}

export function deactivate() {}
