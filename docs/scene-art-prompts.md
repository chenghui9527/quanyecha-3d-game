# 场景素材最终提示词

生成方式：内置 imagegen；各素材独立生成，均要求透明背景。首批六类之后追加神社门（鸟居）。原始生成结果保留在工具默认目录，项目使用的副本位于 `assets/scenery/`。

## shrine-torii.png（2026-10-24 追加）

```text
Use case: stylized-concept.
Asset type: production transparent environment sprite for an existing finely detailed pixel-art 2D side-scrolling Inuyasha-inspired action game, rural Japanese forest, Sengoku-era atmosphere.
Primary request: ONE traditional Japanese Shinto shrine entrance TORII gate. Exactly two massive muted vermilion wooden pillars on modest square weathered grey stone footings, a broad gracefully upswept upper crossbeam capped in charcoal-dark weathered wood, and a narrower second horizontal tie beam. Clearly recognizable torii silhouette, sturdy and elegant, wider than it is tall. A golden straw shimenawa rope hangs in a shallow curve below the tie beam, with three small white zigzag paper shide. A small blank dark wood central plaque is acceptable, but absolutely no lettering.
Style/medium: rich handcrafted fine pixel art matching a classic detailed 32-bit forest action game: crisp square pixel clusters, textured woodgrain, chipped muted red paint revealing warm brown timber, restrained moss at the stone bases, cool deep outlines, subtle warm upper-left highlights. NOT smooth painting or photorealism.
Composition: orthographic straight-on front elevation, compatible with flat side-view game assets; symmetric structural proportions with natural irregular weathering. Entire gate and both bases fully visible and contained, with comfortable transparent padding on every side. Gate width about 1.25 times its height; two feet share an identical horizontal baseline. Pillars and crossbeams must be continuous sturdy pieces.
Transparency: TRUE transparent alpha background, including the ENTIRE LARGE OPEN PASSAGE BETWEEN THE PILLARS, behind the rope and paper. All negative spaces are clear alpha. No door leaves, no wall or solid backdrop inside the opening, no interior scene, no forest, sky, floor, ground patch, cast shadow outside the sprite, haze or glow.
Scale: intended in-game height roughly 260 pixels, with the open passage much taller than an 88-pixel game character, so fine texture must reduce cleanly. Isolated single gate only. No people, animals, props, UI, text, grid, labels, watermark or border.
```


## forest-tree.png

```text
Use case: stylized-concept.
Asset type: production transparent environment sprite for a 2D side-scrolling Inuyasha-inspired action game set in a rural Japanese forest.
Style: exceptionally crafted fine pixel art, crisp square pixel clusters, classic detailed 32-bit game environment art, restrained teal-jade foliage, warm muted brown wood, moss green highlights, cool dark outlines. Light comes from the upper left. Orthographic straight-on side-view camera, designed to sit behind a 3.5-head-tall anime game character. No isometric view, no smooth painting, no blur, no photographic textures. Entire isolated object visible, generous transparent padding. True transparent alpha background. No text, labels, grid, border, watermark, UI, characters, monsters or scenery backdrop.
Primary request: one magnificent ordinary mature Japanese broadleaf forest tree, with a full irregular spreading leafy crown and a substantial twisting trunk. Dense dark teal and jade green leaf clusters, small restrained golden green leaf highlights, gnarled branching limbs, deeply furrowed bark, a few vines and moss-covered spreading roots. The complete tree occupies most of a square canvas, from the highest leaf to the lowest root, with empty transparent space around the silhouette. Its natural root contact lies on one horizontal baseline. Not a sacred tree: no rope, paper streamers or shrine objects. Rich organic silhouette and readable trunk, not a round cartoon lollipop.
```

## sacred-tree.png

