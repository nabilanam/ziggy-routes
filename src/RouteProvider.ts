"use strict";

import * as vscode from "vscode";
import * as fs from "fs";
import { transformSync } from "@babel/core";
import requireFromString = require("require-from-string");
import * as transformer from "@babel/plugin-transform-modules-commonjs";
import cp = require("child_process");

export default class RouteProvider implements vscode.CompletionItemProvider {
  private static ziggyPath = "";
  private static workspacePath = "";
  private static wordRegex = /[\w*\.\-\_]+/;
  private static filterRegex =
    /[^\w|\*`'"!#%^&\\/+-](?:route\((?:'|"))([\w*\.\-\_]+)(?:'|")?\)?;?$/;
  private static routes: Array<string> = [];

  constructor() {
    if (vscode.workspace.workspaceFolders !== undefined) {
      RouteProvider.workspacePath =
        vscode.workspace.workspaceFolders[0].uri.fsPath;
      RouteProvider.ziggyPath =
        RouteProvider.workspacePath + "/resources/js/ziggy.js";

      if (fs.existsSync(RouteProvider.ziggyPath)) {
        if (
          vscode.workspace
            .getConfiguration("ZiggyRoutes")
            .get<boolean>("autoRunZiggyGenerate")
        ) {
          const routeWatcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(
              vscode.workspace.workspaceFolders[0],
              "routes/web.php"
            )
          );
          routeWatcher.onDidChange(() => this.routeChanged());
          routeWatcher.onDidCreate(() => this.routeChanged());
          routeWatcher.onDidDelete(() => this.routeChanged());
        }

        const ziggyWatcher = vscode.workspace.createFileSystemWatcher(
          new vscode.RelativePattern(
            vscode.workspace.workspaceFolders[0],
            "resources/js/ziggy.js"
          )
        );
        this.filleChanged().then(() => {
          ziggyWatcher.onDidChange(() => this.filleChanged());
          ziggyWatcher.onDidCreate(() => this.filleChanged());
          ziggyWatcher.onDidDelete(() => this.filleChanged());
        });
      }
    }
  }

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): vscode.ProviderResult<
    vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>
  > {
    const text = document.lineAt(position.line).text;
    const matches = RouteProvider.filterRegex.exec(text);
    if (matches && matches.length) {
      const match = matches[1];
      return RouteProvider.routes
        .filter((r) => r.startsWith(match))
        .map((r) => {
          const item = new vscode.CompletionItem(
            r,
            vscode.CompletionItemKind.Enum
          );
          item.range = document.getWordRangeAtPosition(
            position,
            RouteProvider.wordRegex
          );
          return item;
        });
    }
  }

  routeChanged() {
    let config = vscode.workspace.getConfiguration("ZiggyRoutes");
    if (config.get<boolean>("autoRunZiggyGenerate")) {
      const artisan =
        config.get<string>("phpPath") +
        " " +
        RouteProvider.workspacePath +
        "/artisan";
      cp.exec(artisan + " route:clear", function (err) {
        if (err) {
          console.error(err);
        }
      });
      cp.exec(artisan + " ziggy:generate", function (err) {
        if (err) {
          console.error(err);
        }
      });
    }
  }

  async filleChanged() {
    try {
      const result = transformSync(
        fs.readFileSync(RouteProvider.ziggyPath).toString(),
        {
          plugins: [transformer],
        }
      );

      if (result && result.code) {
        RouteProvider.routes = Object.keys(
          requireFromString(result.code).Ziggy.routes
        );
      }
    } catch (err) {
      console.error(err);
    }
  }
}
