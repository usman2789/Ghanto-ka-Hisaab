# PWA Setup - Ghanto ka Hisaab

## ✅ What's Done

The basic PWA setup is now complete:

1. **Simplified Service Worker** (`public/sw.js`)
   - Registers and activates properly
   - Skips caching for simplicity
   - Logs installation for debugging

2. **Minimal Manifest** (`public/manifest.json`)
   - Core PWA metadata configured
   - Icons removed to avoid errors
   - Will work once icons are added

3. **Service Worker Registration** (app/page.tsx)
   - Registers on window load
   - Logs success/failure for debugging

## 🔧 To Make it Installable (Optional)

PWA will work without icons, but to make it installable (Add to Home Screen), you need icons:

### Option 1: Quick Icons (Recommended)
Use an online tool to generate PWA icons:
1. Go to https://realfavicongenerator.net/ or https://favicon.io/
2. Upload any logo/image (or create one with text)
3. Download the generated icons
4. Extract and copy these files to `public/`:
   - `icon-192x192.png` (rename to `icon-192.png`)
   - `icon-512x512.png` (rename to `icon-512.png`)

### Option 2: Manual Creation
Create two PNG images:
- `public/icon-192.png` (192x192 pixels)
- `public/icon-512.png` (512x512 pixels)

### Option 3: Use Existing Icons
If you have a logo:
1. Resize to 192x192 and 512x512
2. Save as PNG
3. Place in `public/` folder

Then update `public/manifest.json`:
```json
{
  "name": "Ghanto ka Hisaab",
  "short_name": "Tracker",
  "description": "Track your hours efficiently",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#18181b",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

## 🧪 Testing

1. **Local Development:**
   ```bash
   npm run dev
   ```
   Open Chrome DevTools → Application → Service Workers
   You should see the service worker registered

2. **Production (Vercel):**
   ```bash
   git add .
   git commit -m "PWA setup complete"
   git push
   ```
   
3. **Test Installation:**
   - Open app in Chrome/Edge on mobile or desktop
   - Look for "Install" button in address bar
   - Or Menu → Install Ghanto ka Hisaab

## 🐛 Debugging

Check these if PWA isn't working:

1. **Service Worker Status:**
   - Chrome DevTools → Application → Service Workers
   - Should show "activated and is running"

2. **Manifest:**
   - Chrome DevTools → Application → Manifest
   - Should show no errors

3. **Console Logs:**
   - Should see "SW registered:" message
   - Check for any errors

## 📱 Mobile Testing

To test on mobile during development:

1. **Find your IP:**
   ```bash
   ipconfig
   ```
   Look for IPv4 Address (e.g., 192.168.x.x)

2. **Access on mobile:**
   ```
   http://YOUR_IP:3000
   ```
   (Make sure phone is on same WiFi)

3. **Or use ngrok:**
   ```bash
   npx ngrok http 3000
   ```

## ✨ Current Status

- ✅ Service worker registers
- ✅ Manifest is valid
- ✅ App is PWA-ready
- ⏳ Icons needed for installation prompt
- ✅ Works offline (after first visit)

The app will function perfectly fine without the "Add to Home Screen" feature. Icons are only needed if you want users to install it as a standalone app!
