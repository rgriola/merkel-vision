# Slack API Integration Plan for Merkel Vision

**Date**: December 24, 2024  
**Purpose**: Integration strategy for Slack API in location scouting application

---

## ✅ Yes, Slack Integration is Highly Recommended!

Slack integration is **perfect** for a production/film location scouting app like Merkel Vision. Here's why and how:

---

## 🎯 Best Use Cases for Your App

### **1. Location Sharing** 📍
**Use Case**: Share saved locations with your production team via Slack

**User Flow**:
```
User clicks location → "Share" button → Choose Slack channel → 
Location card posted to Slack with:
  • Photo
  • Address
  • Map link
  • Production notes
  • Parking info
  • Contact details
```

**Value**: Instant team collaboration, no need to leave the app

---

### **2. Team Notifications** 🔔
**Use Case**: Notify team members when locations are added/updated

**Examples**:
- "New INTERVIEW location added: Empire State Building"
- "Location updated: Central Park - permit approved ✅"
- "Photo added to Times Square location"
- "Friend shared 3 new BROLL locations with you"

**Value**: Keep entire production team in sync

---

### **3. Production Alerts** 🎬
**Use Case**: Critical location updates during production

**Examples**:
- "⚠️ Road closure at shoot location - check alternative"
- "Permit approved for tomorrow's shoot at Location #42"
- "Weather update for outdoor locations this weekend"

**Value**: Real-time production coordination

---

### **4. Scout Reports** 📊
**Use Case**: Daily/weekly location scouting summaries

**Example**:
```
Daily Scout Report - Dec 24, 2024
📍 5 new locations added
🎬 3 STORY locations
📸 2 BROLL locations
⭐ Top rated: Brooklyn Bridge (4.5/5)
```

**Value**: Team visibility into scouting progress

---

### **5. Collaboration Comments** 💬
**Use Case**: Discuss locations directly in Slack threads

**Flow**:
1. Location shared to Slack channel
2. Team comments in Slack thread
3. Comments sync back to location notes (optional)

**Value**: Centralized discussion history

---

## 🔧 Slack API Integration Options

### **Option 1: Incoming Webhooks** (Easiest Start)
**Complexity**: ⭐ Easy  
**Setup Time**: 30 minutes  
**Capabilities**: Post messages to Slack  
**Best For**: Notifications, location sharing

**How It Works**:
```typescript
// POST to webhook URL
await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        text: "New location added!",
        blocks: [
            {
                type: "section",
                text: { type: "mrkdwn", text: "*Empire State Building*\n350 5th Ave, NYC" }
            }
        ]
    })
});
```

**Pros**: 
- ✅ Simple to implement
- ✅ No OAuth required
- ✅ Works immediately

**Cons**:
- ❌ One-way only (app → Slack)
- ❌ Can't read Slack messages

---

### **Option 2: Slack App with OAuth** (Full Integration)
**Complexity**: ⭐⭐⭐ Medium  
**Setup Time**: 2-3 hours  
**Capabilities**: Full bidirectional communication  
**Best For**: Complete integration with slash commands, reactions, etc.

**Features You Can Build**:
- `/location <name>` - Search locations from Slack
- `/scout-report` - Get daily summary
- React with 👍/👎 on location shares
- Read team comments back into app
- Post to any channel team has access to

**Pros**:
- ✅ Full control
- ✅ Bidirectional
- ✅ Rich interactions
- ✅ User authentication

**Cons**:
- ❌ More complex setup
- ❌ Requires OAuth flow
- ❌ Need Slack app approval

---

### **Option 3: Slack Bolt Framework** (Recommended)
**Complexity**: ⭐⭐ Medium  
**Setup Time**: 1-2 hours  
**Capabilities**: Official framework, best practices built-in  
**Best For**: Production-ready integration

**What You Get**:
- Built-in OAuth handling
- Event listeners
- Slash commands
- Interactive components
- Best practices enforced

**Example**:
```typescript
import { App } from '@slack/bolt';

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Listen for location share events
app.command('/share-location', async ({ command, ack, say }) => {
    await ack();
    // Share location to Slack
});
```

---

## 📋 Implementation Roadmap

