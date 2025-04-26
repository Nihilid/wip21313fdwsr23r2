// sheet-injector.js

Hooks.on("renderActorSheetPF2e", async (sheet, html, data) => {
  html.on("click", ".open-pregnancy-log", () => renderPregnancyLog(sheet.actor));
  html.on("click", ".open-sexual-history", () => renderSexualHistory(sheet.actor));
  html.on("change", "input[name^='flags.dndegenerates.']", async function () {
    const path = this.name;
    const value = parseInt(this.value, 10) || 0;
    await sheet.actor.setFlag("dndegenerates", path.split(".").pop(), value);
    const tab = html.find(".tab.degeneracy");
    if (tab.length) {
      tab.find(`input[name='${path}']`).val(value);
    }
  });
  });
  html.on("click", ".editable-degen", async function () {
    const stat = this.dataset.type;
    const actor = sheet.actor;
    const current = getProperty(actor, `flags.dndegenerates.${stat}`) ?? 0;
    await actor.setFlag("dndegenerates", stat, current + 1);
    sheet.render();
  });
  const actor = sheet.actor;

  // Only add tab for PCs
  if (!actor.hasPlayerOwner) return;

  const nav = html.find(".sheet-navigation .item[data-tab='actions']");
  const content = html.find(".sheet-body .sheet-content");

  // Add tab button
  nav.after(`
    <a class="item" data-tab="degeneracy" data-tooltip="Degeneracy" data-tooltip-direction="UP">
      <i class="fas fa-heart-crack"></i>
    </a>
  `);

  // Inject tab content
  const pregnancies = getProperty(actor, "flags.dndegenerates.pregnancies") || [
    { race: "Orc", count: 2, progress: 0.64 },
    { race: "Goblin", count: 4, progress: 0.15 }
  ];

  const history = getProperty(actor, "flags.dndegenerates.sexualHistory") || [
    { partner: "Orc", act: "Breeding", result: "Impregnated", time: "Day 5, 2:00 AM" }
  ];

  const orgasms = getProperty(actor, "flags.dndegenerates.orgasms") ?? 3;
  const cumshots = getProperty(actor, "flags.dndegenerates.cumshots") ?? 6;
  const wombVolume = getProperty(actor, "flags.dndegenerates.wombVolume") ?? 42;

  const themeIsDark = document.body.classList.contains("pf2e-dark-theme") ||
                        document.body.classList.contains("foundryvtt-dark-mode") ||
                        (document.body.classList.contains("pathfinder-ui") &&
                         (document.body.classList.contains("dark-mode") || document.body.classList.contains("dark")));
const degeneracyStyle = themeIsDark ? "color: var(--text-light);" : "color: var(--text-dark);";" : "color: var(--text-dark);";

  function renderPregnancyLog(actor) {
  const pregnancies = getProperty(actor, "flags.dndegenerates.pregnancies") || [];
  const content = `<h2>Pregnancies</h2><ul>` +
    (pregnancies.length ? pregnancies.map((p, i) =>
      `<li>${p.race} x${p.count} — ${(p.progress * 100).toFixed(0)}% <button data-index='${i}' class='delete-pregnancy'>🗑️</button></li>`
    ).join("") : `<li>No pregnancies recorded.</li>`) +
    `</ul><button class='clear-pregnancies'>Clear All</button>`;

  new Dialog({
    classes: [themeIsDark ? 'dialog-darkmode' : 'dialog-lightmode'],
    title: "Pregnancy Log",
    content,
    buttons: {},
    render: html => {
      html.on("click", ".delete-pregnancy", async e => {
        const index = Number(e.currentTarget.dataset.index);
        const updated = [...pregnancies];
        updated.splice(index, 1);
        await actor.setFlag("dndegenerates", "pregnancies", updated);
        renderPregnancyLog(actor);
      });
      html.on("click", ".clear-pregnancies", async () => {
        if (confirm("Clear all pregnancy data?")) {
          await actor.setFlag("dndegenerates", "pregnancies", []);
          renderPregnancyLog(actor);
        }
      });
    }
  }).render(true);
}

