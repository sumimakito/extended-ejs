const path = require("path");
const fs = require("fs");
const {renderExtension} = require("./renderer");
const {replaceRange, calculatePosition, peekAround, panic} = require("./utils");

const REGEXP_EXTENDS = /\[%\s*@extends\s+(?:'(.*?)'|"(.*)"|([^"'\s]*?))\s*%]/mig;
const REGEXP_BLOCK = /\[%\s*@block\s+(?:'(.*?)'|"(.*)"|([^"'\s]*?))\s*%]/mig;
const REGEXP_IMPLEMENT = /\[%\s*@impl\s+(?:'(.*?)'|"(.*)"|([^"'\s]*?))\s*%]([^]*?)\[%\s*@end\s*%]/mig;

const StatementType = {
  EXTENDS: 'extends',
  BLOCK: 'block',
  IMPLEMENTATION: 'impl',
};

class ParsedStatement {
  constructor() {
    this.type = null;
    this.offset = 0;
    this.length = 0;
    this.raw = null;
    this.parameter = null;
    this.body = null;
  }
}

class ParsedTemplate {
  constructor() {
    this.strict = false;
    this.file = null;
    this.raw = null;
    this.exportedBlocks = [];
    this.exportedImplementations = {};
    this.extension = null;
  }
}

parseExtension = (template) => {
  template.raw = template.raw.replace(/^\n/gmi, "");

  const matches = REGEXP_EXTENDS.exec(template.raw);
  // extends keyword not found
  if (matches === null) return null;

  // more than one extends keyword present,
  // this should be regarded as an error
  if (REGEXP_EXTENDS.exec(template.raw) !== null) {
    panic(template, matches.index, "'@extends' should only be used once per file");
  }

  const statement = new ParsedStatement();
  statement.type = StatementType.EXTENDS;
  statement.offset = matches.index;

  let layout = null;
  matches.forEach((match, groupIndex) => {
    if (groupIndex > 0) {
      layout = match || layout;
    } else {
      statement.raw = match;
      statement.length = match.length;
    }
  });
  if (layout === null || layout.trim().length === 0) {
    panic(template, matches.index, "Layout parameter for '@extends' is missing");
  }
  statement.parameter = layout.trim();

  return statement;
};

parseBlocks = (template) => {
  template.raw = template.raw.replace(/^\n/gmi, "");

  const blocks = [];
  let matches;

  while ((matches = REGEXP_BLOCK.exec(template.raw)) !== null) {
    const statement = new ParsedStatement();
    statement.type = StatementType.BLOCK;
    statement.offset = matches.index;

    let alias = null;
    matches.forEach((match, groupIndex) => {
      if (groupIndex > 0) {
        alias = match || alias;
      } else {
        statement.raw = match;
        statement.length = match.length;
      }
    });
    if (alias === null || alias.trim().length === 0) {
      panic(template, matches.index, "Alias parameter for '@block' is missing");
    }
    alias = alias.trim();
    statement.parameter = alias;
    blocks.push(statement);
  }

  return blocks;
};

parseImplementations = (template) => {
  template.raw = template.raw.replace(/^\n/gmi, "");

  const implementations = {};
  let matches;

  while ((matches = REGEXP_IMPLEMENT.exec(template.raw)) !== null) {
    const statement = new ParsedStatement();
    statement.type = StatementType.IMPLEMENTATION;

    let alias = null;
    matches.forEach((match, groupIndex) => {
      if (groupIndex === 0) {
        statement.raw = match;
        statement.length = match.length;
      } else if (groupIndex === 4) {
        statement.body = match;
      } else {
        alias = match || alias;
      }
    });
    if (alias === null || alias.trim().length === 0) {
      panic(template, matches.index, "Alias parameter for '@impl' is missing");
    }
    alias = alias.trim();
    statement.offset = matches.index;
    statement.parameter = alias;
    if (!implementations[alias] || !template.strict) {
      implementations[alias] = statement;
      template.raw = replaceRange(template.raw, matches.index, statement.length, "");
    } else {
      panic(template, matches.index, `Found duplicated implementations for block '${alias}'`);
    }
    REGEXP_IMPLEMENT.lastIndex = 0;
  }

  return implementations;
};

module.exports = {ParsedTemplate, parseExtension, parseImplementations, parseBlocks};