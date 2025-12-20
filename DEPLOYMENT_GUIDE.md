# Deployment Guide

This guide explains how to deploy the Factory Management System to production.

## Architecture

- **Backend**: Django on PythonAnywhere
- **Frontend**: React on Vercel

## Backend Setup (PythonAnywhere)

### 1. Environment Variables

Set these in your PythonAnywhere console or in a `.env` file:

```bash
# Add your Vercel frontend domain(s) here, comma-separated
CORS_EXTRA_ORIGINS=https://your-app.vercel.app,https://www.yourdomain.com

# Database configuration (if different from local)
# Update settings.py DATABASES section if needed
```

### 2. Update CORS Settings

The `settings.py` file now supports adding production domains via the `CORS_EXTRA_ORIGINS` environment variable. 

**Option 1: Using Environment Variable (Recommended)**
```python
# In PythonAnywhere console:
export CORS_EXTRA_ORIGINS="https://your-app.vercel.app"
```

**Option 2: Direct Edit (If env var doesn't work)**
Edit `backend/factory/factory/settings.py` and add your Vercel domain to `CORS_ALLOWED_ORIGINS`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://your-app.vercel.app",  # Add your Vercel domain here
]
```

### 3. Static Files

Make sure static files are configured correctly in PythonAnywhere:
- Update `STATIC_URL` and `STATIC_ROOT` in `settings.py` if needed
- Run `python manage.py collectstatic` after deployment

### 4. Database

Ensure your production database is properly configured in `settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',  # or 'sqlite3' for PythonAnywhere free tier
        'NAME': 'your_db_name',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'your_db_host',
        'PORT': '3306',
    }
}
```

### 5. API URL Format

Your PythonAnywhere API URL should be:
```
https://yourusername.pythonanywhere.com/api/
```

Make sure:
- The URL ends with `/api/`
- It's accessible via HTTPS
- The `/api/` path is correctly configured in your `urls.py`

## Frontend Setup (Vercel)

### 1. Environment Variables

In Vercel dashboard, go to your project → Settings → Environment Variables and add:

```
VITE_API_URL=https://yourusername.pythonanywhere.com/api
```

**Important Notes:**
- Do NOT include a trailing slash
- Use HTTPS (not HTTP)
- The URL should end with `/api` (not `/api/`)

### 2. Build Settings

Vercel should automatically detect Vite. If not, configure:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Deploy

After setting the environment variable:
1. Push your code to GitHub
2. Vercel will automatically deploy
3. Check the deployment logs for any errors

## Testing Production

### 1. Test API Endpoint

First, verify your backend API is accessible:
```bash
curl https://yourusername.pythonanywhere.com/api/auth/login/
```

You should get a response (even if it's an error, it should be JSON, not HTML).

### 2. Test CORS

Open browser console on your Vercel site and check for CORS errors. If you see:
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

Then add your Vercel domain to `CORS_ALLOWED_ORIGINS` in Django settings.

### 3. Test Login

Try logging in with valid credentials. If you get:
- **"Unexpected token '<'"**: API URL is wrong or returning HTML
- **"404 Not Found"**: API endpoint path is incorrect
- **"500 Internal Server Error"**: Check PythonAnywhere error logs
- **CORS error**: Add your domain to CORS settings

## Common Issues

### Issue 1: "Unexpected token '<', "<!doctype "..."

**Cause**: The API is returning HTML (error page) instead of JSON.

**Solutions**:
1. Check that `VITE_API_URL` in Vercel is correct
2. Verify the API URL is accessible: `https://yourusername.pythonanywhere.com/api/`
3. Check PythonAnywhere error logs for backend issues
4. Ensure the URL ends with `/api` (no trailing slash in env var)

### Issue 2: CORS Error

**Cause**: Your Vercel domain is not in the allowed origins list.

**Solutions**:
1. Add your Vercel domain to `CORS_ALLOWED_ORIGINS` in Django settings
2. Or set `CORS_EXTRA_ORIGINS` environment variable in PythonAnywhere
3. Restart your PythonAnywhere web app after changing settings

### Issue 3: 404 on API Endpoints

**Cause**: URL routing is incorrect.

**Solutions**:
1. Verify `path('api/', include('fact_app.urls'))` is in main `urls.py`
2. Check that your PythonAnywhere web app is configured to serve from the correct path
3. Test the API URL directly in browser: `https://yourusername.pythonanywhere.com/api/auth/login/`

### Issue 4: 500 Internal Server Error

**Cause**: Backend server error.

**Solutions**:
1. Check PythonAnywhere error logs
2. Verify database connection
3. Check that all migrations are applied: `python manage.py migrate`
4. Ensure `DEBUG = False` in production (but check error logs for details)

## Local Development

Local development should still work with:
- Backend: `http://127.0.0.1:8000/api`
- Frontend: `http://localhost:5173`

The code automatically falls back to local URLs when `VITE_API_URL` is not set.

## Security Notes

1. **Never commit** `.env` files or `SECRET_KEY` to Git
2. Use environment variables for sensitive data
3. Keep `DEBUG = False` in production
4. Use HTTPS in production (Vercel and PythonAnywhere both provide this)
5. Regularly update dependencies for security patches

## Verification Checklist

- [ ] Backend API is accessible at `https://yourusername.pythonanywhere.com/api/`
- [ ] CORS is configured with your Vercel domain
- [ ] `VITE_API_URL` is set in Vercel environment variables
- [ ] Frontend builds successfully on Vercel
- [ ] Login works on production site
- [ ] No CORS errors in browser console
- [ ] API returns JSON (not HTML) for all endpoints

