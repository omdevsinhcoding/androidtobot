import { Telegraf, session, Scenes, Markup, Context } from "telegraf";
import { db, User } from "../db/index.js";

interface MyContext extends Context {
  scene: Scenes.SceneContextScene<MyContext, Scenes.WizardSessionData>;
  wizard: Scenes.WizardContextWizard<MyContext>;
}

// Dynamic variables loaded during setupBot
let bot: Telegraf<MyContext> | null = null;
let APPROVAL_CHANNEL_ID = "";
let MINI_APP_URL = "";

async function isAdmin(telegramId: number): Promise<boolean> {
  const { rows } = await db.query('SELECT 1 FROM admins WHERE telegram_id = $1', [telegramId]);
  return rows.length > 0;
}

// === REGISTRATION WIZARD ===
const registrationWizard = new Scenes.WizardScene<MyContext>(
  'REGISTRATION_WIZARD',
  async (ctx) => {
    await ctx.reply("👋 Let's get you registered!\nPlease enter your full name:");
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const name = ctx.message.text.trim();
    if (name.length > 50 || /\d/.test(name)) {
      await ctx.reply("Invalid name. Please enter your full name (letters only):");
      return;
    }
    (ctx.wizard.state as any).fullName = name;
    await ctx.reply("Enter your WhatsApp number (with country code, e.g. +91XXXXXXXXXX):");
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) return;
    const whatsapp = ctx.message.text.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(whatsapp)) {
      await ctx.reply("Invalid format. Enter your WhatsApp number (e.g. +91XXXXXXXXXX):");
      return;
    }
    (ctx.wizard.state as any).whatsapp = whatsapp;
    (ctx.wizard.state as any).services = new Set<string>();
    
    await sendServiceSelection(ctx);
    return ctx.wizard.next();
  },
  async (ctx) => {
    if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;
      const state = ctx.wizard.state as any;
      if (data.startsWith('toggle_')) {
        const service = data.replace('toggle_', '');
        if (state.services.has(service)) state.services.delete(service);
        else state.services.add(service);
        await updateServiceSelection(ctx);
        return;
      } else if (data === 'done_selection') {
        if (state.services.size === 0) {
          await ctx.answerCbQuery("Please select at least one service.");
          return;
        }
        await ctx.answerCbQuery();
        const servicesStr = Array.from(state.services).join(', ');
        await ctx.editMessageText(`📋 **Summary:**\nName: ${state.fullName}\nWhatsApp: ${state.whatsapp}\nServices: ${servicesStr}`, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback("Submit Request", "submit_request")],
            [Markup.button.callback("Edit", "edit_request")]
          ])
        });
        return ctx.wizard.next();
      }
    }
  },
  async (ctx) => {
    if (ctx.callbackQuery && 'data' in ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;
      if (data === 'edit_request') {
        await ctx.answerCbQuery();
        await ctx.scene.reenter();
      } else if (data === 'submit_request') {
        const state = ctx.wizard.state as any;
        const tgId = ctx.from?.id!;
        const username = ctx.from?.username || null;
        
        try {
          await db.query(`
            INSERT INTO users (telegram_id, telegram_username, full_name, whatsapp, status, requested_services)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT(telegram_id) DO UPDATE SET
              full_name = excluded.full_name,
              whatsapp = excluded.whatsapp,
              status = 'pending',
              requested_services = excluded.requested_services
          `, [tgId, username, state.fullName, state.whatsapp, 'pending', JSON.stringify(Array.from(state.services))]);
          
          await ctx.editMessageText("✅ Request submitted! You'll be notified once approved.");
          
          // Send to approval channel, otherwise approve directly for convenience
          if (APPROVAL_CHANNEL_ID) {
            const dateStr = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
            const servicesStr = Array.from(state.services).join(', ');
            await bot?.telegram.sendMessage(APPROVAL_CHANNEL_ID, 
`━━━━━━━━━━━━━━━━━━━━━━━━
🆕 NEW ACCESS REQUEST
━━━━━━━━━━━━━━━━━━━━━━━━
👤 Name:        ${state.fullName}
📱 WhatsApp:    ${state.whatsapp}
🆔 Telegram ID: ${tgId}
🕐 Submitted:   ${dateStr}

📋 Requested Services:
  • ${Array.from(state.services).join('\n  • ')}
━━━━━━━━━━━━━━━━━━━━━━━━`, Markup.inlineKeyboard([
              [Markup.button.callback("✅ Approve", `approve_init_${tgId}`), Markup.button.callback("❌ Reject", `reject_${tgId}`)]
            ]));
          } else {
             // Fallback if no channel id set, automatically approve
             const requestedArr = Array.from(state.services);
             await db.query(`UPDATE users SET status = 'approved', assigned_services = $1, approved_at = CURRENT_TIMESTAMP WHERE telegram_id = $2`, [JSON.stringify(requestedArr), tgId]);
             await bot?.telegram.sendMessage(tgId, `🎉 Your request has been automatically approved because no admin channel is set!\nType /start to open.`);
             await ctx.editMessageText("✅ Request submitted and automatically approved! Type /start to begin.");
          }
        } catch (e) {
          console.error(e);
          await ctx.editMessageText("An error occurred. Please try again later.");
        }
        return ctx.scene.leave();
      }
    }
  }
);

