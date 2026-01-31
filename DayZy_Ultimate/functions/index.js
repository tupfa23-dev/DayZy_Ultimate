// --- ส่วนที่ต้องแก้ไข (ลบของเก่าออกให้หมดแล้วใช้แบบนี้แทน) ---
const functions = require("firebase-functions"); // ประกาศครั้งเดียวพอครับ
const admin = require("firebase-admin");
const sgMail = require("@sendgrid/mail");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
require("dotenv").config();

admin.initializeApp();
sgMail.setApiKey(process.env.SENDGRID_KEY);

const db = admin.firestore();

// ... โค้ดส่วนอื่นๆ (exports.sendProjectInviteEmail และ exports.addReplyAndNotify) คงเดิมไว้ได้เลย ...

// ===== Project Invite Email =====
exports.sendProjectInviteEmail = onDocumentUpdated(
  "projects/{projectId}",
  async (event) => {
    try {
      const before = event.data.before.data() || {};
      const after = event.data.after.data() || {};

      const addedInvites = (after.invites || []).filter(
        email => !(before.invites || []).includes(email)
      );

      if (addedInvites.length === 0) return null;

      const projectName = after.name || "โปรเจคของคุณ";

      const msgs = addedInvites.map(email => ({
        to: email,
        from: process.env.FROM_EMAIL,
        subject: `คุณถูกเชิญเข้าร่วมโปรเจค: ${projectName}`,
        text: `คุณถูกเชิญเข้าร่วมโปรเจค "${projectName}" ใน DayZy`,
        html: `<p>คุณถูกเชิญเข้าร่วมโปรเจค "<b>${projectName}</b>" ใน DayZy</p>`
      }));

      await sgMail.sendMultiple(msgs);
      console.log(`✅ ส่ง invite email ไปให้ ${addedInvites.length} คน`);
      return null;
    } catch (error) {
      console.error("❌ ส่ง invite email ล้มเหลว:", error);
      return null;
    }
  }
);

// ===== Support Ticket Reply Email =====
exports.addReplyAndNotify = functions.https.onCall(async (data, context) => {
  try {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "ต้องล็อกอินก่อน"
      );
    }

    const { ticketId, userEmail, subject, message } = data;

    if (!ticketId || !userEmail || !subject || !message) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ข้อมูลไม่ครบ"
      );
    }

    await db.collection("support_tickets").doc(ticketId).update({
      replies: admin.firestore.FieldValue.arrayUnion({
        from: "admin",
        message,
        timestamp: admin.firestore.Timestamp.now()
      }),
      lastReply: admin.firestore.Timestamp.now(),
      status: "in-progress"
    });

    await sgMail.send({
      to: userEmail,
      from: process.env.FROM_EMAIL,
      subject: `Re: ${subject}`,
      html: `<p>${message}</p>`
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Error:", error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "ส่งอีเมลไม่สำเร็จ"
    );
  }
});