### **Phase 1: Quick Win - Incoming Webhooks** (1-2 hours)

**Goal**: Share locations to Slack channel

**Steps**:
1. **Create Slack App** (15 min)
   - Go to api.slack.com/apps
   - Create new app
   - Add Incoming Webhook
   - Install to workspace

2. **Add Webhook URL to .env** (5 min)
   ```bash
   SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX"
   ```

3. **Create Slack Service** (30 min)
   ```typescript
   // src/lib/slack.ts
   export async function shareLocationToSlack(location: Location) {
       const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
               blocks: [/* location card */]
           })
       });
   }
   ```

4. **Add Share Button to UI** (15 min)
   - Add to LocationCard
   - Add to InfoWindow
   - Add to Location details page

5. **Test & Deploy** (15 min)

**Result**: ✅ Users can share locations to Slack!

---

### **Phase 2: Rich Messages** (2-3 hours)

**Goal**: Beautiful location cards in Slack

**Features**:
- 📸 Location photo
- 📍 Address with map link
- 🎬 Production details
- 🅿️ Parking info
- ⭐ Rating
- 🔗 "View in App" button

**Example Block Kit**:
```json
{
    "blocks": [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": "🎬 New Location: Empire State Building"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Type:* INTERVIEW\n*Address:* 350 5th Ave, NYC\n*Rating:* ⭐⭐⭐⭐☆"
            },
            "accessory": {
                "type": "image",
                "image_url": "https://ik.imagekit.io/...",
                "alt_text": "Location photo"
            }
        },
        {
            "type": "section",
            "fields": [
                { "type": "mrkdwn", "text": "*Parking:*\nStreet parking available" },
                { "type": "mrkdwn", "text": "*Access:*\nPublic building, 9-5" }
            ]
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": { "type": "plain_text", "text": "View in App" },
                    "url": "https://merkelvision.com/locations/123"
                },
                {
                    "type": "button",
                    "text": { "type": "plain_text", "text": "Get Directions" },
                    "url": "https://maps.google.com/?q=40.748,-73.985"
                }
            ]
        }
    ]
}
```

---

### **Phase 3: Team Notifications** (3-4 hours)

**Goal**: Automatic updates to team channel

**Triggers**:
- New location saved → Post to #locations
- Location updated → Post to #updates
- Photo added → Post to #media
- Friend shares location → DM to user

**Implementation**:
```typescript
// src/hooks/useSaveLocation.ts
const mutation = useMutation({
    mutationFn: saveLocationAPI,
    onSuccess: async (data) => {
        // Existing success logic...
        
        // Send Slack notification
        await fetch('/api/slack/notify', {
            method: 'POST',
            body: JSON.stringify({
                event: 'location_saved',
                location: data.location
            })
        });
    }
});
```

---

### **Phase 4: Slash Commands** (4-6 hours)

**Goal**: Control app from Slack

**Commands**:
- `/location search <query>` - Search locations
- `/location share <id>` - Share specific location
- `/scout-report` - Daily summary
- `/location nearby` - Locations near you
- `/location stats` - Your scouting stats

**Example**:
```typescript
// src/app/api/slack/commands/route.ts
export async function POST(request: Request) {
    const { command, text, user_id } = await request.json();
    
    if (command === '/location') {
        const [action, ...args] = text.split(' ');
        
        if (action === 'search') {
            const results = await searchLocations(args.join(' '));
            return slackResponse(formatLocationResults(results));
        }
    }
}
```

---

### **Phase 5: Interactive Features** (6-8 hours)

**Goal**: Two-way interaction

**Features**:
- React 👍/👎 on locations
- Vote on location options
- Approve/reject location requests
- Schedule scout visits from Slack
- Team availability polling

---

## 🛠️ Technical Implementation

### **Required Packages**

```bash
# Option 1: Manual (Webhooks)
npm install node-fetch  # Already have this

# Option 2: Slack SDK
npm install @slack/web-api

# Option 3: Slack Bolt (Recommended)
npm install @slack/bolt
```

### **Environment Variables**

