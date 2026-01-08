import { Resend } from "resend";
import { auth } from "@clerk/nextjs/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, type, userEmail } = await request.json();

    if (!message || !message.trim()) {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    // Send email to your email
    const result = await resend.emails.send({
      from: "CookAI Feedback <onboarding@resend.dev>",
      to: "harshitdagar913@gmail.com", // Your email
      subject: `New Feedback from CookAI - ${type || "General"}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; margin-bottom: 20px;">New User Feedback</h2>
            
            <div style="margin-bottom: 15px;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                <strong>Type:</strong> ${type || "General"}
              </p>
            </div>

            <div style="margin-bottom: 15px;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                <strong>User Email:</strong> ${userEmail || "Not provided"}
              </p>
            </div>

            <div style="margin-bottom: 15px;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                <strong>User ID:</strong> ${userId}
              </p>
            </div>

            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; border-left: 4px solid #ff8c00;">
              <p style="color: #333; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>

            <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
              <p style="margin: 0;">Sent from CookAI Feedback System</p>
            </div>
          </div>
        </div>
      `,
    });

    if (result.error) {
        console.error("Resend email error:", result.error);

        return Response.json(
            { error: "Failed to send email" },
            { status: 500 }
        );
    }

    return Response.json({
        success: true,
        message: "Email sent successfully",
    });

  } catch (error) {
    console.error("Feedback API Error:", error);
    return Response.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
