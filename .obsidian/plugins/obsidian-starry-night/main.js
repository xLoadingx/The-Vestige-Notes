const { Plugin } = require("obsidian");

module.exports = class StarryNightBackground extends Plugin {
  onload() {
    console.log("STAR TEST LOADED");
  }

  onunload() {
    console.log("STAR TEST UNLOADED");
  }
};