const serviceList = ["Amazon OTP", "SonyLiv OTP", "Hotstar OTP", "Netflix OTP", "JioCinema OTP", "All OTPs"];

async function sendServiceSelection(ctx: any) {
  const keyboard = getServiceSelectionKeyboard((ctx.wizard.state as any).services);
  await ctx.reply("Select the OTP services you need:\n(Click to toggle, then click Done)", keyboard);
}

async function updateServiceSelection(ctx: any) {
  const keyboard = getServiceSelectionKeyboard((ctx.wizard.state as any).services);
  await ctx.editMessageText("Select the OTP services you need:\n(Click to toggle, then click Done)", keyboard);
}

function getServiceSelectionKeyboard(selected: Set<string>) {
  const buttons = serviceList.map(s => [
    Markup.button.callback(`${selected.has(s) ? '✅' : '☐'} ${s}`, `toggle_${s}`)
  ]);
  buttons.push([Markup.button.callback("✅ Done", "done_selection")]);
  return Markup.inlineKeyboard(buttons);
}

const stage = new Scenes.Stage<MyContext>([registrationWizard]);

const adminTempState: Record<string, Set<string>> = {};

function initBotComands() {
  if (!bot) return;

  bot.use(session());
  bot.use(stage.middleware());

  bot.start(async (ctx) => {
    const { rows } = await db.query('SELECT * FROM users WHERE telegram_id = $1', [ctx.from.id]);
    const user = rows[0] as User | undefined;
    
    if (!user || user.status === 'banned') {
      return ctx.scene.enter('REGISTRATION_WIZARD');
    }

    if (user.status === 'pending') {
      return ctx.reply("⏳ Your request is still pending admin approval. Please wait.");
    } else if (user.status === 'rejected') {
      return ctx.reply("❌ Your request to access OTP Vault was rejected.");
    } else if (user.status === 'approved') {
      const assigned = JSON.parse(user.assigned_services || '[]');
      let buttons = [];
      if (assigned.includes('All OTPs')) {
        buttons.push([Markup.button.webApp("🌐 Open OTP Web App", MINI_APP_URL)]);
      } else {
        assigned.forEach((s: string) => {
          let icon = "📦";
          if (s.includes("SonyLiv")) icon = "🎬";
          if (s.includes("Hotstar")) icon = "✨";
          if (s.includes("Netflix")) icon = "🍿";
          buttons.push([Markup.button.callback(`${icon} ${s}`, `fetch_${s}`)]);
        });
      }
      
      return ctx.reply(`👋 Hello, ${ctx.from.first_name}!\nHere are your access points:`, Markup.inlineKeyboard(buttons));
    }
  });

  bot.command('admin', async (ctx) => {
    if (!(await isAdmin(ctx.from.id))) return;
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback("👥 All Users", "admin_all_users"), Markup.button.callback("✅ Approved Users", "admin_approved")],
      [Markup.button.callback("⏳ Pending Users", "admin_pending"), Markup.button.callback("❌ Rejected", "admin_rejected")],
      [Markup.button.callback("📊 Stats", "admin_stats"), Markup.button.callback("📢 Broadcast", "admin_broadcast")]
    ]);
    await ctx.reply("🛠 Admin Panel\n━━━━━━━━━━━━━━", keyboard);
  });

  bot.action('admin_pending', async (ctx) => {
    if (!(await isAdmin(ctx.from?.id!))) return ctx.answerCbQuery("Not authorized", { show_alert: true });
    
    try {
      const { rows } = await db.query("SELECT * FROM users WHERE status = 'pending'");
      if (rows.length === 0) {
        return ctx.answerCbQuery("No pending requests right now!", { show_alert: true });
      }
      
      await ctx.answerCbQuery();
      for (const user of rows) {
        const requested = JSON.parse(user.requested_services || '[]').join(', ');
        const messageText = `⏳ **PENDING USER**:
👤 Name: ${user.full_name} (@${user.telegram_username || 'N/A'})
📱 WhatsApp: ${user.whatsapp}
🆔 Telegram ID: ${user.telegram_id}
📋 Requested: ${requested}`;

        await ctx.reply(messageText, Markup.inlineKeyboard([
          [Markup.button.callback("✅ Approve", `approve_init_${user.telegram_id}`), Markup.button.callback("❌ Reject", `reject_${user.telegram_id}`)]
        ]));
      }
    } catch (e) {
      console.error(e);
      await ctx.answerCbQuery("Failed to fetch pending users");
    }
  });

  bot.action(/approve_init_(\d+)/, async (ctx) => {
    if (!(await isAdmin(ctx.from?.id!))) return ctx.answerCbQuery("Not authorized", { show_alert: true });
    const targetId = ctx.match[1];
    const { rows } = await db.query('SELECT * FROM users WHERE telegram_id = $1', [targetId]);
    const user = rows[0] as User;
    if (!user) return ctx.answerCbQuery("User not found");
    
    const requested = JSON.parse(user.requested_services || '[]') as string[];
    const buttons = requested.map(s => [Markup.button.callback(`${s}`, `assign_${targetId}_${s}`)]);
    buttons.push([Markup.button.callback("✅ Confirm Assignment", `confirm_assign_${targetId}`)]);
    
    await bot!.telegram.sendMessage(ctx.from!.id, `Which services to assign to ${user.full_name}?`, Markup.inlineKeyboard(buttons));
    await ctx.answerCbQuery("Sent selection to your DM");
  });

  bot.action(/reject_(\d+)/, async (ctx) => {
    if (!(await isAdmin(ctx.from?.id!))) return ctx.answerCbQuery("Not authorized");
    const targetId = ctx.match[1];
    await db.query('UPDATE users SET status = $1 WHERE telegram_id = $2', ['rejected', targetId]);
    try {
      await bot!.telegram.sendMessage(targetId, "❌ Your request was not approved.");
    } catch (e) {}
    const msgText = ctx.callbackQuery.message && 'text' in ctx.callbackQuery.message ? ctx.callbackQuery.message.text : '';
    await ctx.editMessageText(msgText + '\n\n❌ Rejected by @' + ctx.from?.username);
  });

  bot.action(/assign_(\d+)_(.*)/, async (ctx) => {
    const tgId = ctx.match[1];
    const service = ctx.match[2];
    if (!adminTempState[tgId]) adminTempState[tgId] = new Set();
    
    if (adminTempState[tgId].has(service)) adminTempState[tgId].delete(service);
    else adminTempState[tgId].add(service);
    
    await ctx.answerCbQuery(`Toggled ${service}`);
    
    const { rows } = await db.query('SELECT * FROM users WHERE telegram_id = $1', [tgId]);
    const targetUser = rows[0] as User;
    const requested = JSON.parse(targetUser.requested_services || '[]') as string[];
    const buttons = requested.map(s => [Markup.button.callback(`${adminTempState[tgId].has(s) ? '✅' : '☐'} ${s}`, `assign_${tgId}_${s}`)]);
    buttons.push([Markup.button.callback("✅ Confirm Assignment", `confirm_assign_${tgId}`)]);
    await ctx.editMessageReplyMarkup({ inline_keyboard: buttons });
  });

  bot.action(/confirm_assign_(\d+)/, async (ctx) => {
    const tgId = ctx.match[1];
    const assigned = Array.from(adminTempState[tgId] || []);
    if (assigned.length === 0) return ctx.answerCbQuery("Select at least one!");
    
    await db.query(`UPDATE users SET status = $1, assigned_services = $2, approved_at = CURRENT_TIMESTAMP, approved_by = $3 WHERE telegram_id = $4`,
      ['approved', JSON.stringify(assigned), ctx.from?.id, tgId]);
      
    delete adminTempState[tgId];
    
    await ctx.editMessageText(`✅ Assigned: ${assigned.join(', ')}`);
    try {
      await bot!.telegram.sendMessage(tgId, `🎉 You've been approved! assigned: ${assigned.join(', ')}.\nType /start to open.`);
    } catch(e) {}
  });
}

