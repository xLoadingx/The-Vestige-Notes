const { Plugin, PluginSettingTab, Setting } = require("obsidian");

const DEFAULT_SETTINGS = {
  skyTop: "#02040a",
  skyBottom: "#07111f",

  starColor: "#ffffff",
  starGlowColor: "#ffffff",
  shootingStarColor: "#ffffff",
  shootingStarGlowRgb: "255, 255, 255",

  backgroundOpacity: 0.8,
  starDensity: 4000,
  shootingStarCount: 4
};

function random(min, max) {
  return Math.random() * (max - min) + min;
}

module.exports = class StarryNightBackground extends Plugin {
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

    this.injectSettings();
    this.createBackground();

    this.addSettingTab(new StarryNightSettingTab(this.app, this));

    console.log("Starry Night Background loaded");
  }

  onunload() {
    this.removeBackground();
    console.log("Starry Night Background unloaded");
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.refreshBackground();
  }

  injectSettings() {
    const root = document.documentElement;

    root.style.setProperty("--starrynight-sky-top", this.settings.skyTop);
    root.style.setProperty("--starrynight-sky-bottom", this.settings.skyBottom);

    root.style.setProperty("--starrynight-star", this.settings.starColor);
    root.style.setProperty("--starrynight-star-glow", this.settings.starGlowColor);
    root.style.setProperty("--starrynight-shooting-star", this.settings.shootingStarColor);
    root.style.setProperty("--starrynight-rgb-shooting-star-glow", this.settings.shootingStarGlowRgb);

    root.style.setProperty("--starrynight-opacity", String(this.settings.backgroundOpacity));
  }

  createBackground() {
    this.removeBackground();

    this.injectSettings();

    this.backgroundContainer = document.createElement("div");
    this.backgroundContainer.className = "starrynight-bg-container";
    document.body.prepend(this.backgroundContainer);

    this.createStars();
    this.createShootingStars();
  }

  removeBackground() {
    if (this.backgroundContainer) {
      this.backgroundContainer.remove();
      this.backgroundContainer = undefined;
    }
  }

  refreshBackground() {
    this.createBackground();
  }

  createStars() {
    if (!this.backgroundContainer) return;

    const rs = getComputedStyle(document.documentElement);

    const canvasSize = window.innerWidth * window.innerHeight;
    const density = Math.max(500, Number(this.settings.starDensity) || 4000);
    const starsFraction = canvasSize / density;

    for (let i = 0; i < starsFraction; i++) {
      const size = Math.random() < 0.5 ? 1 : 2;

      const star = document.createElement("div");
      star.className = "starrynight-star";

      star.style.left = `${random(0, 99)}%`;
      star.style.top = `${random(0, 99)}%`;
      star.style.opacity = `${random(0.5, 1)}`;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;

      const starColor = rs.getPropertyValue("--starrynight-star").trim();
      star.style.backgroundColor = starColor || "#ffffff";

      if (Math.random() < 1 / 5) {
        const twinkle = Math.floor(Math.random() * 4) + 1;

        star.style.setProperty(
          "animation",
          `twinkle${twinkle} 5s infinite`,
          "important"
        );
      }

      this.backgroundContainer.appendChild(star);
    }
  }

  createShootingStars() {
    if (!this.backgroundContainer) return;

    const rs = getComputedStyle(document.documentElement);
    const count = Math.max(0, Math.min(20, Number(this.settings.shootingStarCount) || 0));

    for (let i = 0; i < count; i++) {
      const shootingStar = document.createElement("span");
      shootingStar.className = "shootingstar";

      this.randomizeShootingStarPosition(shootingStar);

      const glow = rs
        .getPropertyValue("--starrynight-rgb-shooting-star-glow")
        .trim();

      const glowColor = `rgba(${glow || "255, 255, 255"}, 0.1)`;

      shootingStar.style.boxShadow =
        `0 0 0 4px ${glowColor}, ` +
        `0 0 0 8px ${glowColor}, ` +
        `0 0 20px ${glowColor}`;

      shootingStar.style.animationDuration =
        `${Math.floor(Math.random() * 3) + 3}s`;

      shootingStar.style.animationDelay =
        `${Math.floor(Math.random() * 7)}s`;

      shootingStar.addEventListener("animationend", () => {
        this.randomizeShootingStarPosition(shootingStar);

        shootingStar.style.animation = "none";
        void shootingStar.offsetWidth;
        shootingStar.style.animation = "";

        shootingStar.style.setProperty(
          "animation-duration",
          `${Math.floor(Math.random() * 4) + 3}s`,
          "important"
        );
      });

      this.backgroundContainer.appendChild(shootingStar);
    }
  }

  randomizeShootingStarPosition(shootingStar) {
    if (Math.random() < 0.75) {
      shootingStar.style.top = "-4px";
      shootingStar.style.right = `${random(0, 90)}%`;
    } else {
      shootingStar.style.top = `${random(0, 50)}%`;
      shootingStar.style.right = "-4px";
    }
  }
};

class StarryNightSettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Starry Night Background" });

    new Setting(containerEl)
      .setName("Sky top color")
      .setDesc("Top color of the background gradient.")
      .addColorPicker((color) =>
        color
          .setValue(this.plugin.settings.skyTop)
          .onChange(async (value) => {
            this.plugin.settings.skyTop = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Sky bottom color")
      .setDesc("Bottom color of the background gradient.")
      .addColorPicker((color) =>
        color
          .setValue(this.plugin.settings.skyBottom)
          .onChange(async (value) => {
            this.plugin.settings.skyBottom = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Background opacity")
      .setDesc("How visible the starfield layer is.")
      .addSlider((slider) =>
        slider
          .setLimits(0, 1, 0.05)
          .setValue(this.plugin.settings.backgroundOpacity)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.backgroundOpacity = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Star color")
      .setDesc("Color of normal stars.")
      .addColorPicker((color) =>
        color
          .setValue(this.plugin.settings.starColor)
          .onChange(async (value) => {
            this.plugin.settings.starColor = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Star glow color")
      .setDesc("Glow color used by twinkling stars.")
      .addColorPicker((color) =>
        color
          .setValue(this.plugin.settings.starGlowColor)
          .onChange(async (value) => {
            this.plugin.settings.starGlowColor = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Star density")
      .setDesc("Lower number = more stars. Higher number = fewer stars.")
      .addSlider((slider) =>
        slider
          .setLimits(1000, 12000, 500)
          .setValue(this.plugin.settings.starDensity)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.starDensity = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Shooting star color")
      .setDesc("Color of shooting stars.")
      .addColorPicker((color) =>
        color
          .setValue(this.plugin.settings.shootingStarColor)
          .onChange(async (value) => {
            this.plugin.settings.shootingStarColor = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Shooting star glow RGB")
      .setDesc("RGB only, like: 255, 255, 255")
      .addText((text) =>
        text
          .setPlaceholder("255, 255, 255")
          .setValue(this.plugin.settings.shootingStarGlowRgb)
          .onChange(async (value) => {
            this.plugin.settings.shootingStarGlowRgb = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Shooting star count")
      .setDesc("How many shooting stars exist at once.")
      .addSlider((slider) =>
        slider
          .setLimits(0, 20, 1)
          .setValue(this.plugin.settings.shootingStarCount)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.shootingStarCount = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Reset settings")
      .setDesc("Reset all Starry Night settings to defaults.")
      .addButton((button) =>
        button
          .setButtonText("Reset")
          .setWarning()
          .onClick(async () => {
            this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
            await this.plugin.saveSettings();
            this.display();
          })
      );
  }
}