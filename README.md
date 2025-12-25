# 🕐 Ghanto ka Hisaab

<div align="center">

![Ghanto ka Hisaab](https://img.shields.io/badge/Ghanto%20ka%20Hisaab-Hour%20Tracker-18181b?style=for-the-badge)
[![Next.js](https://img.shields.io/badge/Next.js-16.1.1-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**A modern, minimalist hour tracking Progressive Web App (PWA) built with Next.js 16 and Supabase**

[Live Demo](https://ghantokahisaab.vercel.app) · [Report Bug](https://github.com/usman2789/Ghanto-ka-Hisaab/issues) · [Request Feature](https://github.com/usman2789/Ghanto-ka-Hisaab/issues)

</div>

---

## 📖 About

**Ghanto ka Hisaab**  is a simple yet powerful hour tracking application that helps you monitor and categorize how you spend your time throughout the day. Track your activities hour by hour, view monthly progress, and gain insights into your daily routines.

### ✨ Key Features

- 🔐 **Google OAuth Authentication** - Secure sign-in with Google
- 📅 **Monthly Calendar View** - Visual representation of tracked days
- ⏰ **24-Hour Tracking** - Track every hour of your day
- 🏷️ **Predefined Tags** - Quick categorization (Sleep, Study, Work, Fun, etc.)
- ➕ **Custom Tags** - Create your own activity categories
- 📝 **Optional Details** - Add notes to any hour entry
- 📊 **Progress Indicators** - Color-coded completion status
- 📱 **Progressive Web App** - Install on any device
- 🌐 **Offline Support** - Access your data without internet
- 🎨 **Minimalist Design** - Clean, distraction-free interface
- 📱 **Fully Responsive** - Works on desktop, tablet, and mobile

---

## 🎯 Use Cases

- **Students**: Track study hours, sleep patterns, and leisure time
- **Professionals**: Monitor work hours, breaks, and productivity
- **Freelancers**: Log billable hours and project time
- **Personal Development**: Analyze time allocation and build better habits
- **Health Tracking**: Monitor sleep, exercise, and meal times

---

## 🚀 Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first styling

### Backend & Database
- **[Supabase](https://supabase.com/)** - PostgreSQL database, authentication, and real-time subscriptions
- **Row Level Security (RLS)** - Data isolation per user

### PWA Features
- **[next-pwa](https://github.com/shadowwalker/next-pwa)** - PWA plugin for Next.js
- **Service Worker** - Offline functionality with NetworkFirst strategy
- **Web App Manifest** - Installable app with custom icons
- **Cache API** - Smart caching for fast loading
- **Install Prompt** - Custom UI for app installation
- **Update Management** - Seamless service worker updates
- **Debug Tools** - PWA debugger for development

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/pnpm/yarn/bun
- Supabase account
- Google Cloud Console project (for OAuth)

### 1. Clone the Repository
```bash
git clone https://github.com/usman2789/Ghanto-ka-Hisaab.git
cd Ghanto-ka-Hisaab
```

### 2. Install Dependencies
```bash
npm install

# PWA dependencies are included:
# - next-pwa: PWA plugin for Next.js
# - webpack: Required for PWA compilation
```

### 3. Set Up Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set Up Supabase Database
Run the SQL schema from `supabase-schema.sql` in your Supabase SQL Editor:
```bash
# Navigate to Supabase Dashboard > SQL Editor
# Copy and paste the contents of supabase-schema.sql
# Execute the query
```

### 5. Configure Google OAuth

#### A. Google Cloud Console
1. Create a new project or select existing
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
5. Copy Client ID and Client Secret

#### B. Supabase Dashboard
1. Go to **Authentication** → **Providers**
2. Enable **Google** provider
3. Paste Client ID and Client Secret
4. Save configuration

#### C. Configure Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:3000` (development)
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
# Development mode (PWA disabled for faster development)
npm run dev

# Production build (PWA enabled)
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

**Note**: PWA features are disabled in development mode for faster iteration. To test PWA functionality, build and run in production mode
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 🏗️ Project Structure

```
ghanto-ka-hisaab/
├── app/
│   ├── auth/
│   │   ├── callback/route.ts      # OAuth callback handler
│   │   └── auth-code-error/page.tsx
│   ├── login/page.tsx             # Login page
│   ├── signup/page.tsx            # Signup page (unused - Google only)
│   ├── page.tsx                   # Main tracker page
│   ├── layout.tsx                 # Root layout with PWA meta
│   └── globals.css                # Global styles
├── components/
│   ├── CalendarView.tsx           # Monthly calendar grid
│   ├── HourTracker.tsx            # Hour tracking modal
│   ├── PWAInstallPrompt.tsx       # PWA install notification
│   ├── PWADebugger.tsx            # PWA debug panel (dev only)
│   └── PWALifecycleManager.tsx    # Service worker lifecycle handler
├── utils/
│   └── supabase/
│       ├── client.ts              # Browser Supabase client
│       ├── server.ts              # Server Supabase client
│       └── middleware.ts          # Session management
├── public/Generated service worker
│   ├── workbox-*.js               # Workbox runtime
│   ├── android-chrome-192x192.png # App icon (192x192)
│   ├── android-chrome-512x512.png # App icon (512x512)
│   └── apple-touch-icon.png       # iOS app icon
├── proxy.ts                       # Next.js 16 proxy (replaces middleware)
├── next.config.js                 # Next.js config with PWA setup
├── PWA_DOCUMENTATION.md           # Complete PWA technical docs
├── PWA_SIMPLE_GUIDE.md            # PWA explained simply
│   └── icon-512.png               # App icon (512x512)
├── proxy.ts                       # Next.js 16 proxy (replaces middleware)
├── supabase-schema.sql            # Database schema
└── .env.local                     # Environment variables (gitignored)
```

---

## 🎨 Features in Detail

### Calendar View
- Displays all days of the current month
- Color-coded progress:
  - **White**: No entries
  - **Red**: 1-7 hours tracked
  - **Yellow**: 8-15 hours tracked
  - **Green**: 16-24 hours tracked
- Shows hour count on each day
- Click any date to track hours

### Hour Tracking Modal
- 24 vertical hour slots (00:00 - 23:00)
- Each slot shows existing tags
- **Smart Install Prompt**: Custom UI appears after engagement criteria met
- **Offline Support**: Full functionality without internet using NetworkFirst caching
- **Home Screen Installation**: Add to home screen on iOS and Android
- **Standalone Experience**: Opens like a native app (no browser UI)
- **Fast Loading**: Service worker caches resources for instant loading
- **Auto-Updates**: Seamless service worker updates with user prompts
- **Debug Panel**: Development-only panel to monitor PWA status
- **Cross-Device Sync**: Works across all your devices via Supabase

### How PWA Works
```
First Visit:
  → Download app and cache resources
  → Register service worker
  → Save to cache storage

Next Visits:
  → Load from cache (instant! ⚡)
  → Check for updates in background
  → Sync with server when online

Offline:
  → Service worker serves cached version
  → Full app functionality maintained
  → Data syncs when connection restored
```

For detailed PWA documentation, see:
- **[PWA_DOCUMENTATION.md](PWA_DOCUMENTATION.md)** - Complete technical guide
- **[PWA_SIMPLE_GUIDE.md](PWA_SIMPLE_GUIDE.md)** - Easy-to-understand explanation

### PWA Features
- Install prompt appears after login
- Works offline with cached data
- Home screen icon
- Standalone app experience
- Fast loading with service worker

---

## 🚢 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/usman2789/Ghanto-ka-Hisaab)

#### Manual Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add environment variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Update Supabase Settings**
   - Add production URL to redirect URLs
   - Update site URL

4. **Update Google OAuth**
   - Add production domain to authorized origins

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### ✅ Completed
- [x] Progressive Web App (PWA) implementation
- [x] Offline support with service workers
- [x] Install prompt with custom UI
- [x] Service worker lifecycle management
- [x] PWA debugging tools
- [x] Comprehensive PWA documentation

### 🚧 In Progress
- [ ] Export data to CSV/JSON
- [ ] Weekly/Monthly analytics dashboard

### 📅 Planned
- [ ] Dark mode support
- [ ] Multiple language support
- [ ] Recurring task templates
- [ ] Time goal setting
- [ ] Data visualization charts
- [ ] Push notifications for reminders
- [ ] Background sync for offline edits
- Use Tailwind CSS for styling
- Write meaningful commit messages
- Test on multiple devices
- Update documentation

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing framework
- **Supabase Team** - For the backend platform
- **Vercel** - For hosting
- **Tailwind CSS** - For the styling system
- **Community** - For feedback and contributions

---

## 📧 Contact

Project Link: [https://github.com/usman2789/Ghanto-ka-Hisaab](https://github.com/usman2789/Ghanto-ka-Hisaab)

Live Demo: [https://ghantokahisaab.vercel.app](https://ghantokahisaab.vercel.app)

---

## 🗺️ Roadmap

- [ ] Export data to CSV/JSON
- [ ] Weekly/Monthly analytics dashboard
- [ ] Dark mode support
- [ ] Multiple language support
- [ ] Recurring task templates
- [ ] Time goal setting
- [ ] Data visualization charts
- [ ] Mobile native apps (React Native)
- [ ] Team/Family sharing features
- [ ] API for third-party integrations

---

<div align="center">

Made with ❤️ and ⏰

**Star ⭐ this repository if you find it helpful!**

</div>