export async function setupBot() {
  try {
    const { rows } = await db.query("SELECT key, value FROM settings WHERE key IN ('BOT_TOKEN', 'MINI_APP_URL', 'APPROVAL_CHANNEL_ID')");
    const settings = rows.reduce((acc: any, row: any) => ({ ...acc, [row.key]: row.value }), {});
    
    const BOT_TOKEN = settings.BOT_TOKEN;
    if (!BOT_TOKEN) {
      throw new Error("CRITICAL ERROR: BOT_TOKEN is missing from the database settings table.");
    }
    console.log("✅ Using BOT_TOKEN from: Database");

    MINI_APP_URL = settings.MINI_APP_URL;
    if (!MINI_APP_URL) {
      throw new Error("CRITICAL ERROR: MINI_APP_URL is missing from the database settings table.");
    }
    console.log("✅ Using MINI_APP_URL from: Database ->", MINI_APP_URL);

    if (MINI_APP_URL.startsWith("http://")) {
      console.warn(`\n⚠️ WARNING: MINI_APP_URL starts with http:// (${MINI_APP_URL})`);
      console.warn("⚠️ Telegram requires all Web App URLs to be strictly HTTPS.");
      console.warn("⚠️ Auto-correcting to https:// and updating database...\n");
      MINI_APP_URL = MINI_APP_URL.replace("http://", "https://");
      
      try {
        await db.query("UPDATE settings SET value = $1 WHERE key = 'MINI_APP_URL'", [MINI_APP_URL]);
        console.log("✅ Database successfully updated to HTTPS.");
      } catch (dbErr) {
        console.error("Failed to update database schema for MINI_APP_URL:", dbErr);
      }
    }

    if (!MINI_APP_URL.startsWith("https://")) {
      console.error(`❌ CRITICAL ERROR: Web App URL must use https://. You provided: ${MINI_APP_URL}`);
      throw new Error(`Invalid MINI_APP_URL: ${MINI_APP_URL}`);
    }
    
    if (settings.APPROVAL_CHANNEL_ID) {
      APPROVAL_CHANNEL_ID = settings.APPROVAL_CHANNEL_ID;
      console.log("✅ Using APPROVAL_CHANNEL_ID from: Database");
    }
    
    bot = new Telegraf<MyContext>(BOT_TOKEN, { handlerTimeout: 9000000 });
      
      bot.catch((err, ctx) => {
        console.error(`Ooops, encountered an error for ${ctx.updateType}`, err);
      });
      
      initBotComands();
      
      bot.launch().catch((err: any) => {
        if (err?.response?.error_code === 409) {
          console.warn("\n⚠️ TELEGRAM CONFLICT: The bot is already running somewhere else (e.g., your VPS).");
          console.warn("⚠️ AI Studio will still run your web API, but Telegram polling will be handled by your VPS.\n");
        } else {
          console.error(err);
        }
      });
      console.log("Telegraf Bot started.");
      
      // Automatically configure the Menu Button to fix the 'Google Sign-In' AI Studio URL issue.
      if (MINI_APP_URL.startsWith("https://")) {
        bot.telegram.setChatMenuButton({
          menuButton: {
            type: "web_app",
            text: "Launch 🚀",
            web_app: { url: MINI_APP_URL }
          }
        }).then(() => {
          console.log(`✅ Telegram Main Menu Button configured to point to: ${MINI_APP_URL}`);
        }).catch(err => {
          console.error("⚠️ Failed to update Telegram Menu Button URL:", err.message);
        });
      }
  } catch (err) {
    console.error("Failed to setup bot:", err);
  }
}
