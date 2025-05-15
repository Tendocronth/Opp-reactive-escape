Hooks.once("ready", () => {
  let moveTimers = {};

  Hooks.on("updateToken", async (tokenDoc, updateData) => {
    if (!game.combat) return;
    if (!("x" in updateData || "y" in updateData)) return;

    const tokenId = tokenDoc.id;

    // Debounce token move
    if (moveTimers[tokenId]) clearTimeout(moveTimers[tokenId]);

    moveTimers[tokenId] = setTimeout(async () => {
      const movedToken = canvas.tokens.get(tokenId);
      if (!movedToken) return;

      const movedActor = movedToken.actor;
      const dex = movedActor.system.abilities.dex.value;

      const hostiles = canvas.tokens.placeables.filter(t => {
        if (!t.actor || t.id === tokenId || t.document.disposition !== -1) return false;

        const beforeDistance = MidiQOL.getDistanceSimple(t.center, {
          x: tokenDoc._previous?.x ?? tokenDoc.x,
          y: tokenDoc._previous?.y ?? tokenDoc.y
        });

        const afterDistance = MidiQOL.getDistance(t, movedToken);
        return beforeDistance <= 5 && afterDistance > 5;
      });

      if (hostiles.length === 0) return;

      for (const hostile of hostiles) {
        const pp = hostile.actor.system.attributes?.perception?.passive ?? 10;
        const result = dex >= pp ? "avoids" : "triggers";

        ChatMessage.create({
          content: `
            <b>Reactive Escape Check:</b><br>
            <b>${movedToken.name}</b> Dex: <code>${dex}</code><br>
            <b>${hostile.name}</b> PP: <code>${pp}</code><br>
            Result: <b>${movedToken.name}</b> ${result} an opportunity attack.
          `,
          whisper: ChatMessage.getWhisperRecipients("GM").map(u => u.id)
        });
      }
    }, 300); // delay after movement ends
  });
});
