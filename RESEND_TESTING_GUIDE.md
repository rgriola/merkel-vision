# 🧪 Testing Resend Email Locally

## ✅ Current Configuration

Your `.env.local` is now configured for **Resend**:

```bash
EMAIL_SERVICE="resend"
EMAIL_API_KEY="re_RdrdiRUi_CkQx4pPcrMVxvC71pvqng6u1"
EMAIL_MODE="development"  # Currently logs to console
EMAIL_FROM_ADDRESS="onboarding@resend.dev"  # Resend test domain
EMAIL_FROM_NAME="Google Search Me"
```

---

## 🎯 Two Testing Modes

### **Mode 1: Console Logging (Current)**
- `EMAIL_MODE="development"`
- Emails are **logged to terminal console**
- **No actual emails sent** (safe for testing)
- Perfect for debugging email templates

### **Mode 2: Actually Send Emails**
- `EMAIL_MODE="production"`
- Emails are **sent via Resend API**
- You'll receive **real emails** in your inbox
- Can track delivery in Resend dashboard

---

## 📧 How to Test Email Sending

### **Test 1: User Registration (Email Verification)**

1. **Open your app**: http://localhost:3000

2. **Go to Sign Up page**: http://localhost:3000/register

3. **Register a new user**:
   - Username: `testuser123`
   - Email: **YOUR_REAL_EMAIL** (where you want to receive the test)
   - Password: `Test1234!`

4. **Watch the terminal console**:
   - In development mode: You'll see the email logged
   - In production mode: Email will be sent to your address

5. **Check Resend Dashboard**: https://resend.com/emails
   - View delivery status
   - See the email content
   - Check for any errors

---

### **Test 2: Password Reset**

1. **Go to Forgot Password**: http://localhost:3000/forgot-password

2. **Enter your email address**

3. **Check console/inbox** depending on `EMAIL_MODE`

4. **Verify the reset link works**

---

### **Test 3: Password Changed Notification**

1. **Login to your account**

2. **Go to Settings** → **Change Password**

3. **Change your password**

4. **Check for notification email**

---

## 🔄 Switching Between Modes

### To Actually Send Emails (receive in your inbox):

**Update `.env.local`:**
```bash
EMAIL_MODE="production"  # ← Change this line
```

**Restart server:**
```bash
# Press Ctrl+C in terminal, then:
npm run dev
```

### To Go Back to Console Logging:

**Update `.env.local`:**
```bash
EMAIL_MODE="development"  # ← Change back
```

**Restart server** (same as above)

---

## 📊 Monitoring Resend

### Resend Dashboard: https://resend.com/emails

You can see:
- ✅ Delivered emails
- ❌ Failed emails
- 📈 Delivery rates
- 🔍 Email content preview
- 📧 Logs and errors

**Note:** `onboarding@resend.dev` can only send to email addresses you've verified in Resend (usually your own email).

---

## ✅ Verification Checklist

Test each email type:

- [ ] **Registration email sent** (verification link)
- [ ] **Verification link works** (clicks activate account)
- [ ] **Password reset email sent**
- [ ] **Reset link works** (can change password)
- [ ] **Password changed notification sent**
- [ ] **All emails visible in Resend dashboard**
- [ ] **No errors in terminal console**

---

## 🐛 Troubleshooting

### "Email send error" in console
- ✅ Check API key is correct
- ✅ Verify `EMAIL_SERVICE="resend"`
- ✅ Check Resend dashboard for error details

### Email not received (when EMAIL_MODE="production")
- ✅ Check spam folder
- ✅ Verify email address used is YOUR email
- ✅ Check Resend dashboard for delivery status
- ✅ `onboarding@resend.dev` can only send to verified addresses

### "Resend API key is not configured" error
- ✅ Check `EMAIL_API_KEY` is set in `.env.local`
- ✅ Restart the dev server
- ✅ No quotes issues in `.env.local`

---

## 🎯 Next Steps

1. **Test in console mode first** (current setup)
   - Verify email templates look good
   - Check all links work correctly

2. **Switch to production mode** (`EMAIL_MODE="production"`)
   - Send real test emails to yourself
   - Verify delivery in Resend dashboard

3. **Once comfortable:**
   - Keep this for local testing
   - You're ready for production deployment!

---

## 🔙 Reverting to Mailtrap

If you want to go back to Mailtrap:

**Update `.env.local`:**
```bash
# Email Configuration - MAILTRAP
EMAIL_SERVICE="mailtrap"
EMAIL_HOST="sandbox.smtp.mailtrap.io"
EMAIL_PORT="2525"
EMAIL_USER="e61052be8f5ea6"
EMAIL_PASS="34dc22b24e84eb"
EMAIL_MODE="development"
EMAIL_FROM_NAME="Development"
EMAIL_FROM_ADDRESS="dev@example.com"

# Comment out Resend settings
# EMAIL_API_KEY="re_RdrdiRUi_CkQx4pPcrMVxvC71pvqng6u1"
# EMAIL_FROM_ADDRESS="onboarding@resend.dev"
```

**Restart server**: `npm run dev`

---

**Ready to test!** 🚀

Start with **Mode 1** (console logging) to see the emails in terminal, then switch to **Mode 2** to send real emails!
