-- Product catalog seed — the single source of truth for the storefront's
-- products. Run on every boot by seedProductsFromSql() in seed.ts. Idempotent
-- full upsert:
--   * fresh DB    → all rows inserted
--   * existing DB → new ids inserted; seeded ids (1–44) are fully synced to the
--                   values below (title, price, image, …). Admin-ADDED products
--                   (id ≥ 45) aren't listed here, so they're never touched.
-- Prices are in INR (whole rupees). image_url is real cover art / console photo.
INSERT INTO products
  (id, title, type, platform, "condition", price, original_price, rating, emoji, accent, image_url)
VALUES
  (1, 'Elden Ring', 'game', 'PlayStation', 'Mint', 2904, 4979, 4.9, '⚔️', 'from-amber-500/30 to-brand/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1245620/library_600x900.jpg'),
  (2, 'God of War Ragnarök', 'game', 'PlayStation', 'Good', 2489, 4149, 4.8, '🪓', 'from-blue-500/30 to-cyan-400/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/2322010/library_600x900.jpg'),
  (3, 'The Legend of Zelda: Tears of the Kingdom', 'game', 'Nintendo', 'Mint', 3734, 5809, 4.9, '🗡️', 'from-emerald-500/30 to-lime-400/30', 'https://upload.wikimedia.org/wikipedia/en/f/fb/The_Legend_of_Zelda_Tears_of_the_Kingdom_cover.jpg'),
  (4, 'Mario Kart 8 Deluxe', 'game', 'Nintendo', 'Good', 3319, 4979, 4.7, '🏎️', 'from-red-500/30 to-orange-400/30', 'https://upload.wikimedia.org/wikipedia/en/b/b5/MarioKart8Boxart.jpg'),
  (5, 'Halo Infinite', 'game', 'Xbox', 'Fair', 1659, 4149, 4.3, '🪖', 'from-green-500/30 to-teal-400/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1240440/library_600x900.jpg'),
  (6, 'Cyberpunk 2077', 'game', 'PC', 'Good', 2074, 4979, 4.5, '🌆', 'from-yellow-400/30 to-fuchsia-500/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900.jpg'),
  (7, 'Forza Horizon 5', 'game', 'Xbox', 'Mint', 2738, 4979, 4.8, '🚗', 'from-purple-500/30 to-pink-400/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1551360/library_600x900.jpg'),
  (8, 'Baldur’s Gate 3', 'game', 'PC', 'Mint', 3319, 4979, 5.0, '🐉', 'from-rose-500/30 to-amber-400/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_600x900.jpg'),
  (9, 'PlayStation 5 (Slim)', 'console', 'PlayStation', 'Good', 31539, 41499, 4.8, '🎮', 'from-blue-600/40 to-indigo-500/30', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Black_and_white_Playstation_5_base_edition_with_controller.png/960px-Black_and_white_Playstation_5_base_edition_with_controller.png'),
  (10, 'Xbox Series X', 'console', 'Xbox', 'Mint', 33199, 41499, 4.9, '🟩', 'from-green-600/40 to-emerald-500/30', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Xbox_Series_X_2.jpg/960px-Xbox_Series_X_2.jpg'),
  (11, 'Nintendo Switch OLED', 'console', 'Nintendo', 'Good', 24069, 29049, 4.7, '🕹️', 'from-red-500/40 to-rose-400/30', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Nintendo_Switch_%E2%80%93_OLED-Modell%2C_Konsole_und_Dock_20230506.png/960px-Nintendo_Switch_%E2%80%93_OLED-Modell%2C_Konsole_und_Dock_20230506.png'),
  (12, 'PlayStation 4 Slim', 'console', 'PlayStation', 'Fair', 12449, 24899, 4.2, '🎮', 'from-slate-500/40 to-blue-400/30', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/PS4-Console-wDS4.jpg/960px-PS4-Console-wDS4.jpg'),
  (13, 'Xbox Series S', 'console', 'Xbox', 'Good', 18259, 24899, 4.6, '⬜', 'from-neutral-400/40 to-emerald-400/30', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Xbox_Series_S_with_controller.jpg/960px-Xbox_Series_S_with_controller.jpg'),
  (14, 'Red Dead Redemption 2', 'game', 'PlayStation', 'Good', 2323, 4979, 4.9, '🤠', 'from-orange-600/30 to-red-500/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900.jpg'),
  (15, 'The Witcher 3: Wild Hunt', 'game', 'PC', 'Good', 1494, 2074, 4.9, '🐺', 'from-red-600/30 to-amber-500/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/292030/library_600x900.jpg'),
  (16, 'Grand Theft Auto V', 'game', 'PlayStation', 'Good', 2074, 2904, 4.7, '🚔', 'from-lime-500/30 to-emerald-400/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900.jpg'),
  (17, 'Hogwarts Legacy', 'game', 'PlayStation', 'Mint', 2904, 4149, 4.6, '🧙', 'from-amber-500/30 to-yellow-400/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/990080/library_600x900.jpg'),
  (18, 'Sekiro: Shadows Die Twice', 'game', 'PC', 'Good', 2489, 4979, 4.8, '🥷', 'from-rose-600/30 to-slate-500/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/814380/library_600x900.jpg'),
  (19, 'Hades', 'game', 'PC', 'Mint', 999, 1929, 4.9, '🔱', 'from-red-500/30 to-orange-500/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1145360/library_600x900.jpg'),
  (20, 'Doom Eternal', 'game', 'Xbox', 'Good', 1659, 3319, 4.7, '👹', 'from-red-700/30 to-orange-600/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/782330/library_600x900.jpg'),
  (21, 'Resident Evil 4', 'game', 'PlayStation', 'Mint', 3319, 4979, 4.9, '🧟', 'from-neutral-600/30 to-red-600/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/2050650/library_600x900.jpg'),
  (22, 'Marvel’s Spider-Man Remastered', 'game', 'PC', 'Good', 2489, 4149, 4.8, '🕷️', 'from-red-600/30 to-blue-600/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1817070/library_600x900.jpg'),
  (23, 'Horizon Zero Dawn', 'game', 'PlayStation', 'Good', 1245, 3319, 4.7, '🏹', 'from-orange-500/30 to-teal-400/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1151640/library_600x900.jpg'),
  (24, 'Death Stranding', 'game', 'PC', 'Good', 1659, 3319, 4.5, '📦', 'from-slate-500/30 to-amber-400/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1190460/library_600x900.jpg'),
  (25, 'Monster Hunter: World', 'game', 'PC', 'Good', 1494, 2489, 4.7, '🐲', 'from-emerald-600/30 to-lime-500/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/582010/library_600x900.jpg'),
  (26, 'Control', 'game', 'Xbox', 'Fair', 1245, 2489, 4.5, '🌀', 'from-red-500/30 to-slate-600/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/870780/library_600x900.jpg'),
  (27, 'Hollow Knight', 'game', 'PC', 'Mint', 799, 1229, 4.9, '🐛', 'from-slate-600/30 to-cyan-500/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/367520/library_600x900.jpg'),
  (28, 'Celeste', 'game', 'PC', 'Mint', 749, 1659, 4.8, '🏔️', 'from-indigo-500/30 to-pink-400/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/504230/library_600x900.jpg'),
  (29, 'Cuphead', 'game', 'Xbox', 'Good', 1245, 1659, 4.8, '☕', 'from-amber-500/30 to-red-500/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/268910/library_600x900.jpg'),
  (30, 'The Last of Us Part I', 'game', 'PlayStation', 'Mint', 3734, 4979, 4.8, '🍄', 'from-emerald-700/30 to-amber-500/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1888930/library_600x900.jpg'),
  (31, 'Starfield', 'game', 'Xbox', 'Good', 3319, 5809, 4.2, '🚀', 'from-indigo-600/30 to-slate-500/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1716740/library_600x900.jpg'),
  (32, 'Lies of P', 'game', 'PC', 'Mint', 2904, 4979, 4.7, '🎭', 'from-slate-700/30 to-rose-500/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1627720/library_600x900.jpg'),
  (33, 'Street Fighter 6', 'game', 'PlayStation', 'Good', 2904, 4979, 4.7, '🥋', 'from-yellow-500/30 to-blue-500/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/1364780/library_600x900.jpg'),
  (34, 'Devil May Cry 5', 'game', 'Xbox', 'Good', 1659, 2904, 4.7, '😈', 'from-red-600/30 to-purple-600/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/601150/library_600x900.jpg'),
  (35, 'Stardew Valley', 'game', 'PC', 'Mint', 599, 1229, 4.9, '🌾', 'from-green-500/30 to-amber-400/30', 'https://cdn.cloudflare.steamstatic.com/steam/apps/413150/library_600x900.jpg'),
  (36, 'Super Mario Odyssey', 'game', 'Nintendo', 'Good', 2904, 4149, 4.9, '🎩', 'from-red-500/30 to-yellow-400/30', 'https://upload.wikimedia.org/wikipedia/en/8/8d/Super_Mario_Odyssey.jpg'),
  (37, 'Animal Crossing: New Horizons', 'game', 'Nintendo', 'Mint', 3319, 4149, 4.8, '🍃', 'from-teal-400/30 to-lime-400/30', 'https://upload.wikimedia.org/wikipedia/en/1/1f/Animal_Crossing_New_Horizons.jpg'),
  (38, 'Super Smash Bros. Ultimate', 'game', 'Nintendo', 'Good', 3319, 4979, 4.9, '💥', 'from-orange-500/30 to-red-600/30', 'https://upload.wikimedia.org/wikipedia/en/5/50/Super_Smash_Bros._Ultimate.jpg'),
  (39, 'Splatoon 3', 'game', 'Nintendo', 'Good', 3319, 4979, 4.6, '🦑', 'from-fuchsia-500/30 to-cyan-400/30', 'https://upload.wikimedia.org/wikipedia/en/4/4f/Splatoon.3.jpg'),
  (40, 'Nintendo Switch', 'console', 'Nintendo', 'Good', 18259, 24899, 4.7, '🔴', 'from-red-500/40 to-blue-500/30', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Nintendo-Switch-Console-Docked-wJoyConRB.jpg/960px-Nintendo-Switch-Console-Docked-wJoyConRB.jpg'),
  (41, 'Nintendo Switch Lite', 'console', 'Nintendo', 'Good', 13279, 16599, 4.5, '💛', 'from-yellow-400/40 to-neutral-500/30', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Nintendo_Switch_Lite_Grey_-_01.jpg/960px-Nintendo_Switch_Lite_Grey_-_01.jpg'),
  (42, 'Xbox One X', 'console', 'Xbox', 'Good', 16599, 33199, 4.6, '🎮', 'from-neutral-700/40 to-green-500/30', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Microsoft-Xbox-One-X-Console-01.jpg/960px-Microsoft-Xbox-One-X-Console-01.jpg'),
  (43, 'PlayStation 3 Super Slim', 'console', 'PlayStation', 'Fair', 9959, 20749, 4.3, '🎮', 'from-slate-700/40 to-blue-500/30', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Sony-PlayStation-PS3-SuperSlim-Console-FL.jpg/960px-Sony-PlayStation-PS3-SuperSlim-Console-FL.jpg'),
  (44, 'Steam Deck', 'console', 'PC', 'Mint', 33199, 41499, 4.8, '🎒', 'from-blue-600/40 to-slate-500/30', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Steam_Deck_%28front%29.png/960px-Steam_Deck_%28front%29.png')
ON CONFLICT (id) DO UPDATE SET
  title          = EXCLUDED.title,
  type           = EXCLUDED.type,
  platform       = EXCLUDED.platform,
  "condition"    = EXCLUDED."condition",
  price          = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  rating         = EXCLUDED.rating,
  emoji          = EXCLUDED.emoji,
  accent         = EXCLUDED.accent,
  image_url      = EXCLUDED.image_url;
