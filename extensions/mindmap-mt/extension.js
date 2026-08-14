const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

const VIEW_TYPE = 'mtEditor.text';

class MtCustomDocument {
  constructor(uri, initialText) {
    this.uri = uri;
    this._text = initialText;
  }

  getText() {
    return this._text;
  }

  updateText(text) {
    this._text = text;
  }
}

class MtEditorProvider {
  constructor(context) {
    this._context = context;
    this._documents = new Map();
    this._onDidChangeCustomDocument = new vscode.EventEmitter();
    this.onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;
  }

  static register(context) {
    const provider = new MtEditorProvider(context);
    context.subscriptions.push(
      vscode.window.registerCustomEditorProvider(VIEW_TYPE, provider, {
        webviewOptions: { retainContextWhenHidden: true },
        supportsMultipleEditorsPerDocument: false
      })
    );
    return provider;
  }

  async openCustomDocument(uri, _openContext, _token) {
    let text = '';
    try {
      const data = await vscode.workspace.fs.readFile(uri);
      text = Buffer.from(data).toString('utf8');
    } catch (err) {
      // 文件不存在或不可读，按空文档处理
    }
    const doc = new MtCustomDocument(uri, text);
    this._documents.set(uri.toString(), doc);
    return doc;
  }

  async resolveCustomEditor(document, webviewPanel, _token) {
    const webview = webviewPanel.webview;
    const webviewDir = path.join(this._context.extensionPath, 'webview');

    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(webviewDir)]
    };

    const appUri = webview.asWebviewUri(vscode.Uri.file(path.join(webviewDir, 'app.js')));
    const pixiUri = webview.asWebviewUri(vscode.Uri.file(path.join(webviewDir, 'vendor', 'pixi.min.js')));
    const styleUri = webview.asWebviewUri(vscode.Uri.file(path.join(webviewDir, 'style.css')));
    const iconsDir = webview.asWebviewUri(vscode.Uri.file(path.join(webviewDir, 'icons')));

    let html = fs.readFileSync(path.join(webviewDir, 'index.html'), 'utf8');
    html = html.replace(/__CSP_SOURCE__/g, webview.cspSource)
      .replace('./style.css', styleUri.toString())
      .replace('./app.js', appUri.toString())
      .replace('./vendor/pixi.min.js', pixiUri.toString())
      .replace(/\.\/icons\//g, iconsDir.toString() + '/');
    webview.html = html;

    webview.onDidReceiveMessage(async (msg) => {
      switch (msg && msg.type) {
        case 'ready':
          webview.postMessage({ type: 'load', text: document.getText() });
          break;
        case 'save':
          await this._save(document, msg.text, webview);
          break;
        case 'openFile':
          vscode.window.showInformationMessage('请在 VSCode 资源管理器中打开 .mt 文件');
          break;
        case 'openText':
          vscode.commands.executeCommand('vscode.openWith', document.uri, 'default');
          break;
      }
    });
  }

  async _save(document, text, webview) {
    if (text !== document.getText()) {
      document.updateText(text);
      this._onDidChangeCustomDocument.fire({
        document,
        undo: () => {},
        redo: () => {}
      });
    }
    try {
      await this.saveCustomDocument(document, new vscode.CancellationTokenSource().token);
      webview.postMessage({ type: 'saved' });
    } catch (err) {
      webview.postMessage({ type: 'saveError', message: String((err && err.message) || err) });
    }
  }

  async saveCustomDocument(document, _token) {
    await vscode.workspace.fs.writeFile(document.uri, Buffer.from(document.getText(), 'utf8'));
  }

  async saveCustomDocumentAs(document, destination, _token) {
    await vscode.workspace.fs.writeFile(destination, Buffer.from(document.getText(), 'utf8'));
  }

  async revertCustomDocument(document, _token) {
    const data = await vscode.workspace.fs.readFile(document.uri);
    document.updateText(Buffer.from(data).toString('utf8'));
    this._documents.set(document.uri.toString(), document);
  }

  async backupCustomDocument(document, context, _token) {
    await vscode.workspace.fs.writeFile(context.destination, Buffer.from(document.getText(), 'utf8'));
    return {
      id: document.uri.toString(),
      delete: () => {}
    };
  }
}

function activate(context) {
  MtEditorProvider.register(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('mtEditor.openWithEditor', (uri) => {
      const target = uri || (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri);
      if (!target) {
        return;
      }
      vscode.commands.executeCommand('vscode.openWith', target, VIEW_TYPE);
    }),
    vscode.commands.registerCommand('mtEditor.openAsText', (uri) => {
      const target = uri || (vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.uri);
      if (!target) {
        return;
      }
      vscode.commands.executeCommand('vscode.openWith', target, 'default');
    })
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
