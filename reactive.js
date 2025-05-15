Hooks.on("canvasReady", () => {
    console.log("? Reactive Escape Hook activated");
    let moveTimers = {};

    Hooks.on("updateToken", async (tokenDoc, updateData) => {
        if (!game.combat) return;
        if (!("x" in updateData || "y" in updateData)) return;

        const tokenId = tokenDoc.id;
        if (moveTimers[tokenId]) clearTimeout(moveTimers[tokenId]);

        moveTimers[tokenId] = setTimeout(async () => {
            const movedToken = canvas.tokens.get(tokenId);
            if (!movedToken) return;

            const hostiles = canvas.tokens.placeables.filter(t => {
                if (!t.actor || t.id === tokenId || t.document.disposition !== -1) return false;

                const beforeDist = MidiQOL.getDistanceSimple(t.center, {
                    x: tokenDoc._previous?.x ?? tokenDoc.x,
                    y: tokenDoc._previous?.y ?? tokenDoc.y
                });

                const afterDist = MidiQOL.getDistance(t, movedToken);

                return beforeDist <= 5 && afterDist > 5;
            });

            if (hostiles.length === 0) return;

            const hostileNames = hostiles.map(t => t.name).join(", ");
            ChatMessage.create({
                content: `?? ${movedToken.name} left melee range of: **${hostileNames}**.`,
                whisper: ChatMessage.getWhisperRecipients("GM").map(u => u.id)
            });

        }, 200);
    });
});