```text
Use case: stylized-concept.
Asset type: production transparent environment sprite for a 2D side-scrolling Inuyasha-inspired action game set in a rural Japanese forest.
Style: exceptionally crafted fine pixel art, crisp square pixel clusters, classic detailed 32-bit game environment art, restrained teal-jade foliage, warm muted brown wood, moss green highlights, cool dark outlines. Light comes from the upper left. Orthographic straight-on side-view camera, designed to sit behind a 3.5-head-tall anime game character. No isometric view, no smooth painting, no blur, no photographic textures. Entire isolated object visible, generous transparent padding. True transparent alpha background. No text, labels, grid, border, watermark, UI, characters, monsters or scenery backdrop.
Primary request: one immense ancient sacred tree (Goshinboku), the distinctive central forest landmark. Very thick weathered trunk, dramatic buttress roots, broad crown of clustered dark jade leaves and substantial outstretched branches. A thick golden straw shimenawa rope circles the lower half of the trunk with three clearly readable white zigzag paper shide hanging from it. Leave a readable patch of exposed bark immediately below the rope for the sealed character to be drawn separately at runtime. Deep bark grooves, pockets of moss, asymmetric roots. Complete crown and all roots fit within a square transparent canvas with breathing room. Tree alone, no character, arrow or added ground island.
```

## village-house.png

```text
Use case: stylized-concept.
Asset type: production transparent environment sprite for a 2D side-scrolling Inuyasha-inspired action game set in a rural Japanese forest.
Style: exceptionally crafted fine pixel art, crisp square pixel clusters, classic detailed 32-bit game environment art, restrained teal-jade foliage, warm muted brown wood, moss green highlights, cool dark outlines. Light comes from the upper left. Orthographic straight-on side-view camera, designed to sit behind a 3.5-head-tall anime game character. No isometric view, no smooth painting, no blur, no photographic textures. Entire isolated object visible, generous transparent padding. True transparent alpha background. No text, labels, grid, border, watermark, UI, characters, monsters or scenery backdrop.
Primary request: one traditional modest rural Japanese thatched-roof cottage, viewed exactly straight-on at its front elevation, for a village in the Sengoku era. Broad thick layered straw roof with slightly ragged eaves and dark wooden ridge, weathered timber posts, warm clay plaster wall panels, one small wooden lattice window on each side, and one CENTRAL empty dark rectangular doorway with wooden door frame. Doorway is an unbroken dark brown rectangle, straight-on, centered exactly on the house centerline, 16 percent of the whole house width and 30 percent of whole house height. NO door leaf: a separate game sprite will cover this doorway. Ground-level entrance with a low stone doorstep. Fine woodgrain, roof straw clusters and a little moss along the stone footing. All roof edges and foundation contained in a wide landscape transparent image, building fills most of the canvas. No veranda extending toward viewer, no side wall perspective, no extra props.
```

## wooden-door.png

```text
Use case: stylized-concept.
Asset type: production transparent environment sprite for a 2D side-scrolling Inuyasha-inspired action game set in a rural Japanese forest.
Style: exceptionally crafted fine pixel art, crisp square pixel clusters, classic detailed 32-bit game environment art, restrained teal-jade foliage, warm muted brown wood, moss green highlights, cool dark outlines. Light comes from the upper left. Orthographic straight-on side-view camera, designed to sit behind a 3.5-head-tall anime game character. No isometric view, no smooth painting, no blur, no photographic textures. Entire isolated object visible, generous transparent padding. True transparent alpha background. No text, labels, grid, border, watermark, UI, characters, monsters or scenery backdrop.
Asset type: exactly two equal-width cells in ONE ROW, a 2-column by 1-row transparent sprite sheet, same object in two states. Each cell has generous transparent padding and identical centered door-frame bounding box, same baseline and pixel scale. No grid lines.
Primary request: a simple straight-on rectangular weathered vertical-plank wooden cottage door in a modest Japanese village. Dark brown wooden frame, warm worn planks, two horizontal reinforcing battens, a small simple iron handle. Frame width to height ratio about 0.58.
LEFT CELL: fully closed wooden door inside the frame.
RIGHT CELL: same frame with the door opened inward against the LEFT jamb, showing a narrow dark angled panel along the left side and an otherwise empty deep dark brown doorway. Preserve the frame shape and size exactly. No surrounding walls or roof, no ground, no stone doorstep. Both states complete, aligned and fully contained in their own cells. Consistent fine pixel art; easily read when reduced to about 62 by 106 game pixels.
```

