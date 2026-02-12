# AmatBookshelf Frontend (Gather App)

Read. Reflect. Belong.

This is the Next.js frontend for the AmatBookshelf MVP, designed with a premium, organic "paper and forest" aesthetic for an intimate book club experience.

## ✨ Features

### 👤 Member Experience
- **Google OAuth Login**: Secure authentication via Google.
- **Dev Token Fallback**: Quick login for developers using JWT tokens.
- **Member Dashboard**: View total points and upcoming session details.
- **QR Attendance**: Scan manager-generated QR codes to record attendance.
- **Points Ledger**: Detailed history of points earned and transactions.
- **Organic Design**: Smooth animations, paper textures, and tactile UI elements.

### 🔑 Manager Experience
- **Role-Based Access**: Restricted access for Admins and Moderators.
- **Session Planning**: CRUD operations for reading, coordination, and extraordinary sessions.
- **Live Session Control**: Real-time attendance tracking and scan logs.
- **Secure QR Display**: Rotating tokens refreshed every 30 seconds to prevent fraud.
- **Manual Attendance**: Toggle attendance status for members manually.

## 🛠 Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI)
- **State Management**: Zustand (Auth persistence)
- **Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide React
- **Notifications**: Sonner
- **QR Engine**: @zxing/browser (Scanner) & qrcode (Generator)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Backend API running (see `AmatBookshelf_bk`)

### Installation
1. Clone the repository.
2. Navigate to the frontend directory: `cd AmatBookshelf_ft`
3. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_DEV_LOGIN=1 # Set to 0 in production
```

### Development
Run the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.

## 🎨 Design Principles
- **Aesthetic**: Cream (#F9F7F2), Forest (#1A3C34), and Sage (#4A6C4C) tones.
- **Typography**: Playfair Display for headings, Inter for body.
- **Tactile**: Rounded corners (2xl/3xl), soft shadows, and subtle micro-animations.
- **Mobile-First**: Primary actions positioned for easy thumb access.

## ⚖️ License
Private Project - All rights reserved.
