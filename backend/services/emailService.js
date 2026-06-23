const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendTaskReminderEmail = async ({ to, taskTitle, dueDate }) => {
  const formattedDate = new Date(dueDate).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Reminder: "${taskTitle}" is due soon`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f8f5;border-radius:12px;">
        <h2 style="color:#01696f;margin-bottom:8px;">Task Reminder</h2>
        <p style="color:#28251d;font-size:16px;">Your task is due soon:</p>
        <div style="background:#fff;border:1px solid #dcd9d5;border-radius:8px;padding:16px;margin:16px 0;">
          <strong style="font-size:18px;color:#28251d;">${taskTitle}</strong>
          <p style="color:#7a7974;margin:8px 0 0;">Due: ${formattedDate}</p>
        </div>
        <p style="color:#7a7974;font-size:14px;">
          Log in to <a href="${process.env.FRONTEND_URL}" style="color:#01696f;">LifeOS</a> to manage your tasks.
        </p>
        <hr style="border:none;border-top:1px solid #dcd9d5;margin:24px 0;" />
        <p style="color:#bab9b4;font-size:12px;">You can change notification preferences in Settings.</p>
      </div>
    `,
  });
};

module.exports = { sendTaskReminderEmail };