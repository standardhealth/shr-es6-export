module.exports = class CodeWriter {
  constructor(indentLevel = 0) {
    this._indentLevel = 0;
    this._inBlComment = false;
    this._lines = [];
  }

  ln(str = '') {
    if (this._inBlComment) {
      str = ` * ${str}`;
    }
    if (str.length > 0 && this._indentLevel > 0) {
      this._lines.push(`${this._getIndentString()}${str}`);
    } else {
      this._lines.push(str);
    }
    return this;
  }

  bl(declaration, body = '') {
    this.ln(`${declaration} {`).indent();
    if (typeof body === 'function') {
      body.call();
    } else {
      this.ln(body);
    }
    return this.outdent().ln('}');
  }

  blComment(comments) {
    this.ln('/**');
    this._inBlComment = true;
    if (typeof comments === 'function') {
      comments.call();
    } else {
      this.ln(comments);
    }
    this._inBlComment = false;
    return this.ln(' */');
  }

  indent() {
    this._indentLevel++;
    return this;
  }

  outdent() {
    this._indentLevel--;
    return this;
  }

  toString() {
    return `${this._lines.join('\n')}\n`;
  }

  _getIndentString() {
    return '  '.repeat(this._indentLevel);
  }

  _lastCharIsLineBreak() {
    if (this._lines.length == 0) {
      return true;
    }
    for (let i = this._lines.length-1; i >= 0; i--) {
      if (this._lines[i].length) {
        return this._lines[i][this._lines[i].length - 1] === '\n';
      }
    }
    return false;
  }
};