## bone-eaters-well.png

```text
Use case: stylized-concept.
Asset type: production transparent environment sprite for a 2D side-scrolling Inuyasha-inspired action game set in a rural Japanese forest.
Style: exceptionally crafted fine pixel art, crisp square pixel clusters, classic detailed 32-bit game environment art, restrained teal-jade foliage, warm muted brown wood, moss green highlights, cool dark outlines. Light comes from the upper left. Orthographic straight-on side-view camera, designed to sit behind a 3.5-head-tall anime game character. No isometric view, no smooth painting, no blur, no photographic textures. Entire isolated object visible, generous transparent padding. True transparent alpha background. No text, labels, grid, border, watermark, UI, characters, monsters or scenery backdrop.
Primary request: one ancient Japanese Bone-Eater's Well, a LOW SQUARE WOODEN WELL WITHOUT ANY ROOF, posts, pulley or canopy. Heavy aged horizontal timber beams stacked in a square, an unmistakable dark open square mouth seen only slightly from above so the back rim and opening are visible, still compatible with a side-view platform game. Front face of three weathered wooden beams, projecting corner joints, cracked grey-brown woodgrain, a little moss and climbing ivy at the lower corners, and two small worn stones at the feet. Low object, horizontally wide silhouette (roughly twice as wide as tall). Quiet ancient forest relic. Deep well interior almost black, no blue portal or glowing water. Isolated whole object on transparent canvas, no ground patch beyond its footing.
```

## terrain.png

```text
Use case: stylized-concept.
Asset type: production transparent environment sprite for a 2D side-scrolling Inuyasha-inspired action game set in a rural Japanese forest.
Style: exceptionally crafted fine pixel art, crisp square pixel clusters, classic detailed 32-bit game environment art, restrained teal-jade foliage, warm muted brown wood, moss green highlights, cool dark outlines. Light comes from the upper left. Orthographic straight-on side-view camera, designed to sit behind a 3.5-head-tall anime game character. No isometric view, no smooth painting, no blur, no photographic textures. Entire isolated object visible, generous transparent padding. True transparent alpha background. No text, labels, grid, border, watermark, UI, characters, monsters or scenery backdrop.
Asset type: one 3-column by 2-row tileset sprite sheet, SIX rectangular terrain modules, each completely contained in its own equal cell. Transparent separation between all modules, no labels or grid. Identical fine pixel scale and lighting across all six.
Primary request: a modular mossy earth and rocky platform kit for a forest side-scrolling game.
TOP ROW: three thick ground blocks, LEFT EDGE, REPEATING MIDDLE, RIGHT EDGE. Each has a perfectly HORIZONTAL WALKABLE TOP, thin green grass and moss growing above it, a narrow warm earth path directly below it, then dense dark layered brown soil, embedded angular bluish rocks, roots and little earth cracks. The side boundary of the outer left edge and outer right edge is visible with an irregular rock cliff face; middle has straight rectangular edges for tiling.
BOTTOM ROW: three thinner floating rock ledge modules, LEFT EDGE, REPEATING MIDDLE, RIGHT EDGE. Flat continuous moss-covered walkable top, detailed angular charcoal blue-grey stone body beneath, chipped underside and a few tiny hanging roots. Side edges tile together to form longer platforms. No long vines hanging outside each cell. All six block tops at the same relative vertical coordinate in their cells, horizontally rectangular units, no slope and no raised rock on the top. Generous uniform transparent cell gutters.
```

