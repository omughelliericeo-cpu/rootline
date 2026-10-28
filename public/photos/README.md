# Site photos

Photos used by the home, sign-up and login pages. To change one, save a new
JPG **with the same file name** (keep roughly the same shape) and reload.

| File | Where it shows | Shape |
|---|---|---|
| `home/hero-produce.jpg` | Home page, next to "Real food has a real journey." | Landscape, about 16:11 (e.g. 1600 × 1100) |
| `auth/side.jpg` | Right side of sign-up and login (large screens) | Tall portrait, about 9:16 (e.g. 900 × 1600) |
| `industries/{id}.jpg` | "What do you make?" cards (sign-up and home) | Landscape 16:9 (e.g. 800 × 450) |

Industry ids: `brewery`, `poultry`, `produce`, `coffee`, `winery`, `cosmetics`, `other` (plus `drinks`, the shared Brewery & winery card). A new
industry template only needs a photo with its id as the file name.

Plain sand-coloured files are placeholders waiting for a real photo.

After replacing a photo, `npm run dev` may keep showing the old one from its image cache: delete `.next/dev/cache/images` (or restart). A production build starts with an empty cache.

`industries/{id}.jpg` is also the story-page banner for producers who have not uploaded a product or brand photo (shown as decoration, with empty alt text, because it is not a photo of that batch).

## Credits

Photos from [Unsplash](https://unsplash.com) (free to use under the
[Unsplash License](https://unsplash.com/license); credit is appreciated, not required).
Each was cropped and resized for Rootline. (`home/hero-produce.jpg` and `industries/poultry.jpg` are the owner's own images, not from Unsplash. `industries/drinks.jpg` is the shared Brewery & winery card and currently reuses the brewery photo.)

| File | Unsplash photo |
|---|---|
| `auth/side.jpg` | https://unsplash.com/photos/photo-1500937386664-56d1dfef3854 |
| `industries/brewery.jpg` | https://unsplash.com/photos/clear-drinking-glass-with-beer-2UsNF4Az-Ko |
| `industries/coffee.jpg` | https://unsplash.com/photos/white-ceramic-mug-on-brown-coffee-beans-UTdA-_U4DQw (Brent Ninaber) |
| `industries/winery.jpg` | https://unsplash.com/photos/photo-1610832958506-aa56368176cf |
| `industries/cosmetics.jpg` | https://unsplash.com/photos/ts3gC_gv47A |
| `industries/other.jpg` | https://unsplash.com/photos/Y_3UR9KTTAg (Josip Ivanković) |
