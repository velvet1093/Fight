# Sakura Hearts — notes for Claude

- The user wants a **direct play link at the end of every interaction**.
- Playable link (claude.ai Artifact): https://claude.ai/artifact/JF3AHasmgfN29ENbEDXZ1K
- After any game change: run `node tools/build-artifact.js <scratchpad>/sakura-hearts.html`, republish it
  to the artifact URL above (pass it as `url` from a new conversation), and end the reply with the link.
- Publish the artifact with `capabilities: {db: {}, user: {}}` (omit on redeploys to keep them): save slots sync to `data/users/<id>/slot1..3`. Never change the save doc paths or the `{v, savedAt, state}` shape without a migration — players' progress lives there.
- Girl names, in order: Nami, Aqua, Yumeko, Kurumi, Rem, Zero Two, Frieren, Marin, Krul (ids `nami`, `aqua`, `yumeko`, `kurumi`, `rem`, `zerotwo`, `frieren`, `marin`, `krul`). Rei was removed at the user's request; `migrate()` drops her from old saves. Marin is Marin Kitagawa: long blonde hair with pink tips, black choker, white shirt knotted at the waist, loose blue tie, light-blue plaid skirt. Krul is Krul Tepes: pink twin tails with black bat ornaments, red eyes, pointed ears, black dress with gold buttons, big black sleeves, black/red cape, thigh-high boots.
- Life mode (needs, rent, girls' jobs) is on by default; `S.pacifist` turns it off. Tests load `index.html?debug&quiet` (quiet = no random girl-to-girl scenes).
- Open-world town (`js/world.js`); the player sprite is based on the user's reference: long silver hair with an ahoge, red eyes, white gold-trimmed coat, blue cravat, white gloves, dark trousers.
- Minigames live in `js/minigames.js` (`MINIGAMES.play(container, kind, opts)`); casino and Tokisaki Mansion are on the far east side (map is 90 wide). Kurumi is rich (`LIFE.kurumi.rich`). Marin's cosplays: `COSPLAYS` in data.js, `SPRITES` COSPLAY, walkers outfit 'cosplay'.
- Phone chat app "WhatsUp" stores texts in `S.msgs` (`{day, t, from, chat, text, me?, read?}`); push with `chatPush(chat, {...})`. Guide: `openGuide()`. Test: `node tools/fun.js <outdir>`.
- Emoji in UI text are swapped for pixel icons by `js/icons.js` (a MutationObserver); add an icon there when you add a new emoji. Plain symbols (♥ ♠ ▶ …) stay text.
- WhatsUp typing uses the offline engine `js/chatbot.js` (`CHATBOT.reply`); facts she learns live in `S.chatMem[id]`. Lines shared by every girl should go in `DATA.VARIETY` (picked with `vary(id, key)`, never repeating back-to-back).
- Wardrobe part colours: `S.wardrobe[id].tint[lookKey][partKey]`, parts found by `SPRITES.parts()`; walkers map their flat colours with `SPRITES.tintFlat()`.
- Flirty tease (`TEASE` in data.js, `tease()`/`teaseScene()`/`alone()` in game.js) is only for Nami and Aqua, who are adults in canon, and only when you're alone with her at home or in her room. It uses the normal chibi sprites, so it stays implied: the moment is hidden behind hearts and sparkles, and nothing revealing is drawn. Do not extend it to the other girls (several are minors in their source series). Test: `node tools/tease.js <outdir>`.
