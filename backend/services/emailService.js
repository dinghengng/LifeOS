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

const sendGoalDeadlineEmail = async ({ to, goalTitle, daysLeft }) => {
  const dayLabel = daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`;
  return resend.emails.send({
    from: process.env.EMAIL_FROM, to,
    subject: `Goal deadline: "${goalTitle}" is due ${dayLabel}`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f8f5;border-radius:12px;">
      <h2 style="color:#01696f;">Goal Deadline Approaching</h2>
      <p style="color:#28251d;font-size:16px;">Your goal is due ${dayLabel}:</p>
      <div style="background:#fff;border:1px solid #dcd9d5;border-radius:8px;padding:16px;margin:16px 0;">
        <strong style="font-size:18px;color:#28251d;">${goalTitle}</strong>
      </div>
      <p style="color:#7a7974;font-size:14px;">Log in to <a href="${process.env.FRONTEND_URL}" style="color:#01696f;">LifeOS</a> to update your progress.</p>
      <hr style="border:none;border-top:1px solid #dcd9d5;margin:24px 0;" />
      <p style="color:#bab9b4;font-size:12px;">You can change notification preferences in Settings.</p>
    </div>`,
  });
};

const sendStreakRiskEmail = async ({ to, habitName, streak }) => {
  return resend.emails.send({
    from: process.env.EMAIL_FROM, to,
    subject: `Your ${streak}-day streak is at risk!`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f8f5;border-radius:12px;">
      <h2 style="color:#01696f;">Streak at Risk!</h2>
      <p style="color:#28251d;font-size:16px;">Log <strong>${habitName}</strong> before midnight to keep your <strong>${streak}-day streak</strong> alive.</p>
      <a href="${process.env.FRONTEND_URL}/habits" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#01696f;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Log Now</a>
      <hr style="border:none;border-top:1px solid #dcd9d5;margin:24px 0;" />
      <p style="color:#bab9b4;font-size:12px;">You can change notification preferences in Settings.</p>
    </div>`,
  });
};

const sendStreakMilestoneEmail = async ({ to, habitName, streak }) => {
  return resend.emails.send({
    from: process.env.EMAIL_FROM, to,
    subject: `${streak}-day streak on "${habitName}"!`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f8f5;border-radius:12px;">
      <h2 style="color:#01696f;">Milestone Reached!</h2>
      <p style="color:#28251d;font-size:16px;">You've hit a <strong>${streak}-day streak</strong> on <strong>${habitName}</strong>. Keep it up!</p>
      <hr style="border:none;border-top:1px solid #dcd9d5;margin:24px 0;" />
      <p style="color:#bab9b4;font-size:12px;">You can change notification preferences in Settings.</p>
    </div>`,
  });
};

const sendJournalNudgeEmail = async ({ to }) => {
  return resend.emails.send({
    from: process.env.EMAIL_FROM, to,
    subject: `Your daily journal is waiting`,
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f9f8f5;border-radius:12px;">
      <h2 style="color:#01696f;">Daily Journal 📝</h2>
      <p style="color:#28251d;font-size:16px;">You haven't written anything today. Take 2 minutes to reflect.</p>
      <a href="${process.env.FRONTEND_URL}/journal" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#01696f;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Write Now</a>
      <hr style="border:none;border-top:1px solid #dcd9d5;margin:24px 0;" />
      <p style="color:#bab9b4;font-size:12px;">You can change notification preferences in Settings.</p>
    </div>`,
  });
};

module.exports = { sendTaskReminderEmail, sendGoalDeadlineEmail, sendStreakRiskEmail, sendStreakMilestoneEmail, sendJournalNudgeEmail, };