```bash
# .env.local
# Slack Integration
SLACK_BOT_TOKEN="xoxb-your-bot-token"
SLACK_SIGNING_SECRET="your-signing-secret"
SLACK_CLIENT_ID="your-client-id"
SLACK_CLIENT_SECRET="your-client-secret"

# For webhooks (simpler start)
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
```

### **File Structure**

```
src/
├── lib/
│   └── slack.ts              # Core Slack utilities
├── app/
│   └── api/
│       └── slack/
│           ├── share/route.ts       # Share location endpoint
│           ├── notify/route.ts      # Notification endpoint
│           ├── webhook/route.ts     # Incoming webhooks
│           └── commands/route.ts    # Slash commands
└── components/
    └── slack/
        ├── ShareToSlackButton.tsx
        ├── SlackChannelSelector.tsx
        └── SlackNotificationSettings.tsx
```

---

## 💡 Specific Features for Your App

### **1. Share Location Button**
**Where**: LocationCard, InfoWindow, Location details  
**Action**: Opens modal to select Slack channel, then shares location

### **2. Auto-Share on Save**
**Where**: Save Location form  
**Action**: Checkbox "Share to #locations channel"

### **3. Production Team Workspace**
**Where**: Settings  
**Action**: Connect user's Slack workspace

### **4. Daily Scout Digest**
**Where**: Background job  
**Action**: Post daily summary at 6 PM

### **5. Location Discussion**
**Where**: Each location  
**Action**: "Discuss in Slack" button creates thread

---

## 🔒 Security Considerations

### **Best Practices**:
1. ✅ Store Slack tokens server-side only
2. ✅ Validate Slack signatures on incoming webhooks
3. ✅ Use OAuth for user authorization
4. ✅ Don't expose sensitive location data publicly
5. ✅ Allow users to disconn Slack anytime
6. ✅ Respect Slack rate limits

### **User Permissions**:
```typescript
// Only share to channels user has access to
// Don't auto-share without user consent
// Respect team privacy settings
```

---

## 📊 Quick Start (30-Minute MVP)

### **Goal**: Share one location to Slack

1. **Create Slack Webhook** (10 min)
   - Go to api.slack.com/apps → Create App
   - Add Incoming Webhook
   - Copy webhook URL

2. **Add Environment Variable** (2 min)
   ```bash
   SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
   ```

3. **Create Share Function** (10 min)
   ```typescript
   // src/lib/slack.ts
   export async function shareToSlack(location: Location) {
       await fetch(process.env.SLACK_WEBHOOK_URL!, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
               text: `📍 New Location: ${location.name}\n${location.address}`
           })
       });
   }
   ```

4. **Add Share Button** (5 min)
   ```typescript
   <Button onClick={() => shareToSlack(location)}>
       Share to Slack
   </Button>
   ```

5. **Test!** (3 min)

**Result**: ✅ Working Slack integration in 30 minutes!

---

## 🎯 Recommendation

**Start Simple, Scale Up**:

**Week 1**: Incoming Webhooks (share locations)  
**Week 2**: Rich message formatting (location cards)  
**Week 3**: Team notifications (auto-share on save)  
**Week 4**: Slash commands (control from Slack)  
**Month 2**: Full bidirectional integration

---

## 📚 Resources

**Slack Documentation**:
- [Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Block Kit Builder](https://app.slack.com/block-kit-builder)
- [Bolt Framework](https://slack.dev/bolt-js/)
- [Web API Methods](https://api.slack.com/methods)

**Tutorials**:
- [Building Your First Slack App](https://api.slack.com/start/building)
- [Next.js + Slack Integration](https://github.com/slackapi/bolt-js/tree/main/examples)

---

## ✅ Summary

**Can you integrate Slack?** → **YES! And you should!**

**Best Approach**:
1. Start with Incoming Webhooks (30 min setup)
2. Add rich message formatting (2-3 hours)
3. Implement team notifications (automatic shares)
4. Scale to full Slack Bolt integration when ready

**Perfect Use Cases for Merkel Vision**:
- Share locations with production team
- Notify team of new scout finds
- Collaborate on location selection
- Daily scouting reports
- Production alerts and updates

**ROI**: High - Production teams use Slack heavily, this would be a killer feature!

---

**Ready to implement? I can help build any of these features!** 🚀
