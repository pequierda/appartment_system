# Apartment Rental System

A modern, responsive apartment rental management system built with HTML, JavaScript, and Upstash for storage. Deployable on Vercel.

## Features

- 🏠 **Apartment Management**: Add, view, edit, and delete apartments
- 🔍 **Search & Filter**: Search by location/name and filter by price and bedrooms
- 📱 **Responsive Design**: Fully responsive for mobile, tablet, and desktop
- 💾 **Upstash Storage**: Uses Upstash Redis for data persistence
- ⚡ **Fast Performance**: Serverless functions on Vercel

## Tech Stack

- **Frontend**: HTML, JavaScript, Tailwind CSS, Flowbite
- **Backend**: Vercel Serverless Functions
- **Storage**: Upstash Redis
- **Hosting**: Vercel

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd appartment_system
```

### 2. Configure Upstash

1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Copy your REST URL and REST Token

### 3. Configure Vercel Environment Variables

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add the following variables:
   - `UPSTASH_REDIS_REST_URL` - Your Upstash REST URL
   - `UPSTASH_REDIS_REST_TOKEN` - Your Upstash REST Token

### 4. Deploy to Vercel

#### Option A: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel
```

#### Option B: Deploy via GitHub

1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will automatically detect and deploy

### 5. Access Your Application

After deployment, Vercel will provide you with a URL. Your application will be live!

## Project Structure

```
appartment_system/
├── api/
│   └── apartments/
│       ├── index.js          # GET all, POST new apartment
│       └── [id].js           # GET, PUT, DELETE by ID
├── js/
│   ├── api.js                # API client
│   └── app.js                # Main application logic
├── index.html                # Main HTML file
├── vercel.json               # Vercel configuration
└── README.md                 # This file
```

## Usage

1. **Add Apartment**: Click "Add Apartment" button and fill in the form
2. **View Details**: Click "View Details" on any apartment card
3. **Edit**: Click the edit icon or edit button in the details view
4. **Delete**: Click the delete icon or delete button in the details view
5. **Search**: Use the search bar to find apartments by name or location
6. **Filter**: Use the price and bedroom filters to narrow down results

## Environment Variables

Make sure to set these in your Vercel project:

- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST API URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST API Token

## License

MIT

