import * as vscode from "vscode";
import RouteProvider from "./RouteProvider";

export function activate(context: vscode.ExtensionContext) {
  vscode.window.setStatusBarMessage("Ziggy Routes Extension Activated.");
  if (
    vscode.workspace.workspaceFolders instanceof Array &&
    vscode.workspace.workspaceFolders.length > 0
  ) {
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        { scheme: "file", language: "vue" },
        new RouteProvider(),
        "\"'"
      )
    );
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        { scheme: "file", language: "javascript" },
        new RouteProvider(),
        "\"'"
      )
    );
  }
}

export function deactivate() {}