function renderSexualHistory(actor) {
  const history = getProperty(actor, "flags.dndegenerates.sexualHistory") || [];
  const sortedHistory = [...history].sort((a, b) => (a.time > b.time ? -1 : 1));
  const content = `<h2>Sexual History</h2><ul>` +
    (sortedHistory.length ? sortedHistory.map((h, i) =>
      `<li><strong>${h.partner}</strong>: ${h.act} → ${h.result} @ ${h.time} <button data-index='${i}' class='delete-history'>🗑️</button></li>`
    ).join("") : `<li>No sexual history recorded.</li>`) +
    `</ul><button class='clear-history'>Clear All</button>`;

  new Dialog({
    title: "Sexual History",
    content,
    buttons: {},
    render: html => {
      html.on("click", ".delete-history", async e => {
        const index = Number(e.currentTarget.dataset.index);
        const updated = [...history];
        updated.splice(index, 1);
        await actor.setFlag("dndegenerates", "sexualHistory", updated);
        renderSexualHistory(actor);
      });
      html.on("click", ".clear-history", async () => {
        if (confirm("Clear all sexual history?")) {
          await actor.setFlag("dndegenerates", "sexualHistory", []);
          renderSexualHistory(actor);
        }
      });
    }
  }).render(true);
}
  
}

content.append(`
  <div class="tab degeneracy sheet-tab" data-tab="degeneracy" style="background-color: black; color: #eee; padding: 1em; border-radius: 8px; box-shadow: 0 0 4px #000;">
    <h2>Degeneracy Stats</h2>
    <p><strong>Orgasms:</strong> <input type="number" name="flags.dndegenerates.orgasms" value="${orgasms}" style="width: 3em; background-color: #1a1a1a; border: 1px solid #555; color: #eee; padding: 2px 4px; border-radius: 4px; text-align: center;"></p>
    <p><strong>Cumshots Taken:</strong> <input type="number" name="flags.dndegenerates.cumshots" value="${cumshots}" style="width: 3em; background-color: #1a1a1a; border: 1px solid #555; color: #eee; padding: 2px 4px; border-radius: 4px; text-align: center;"></p>
    <p><strong>Womb Volume:</strong> ${wombVolume} mL</p>

    <div class="degen-button-group" style="display: flex; gap: 1em; justify-content: center; margin: 1em 0;">
      <button class="open-pregnancy-log">View Pregnancies</button>
      <button class="open-sexual-history">View Sexual History</button>
    </div>

    <hr style="opacity: 0.3;">

    <h2>Sexual Vital Stats</h2>
    <p><strong>Stimulation (Bar5):</strong> ${Math.floor(getProperty(actor, "flags.barbrawl.resourceBars.bar5.value") ?? 0)}%</p>
    <p><strong>Arousal (Bar2):</strong> ${Math.floor(getProperty(actor, "flags.barbrawl.resourceBars.bar2.value") ?? 0)}%</p>
    <p><strong>Lust (Bar3):</strong> ${Math.floor(getProperty(actor, "flags.barbrawl.resourceBars.bar3.value") ?? 0)}</p>
    <p><strong>Libido (Bar4):</strong> ${Math.floor(getProperty(actor, "flags.barbrawl.resourceBars.bar4.value") ?? 0)}</p>
    <p><strong>Visible Scrawls:</strong> ${game.dndPF2e?.effectEngine?.getVisibleBodyScrawls?.(actor)?.length ?? 0}</p>
    <p><strong>Milk Volume:</strong> ${getProperty(actor, "flags.dndegenerates.milk.currentVolume") ?? 0} mL</p>
    <p><strong>Milk Fullness:</strong> ${(() => {
      const cur = getProperty(actor, "flags.dndegenerates.milk.currentVolume") ?? 0;
      const max = getProperty(actor, "flags.dndegenerates.milk.maxVolume") ?? 2500;
      return Math.floor((cur / max) * 100);
    })()}%${(() => {
      const cur = getProperty(actor, "flags.dndegenerates.milk.currentVolume") ?? 0;
      const max = getProperty(actor, "flags.dndegenerates.milk.maxVolume") ?? 2500;
      const fullness = (cur / max) * 100;
      if (fullness >= 90) return "<br><strong style='color: #fff;'>Overflowing</strong>";
      if (fullness >= 70) return "<br><strong style='color: #bbb;'>Trickling</strong>";
      if (fullness >= 50) return "<br><strong style='color: #777;'>Lactating</strong>";
      return "";
    })()}</p>
    <p><strong>Exposure Status:</strong> ${(() => {
      const coverage = game.dndPF2e?.attireSystem?.getCoverageMap?.(actor) ?? {};
      if (!game.dndPF2e?.attireSystem?.getCoverageMap) return "Unknown";
      const exposed = ["chest", "groin", "belly", "ass"].filter(part => coverage[part]?.tier === "exposed");
      return exposed.length ? exposed.join(", ") : "Fully Covered";
    })()}</p>
  </div>
`);

