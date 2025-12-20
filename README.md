# Factory Management Platform - Frontend

Modern, responsive React application for managing factory production, materials, and expenses with real-time updates and beautiful UI.

## 🚀 Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **UI Components**: Custom components with shadcn/ui patterns
- **Icons**: Lucide React
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn
- Backend API running (see backend README)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anesszereg/Factory-Management-Platform.git
   cd Factory-Management-Platform/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment (optional)**
   
   For local development, the app uses the Vite proxy (no .env needed).
   
   For production deployment:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   VITE_API_URL=https://your-backend-url.com
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The app will be running at `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   └── Textarea.tsx
│   │   └── Layout.tsx       # Main layout wrapper
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Overview & statistics
│   │   ├── Production.tsx   # Production management
│   │   ├── Materials.tsx    # Material inventory
│   │   ├── Expenses.tsx     # Expense tracking
│   │   └── Models.tsx       # Furniture models
│   ├── services/            # API integration
│   │   └── api.ts          # Axios API clients
│   ├── types/               # TypeScript definitions
│   │   └── index.ts        # Shared types
│   ├── lib/                 # Utilities
│   │   └── utils.ts        # Helper functions
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                  # Static assets
├── .env.example            # Environment template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # TailwindCSS config
├── tsconfig.json           # TypeScript config
└── package.json
```

## 🎨 Features

### 📊 Dashboard
- Real-time production statistics
- Material stock alerts
- Expense summaries
- Visual analytics with charts
- Date range filtering

### 🏭 Production Management
- Create and track production orders
- Visual workflow for 5 production steps:
  1. **Cutting** - Material preparation
  2. **Montage** - Assembly
  3. **Finition** - Finishing
  4. **Paint** - Coating/painting
  5. **Packaging** - Final packaging
- Track quantities (entered, completed, lost)
- Progress tracking per order
- Edit/delete production records

### 📦 Materials Management
- Material inventory tracking
- Record purchases with supplier info
- Track material consumption
- Automatic stock calculations
- Low stock alerts
- Cost analysis (purchase vs consumption)
- Date range filtering
- Edit/delete material records

### 💰 Expenses Tracking
- Daily expense recording
- Categories:
  - Electricity
  - Water
  - Transport
  - Salaries
  - Maintenance
  - Other
- Payment method tracking
- Category-wise breakdown
- Date range filtering
- Visual expense analytics
- Edit/delete expenses

### 🪑 Furniture Models
- Create furniture product models
- Manage product catalog
- Link to production orders

### 🔔 Toast Notifications
- Success confirmations
- Error messages
- Loading states
- Auto-dismiss notifications

## 🎯 Available Scripts

```bash
# Development
npm run dev              # Start development server (port 3000)

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
```

## 🔌 API Integration

The frontend communicates with the backend API through Axios clients defined in `src/services/api.ts`.

### Local Development
Uses Vite proxy configuration to forward `/api/*` requests to `http://localhost:8000`

### Production
Set `VITE_API_URL` environment variable to your backend URL

### API Clients Available
- `furnitureModelsApi`
- `productionOrdersApi`
- `dailyProductionApi`
- `rawMaterialsApi`
- `materialPurchasesApi`
- `materialConsumptionApi`
- `dailyExpensesApi`
- `dashboardApi`

## 🎨 UI Components

### Base Components
- **Button** - Primary, secondary, outline variants
- **Card** - Container with header/content sections
- **Input** - Text input with label and validation
- **Select** - Dropdown with label
- **Textarea** - Multi-line text input

### Features
- Fully typed with TypeScript
- Accessible (ARIA labels)
- Responsive design
- TailwindCSS styling
- Consistent design system

## 🌍 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | Production only | `/api` (uses proxy) |

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Configure:
     - **Framework**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Add environment variable:
     - `VITE_API_URL`: Your backend URL

3. **Deploy**
   - Click "Deploy"
   - Your app will be live in 2-3 minutes!

### Deploy to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Import from Git
3. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Add environment variable: `VITE_API_URL`
5. Deploy

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
      // ... more colors
    }
  }
}
```

### Currency
The app uses Algerian Dinar (DZD). To change:
Edit `src/lib/utils.ts`:
```typescript
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD', // Change this
  }).format(amount);
};
```

## 📱 Responsive Design

The application is fully responsive and works on:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Large screens (1920px+)

## 🔧 Development Tips

### Hot Module Replacement (HMR)
Vite provides instant HMR - changes appear immediately without full page reload.

### TypeScript
All components are fully typed. Use TypeScript's IntelliSense for better DX.

### API Mocking
For development without backend:
```typescript
// In src/services/api.ts
const mockData = { /* ... */ };
return Promise.resolve({ data: mockData });
```

## 🐛 Troubleshooting

### Port 3000 already in use
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or let Vite use another port automatically
npm run dev
```

### API requests failing
1. Check backend is running on port 8000
2. Verify proxy configuration in `vite.config.ts`
3. Check browser console for CORS errors
4. Ensure `VITE_API_URL` is set correctly (production)

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 🧪 Testing

```bash
# Manual testing checklist
- [ ] Create furniture model
- [ ] Create production order
- [ ] Record daily production
- [ ] Add material purchase
- [ ] Record material consumption
- [ ] Add daily expense
- [ ] Check dashboard statistics
- [ ] Test filters and date ranges
- [ ] Test edit/delete operations
- [ ] Verify toast notifications
```

## 🎯 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📊 Performance

- **First Load**: < 2s
- **Bundle Size**: ~500KB (gzipped)
- **Lighthouse Score**: 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a Pull Request

## 📄 License

MIT

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Email: anesszereg1@gmail.com

## 🔗 Related

- [Backend Repository](https://github.com/anesszereg/Factory-Management-Platform-backend)
- [Full Project Repository](https://github.com/anesszereg/Factory-Management-Platform)
- [Deployment Guide](../DEPLOYMENT.md)

## 🎉 Acknowledgments

- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [TailwindCSS](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [React Hot Toast](https://react-hot-toast.com)
