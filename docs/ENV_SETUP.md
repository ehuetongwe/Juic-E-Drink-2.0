# Environment Variables Setup Guide

## 📁 Files Created

1. **`.env.example`** - Template file (safe to commit to Git)
2. **`.gitignore`** - Ensures `.env` is never committed to Git

## 🔧 How to Create Your .env File

### Step 1: Create the .env File

**Option A: Using Terminal/Command Line**
```bash
# Navigate to your project directory
cd "/Users/ehuetongwe/Juic'E Drinks website 2"

# Copy the example file
cp .env.example .env
```

**Option B: Manually**
1. Copy the `.env.example` file
2. Rename it to `.env` (make sure it starts with a dot)
3. Open it in a text editor

### Step 2: Add Your Stripe Keys

Open `.env` and replace the placeholders with your actual keys:

```env
# Your actual test secret key from Netlify Dashboard
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE

# Your test publishable key (should match script.js)
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE

# Your webhook secret (if using webhooks)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

## ⚠️ Important Security Notes

✅ **DO:**
- Use `.env` for local development
- Keep `.env` in `.gitignore` (already done)
- Use `.env.example` as a template (safe to commit)
- Set environment variables in Netlify Dashboard for production

❌ **DON'T:**
- Never commit `.env` to Git
- Never share your `.env` file
- Never put real keys in `.env.example`

## 🔄 Local Development vs Netlify

### For Local Development:
- Use `.env` file (what you're creating now)
- Install dependencies: `npm install`
- Run local server (if needed)

### For Netlify Production:
- **Already configured!** ✅
- Your keys are set in Netlify Dashboard → Environment Variables
- Netlify automatically uses these when deploying

## 📝 Your Current Keys

Based on your configuration:

**Secret Key (from Netlify):**
```
sk_test_YOUR_TEST_SECRET_KEY_HERE
```

**Publishable Key (from script.js):**
```
pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE
```

## ✅ Verification

After creating `.env`, verify:
1. File exists: `.env` (not `.env.txt` or `env`)
2. File is in `.gitignore` (already done)
3. Keys are correct (test keys start with `sk_test_` and `pk_test_`)

## 🚀 Next Steps

1. Create `.env` file using the steps above
2. Add your actual keys to `.env`
3. For local testing, you may need to load the `.env` file in your code
4. For Netlify, your environment variables are already set! ✅

