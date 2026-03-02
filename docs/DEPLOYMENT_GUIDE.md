# Netlify Deployment Guide

Complete step-by-step guide to deploy your Juic'E Drinks website to Netlify.

## 📋 Pre-Deployment Checklist

Before deploying, ensure you have:
- ✅ All files saved
- ✅ Environment variables set in Netlify Dashboard (already done ✅)
- ✅ `netlify.toml` configured (already done ✅)
- ✅ `netlify/functions/create-checkout-session.js` created (already done ✅)
- ✅ `package.json` with Stripe dependency (already done ✅)

## 🚀 Deployment Methods

### Method 1: Git-Based Deployment (Recommended) ⭐

This is the best method for ongoing updates and automatic deployments.

#### Step 1: Initialize Git (if not already done)

```bash
# Navigate to your project directory
cd "/Users/ehuetongwe/Juic'E Drinks website 2"

# Initialize Git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Juic'E Drinks website with Stripe integration"
```

#### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `juice-drinks-website`)
3. **Don't** initialize with README (you already have files)
4. Click "Create repository"

#### Step 3: Connect to GitHub

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/juice-drinks-website.git

# Push your code
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

#### Step 4: Connect to Netlify

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"Deploy with GitHub"**
4. Authorize Netlify to access your GitHub
5. Select your repository (`juice-drinks-website`)
6. Netlify will auto-detect settings:
   - **Build command**: Leave empty (static site)
   - **Publish directory**: `.` (root directory)
7. Click **"Deploy site"**

#### Step 5: Verify Environment Variables

1. After deployment starts, go to **Site settings** → **Environment variables**
2. Verify your variables are there:
   - `STRIPE_SECRET_KEY` ✅
   - `STRIPE_PUBLISHABLE_KEY` ✅
   - `STRIPE_WEBHOOK_SECRET` ✅

#### Step 6: Wait for Deployment

- Netlify will automatically:
  - Install dependencies (`npm install`)
  - Build your site
  - Deploy your functions
- This takes 1-3 minutes
- You'll see a success message when done

#### Step 7: Get Your Site URL

- Your site URL will be: `https://your-site-name.netlify.app`
- You can customize it in **Site settings** → **Domain management**

---

### Method 2: Netlify CLI (For Quick Deployments)

Good for quick deployments without Git.

#### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### Step 2: Login to Netlify

```bash
netlify login
```

This will open your browser to authorize.

#### Step 3: Initialize Site

```bash
cd "/Users/ehuetongwe/Juic'E Drinks website 2"
netlify init
```

Follow the prompts:
- **Create & configure a new site** (or link to existing)
- **Team**: Select your team
- **Site name**: Enter a name (or leave blank for auto-generated)
- **Build command**: Press Enter (leave empty for static site)
- **Directory to deploy**: Press Enter (uses current directory `.`)

#### Step 4: Deploy

```bash
# Deploy to production
netlify deploy --prod

# Or deploy to a draft URL first (for testing)
netlify deploy
```

#### Step 5: Verify

- Your site URL will be shown in the terminal
- Visit the URL to test

---

### Method 3: Drag & Drop (Simplest, One-Time)

Easiest for a quick first deployment.

#### Step 1: Prepare Files

Make sure all your files are in the project folder.

#### Step 2: Zip Your Project (Optional but Recommended)

1. Right-click your project folder
2. Select "Compress" (Mac) or "Send to → Compressed folder" (Windows)
3. This creates a `.zip` file

#### Step 3: Deploy to Netlify

1. Go to https://app.netlify.com
2. Drag and drop your project folder (or zip file) onto the Netlify dashboard
3. Netlify will automatically:
   - Detect your `netlify.toml` configuration
   - Install dependencies
   - Deploy your functions
   - Deploy your site

#### Step 4: Get Your URL

- Your site URL appears after deployment completes
- Usually: `https://random-name-123456.netlify.app`

**Note**: With drag & drop, you'll need to redeploy manually for updates. Consider using Git for automatic deployments.

---

## 🔍 Post-Deployment Verification

After deployment, verify everything works:

### 1. Check Function Deployment

1. Go to Netlify Dashboard → **Functions**
2. You should see `create-checkout-session`
3. Click on it to view logs

### 2. Test Your Site

1. Visit your Netlify URL
2. Add items to cart
3. Click "Proceed to Checkout"
4. Fill out shipping information
5. Click "Proceed to Secure Checkout"
6. You should be redirected to Stripe's checkout page

### 3. Test Payment

On Stripe's checkout page:
- Use test card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

### 4. Check Function Logs

1. Go to Netlify Dashboard → **Functions** → `create-checkout-session`
2. Click **"Logs"** tab
3. Look for any errors

### 5. Verify Environment Variables

1. Go to **Site settings** → **Environment variables**
2. Confirm all variables are present:
   - `STRIPE_SECRET_KEY` ✅
   - `STRIPE_PUBLISHABLE_KEY` ✅
   - `STRIPE_WEBHOOK_SECRET` ✅

---

## 🐛 Troubleshooting

### Issue: Function Not Found (404)

**Solution:**
- Check that `netlify/functions/create-checkout-session.js` exists
- Verify `netlify.toml` has the redirect rule
- Redeploy your site

### Issue: "Module not found: stripe"

**Solution:**
- Make sure `package.json` includes `"stripe": "^14.0.0"`
- Netlify should auto-install, but you can check build logs

### Issue: Environment Variable Not Found

**Solution:**
- Go to Netlify Dashboard → **Site settings** → **Environment variables**
- Verify variables are set
- Make sure they're set for the correct deploy context
- Redeploy after adding variables

### Issue: CORS Errors

**Solution:**
- The `netlify.toml` redirect should handle this
- If issues persist, check browser console for specific errors

### Issue: Build Fails

**Solution:**
1. Check build logs in Netlify Dashboard
2. Common issues:
   - Missing `package.json`
   - Syntax errors in functions
   - Missing dependencies

---

## 🔄 Updating Your Site

### With Git (Recommended):

```bash
# Make your changes
# Then:
git add .
git commit -m "Description of changes"
git push
```

Netlify will automatically redeploy! ✅

### Without Git:

- Use Netlify CLI: `netlify deploy --prod`
- Or drag & drop again

---

## 📝 Quick Reference

### Your Site Structure:
```
/
├── index.html          (Main page)
├── script.js          (Frontend with Stripe)
├── styles.css         (Styling)
├── netlify.toml       (Netlify config)
├── package.json       (Dependencies)
└── netlify/
    └── functions/
        └── create-checkout-session.js  (Backend function)
```

### Environment Variables (Already Set):
- `STRIPE_SECRET_KEY` = `sk_test_...`
- `STRIPE_PUBLISHABLE_KEY` = `pk_test_...`
- `STRIPE_WEBHOOK_SECRET` = `whsec_...`

### Test Card:
- Number: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

---

## ✅ You're Ready!

Choose the deployment method that works best for you. **Git-based deployment is recommended** for automatic updates, but drag & drop is fine for a quick first deployment.

Good luck! 🚀

