# Tournify — Deployment Guide

## Prerequisites
- A [Vercel](https://vercel.com) account (free tier works)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free M0 cluster)
- A GitHub/GitLab account for connecting to Vercel

---

## Step 1: MongoDB Atlas Setup (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas/database) and sign up
2. Create a **free shared cluster** (M0 Sandbox)
   - Choose a cloud provider and region closest to you
3. **Create a Database User**:
   - Go to **Database Access** → **Add New Database User**
   - Create a user with a username and password (note these down)
   - Set permissions to **Read and write to any database**
4. **Whitelist IP Addresses**:
   - Go to **Network Access** → **Add IP Address**
   - Click **Allow Access from Anywhere** (`0.0.0.0/0`) for Vercel compatibility
5. **Get Connection String**:
   - Go to **Database** → **Connect** → **Drivers**
   - Copy the connection string — it looks like:
     ```
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<username>` and `<password>` with your database user credentials
   - Add `/tournify` before the `?` to specify the database name:
     ```
     mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/tournify?retryWrites=true&w=majority
     ```

---

## Step 2: Push Code to Git

Push your `tournify` folder to a GitHub/GitLab repository:

```bash
cd tournify
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

---

## Step 3: Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. **Import** your Git repository
3. Vercel will auto-detect it as a Next.js project
4. **Configure Environment Variables** before deploying:

   | Variable | Value |
   |----------|-------|
   | `MONGODB_URI` | Your MongoDB Atlas connection string from Step 1 |
   | `NEXTAUTH_SECRET` | A random string (generate with `openssl rand -base64 32`) |
   | `NEXTAUTH_URL` | Your Vercel deployment URL (e.g., `https://tournify.vercel.app`) |

5. Click **Deploy**

---

## Step 4: Seed Admin User

After deployment, create the admin user by sending a POST request to the seed endpoint:

```bash
curl -X POST https://your-deployed-url.vercel.app/api/seed
```

This creates:
- **Email:** `admin@tournify.com`
- **Password:** `admin123`

> ⚠️ Change the password in production by updating the database directly.

---

## Step 5: Verify

1. Visit your deployed URL — you should see the public viewer
2. Go to `/admin/login` and sign in with the seeded credentials
3. Create an Event → Add Teams → Add Sports → Register Squads → Generate Tournament

---

## Step 6: Custom Domain (Optional)

1. In Vercel dashboard → **Settings** → **Domains**
2. Add your custom domain
3. Update the `NEXTAUTH_URL` environment variable to match
4. Update DNS records as instructed by Vercel

---

## Local Development

```bash
# Install dependencies
npm install

# Set up .env.local with your MongoDB URI
# (use the same Atlas cluster or a local MongoDB instance)

# Run dev server
npm run dev

# Seed admin user
curl -X POST http://localhost:3000/api/seed
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Cannot connect to MongoDB" | Verify `MONGODB_URI` is correct and IP whitelist includes `0.0.0.0/0` |
| "NEXTAUTH_URL mismatch" | Ensure `NEXTAUTH_URL` matches your actual deployment URL |
| Build fails on Vercel | Check Vercel build logs; ensure all env vars are set |
| Slow initial load | First request after cold start takes longer — this is normal for serverless |
