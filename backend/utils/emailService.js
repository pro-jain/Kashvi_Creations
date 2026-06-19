import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify connection on startup so you know immediately if creds are wrong
transporter.verify((error) => {
  if (error) {
    console.error("❌ Email service error:", error.message);
  } else {
    console.log("✅ Email service ready");
  }
});

export const sendOrderConfirmationEmail = async (userEmail, orderData) => {
  try {
    const { orderId, items, totalAmount, address } = orderData;

    const itemsList = items
      .map(
        (item) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${item.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right">₹${(item.price * item.quantity).toLocaleString()}</td>
        </tr>`
      )
      .join("");

    const deliveryAddress = typeof address === "object"
      ? `${address.firstName} ${address.lastName}, ${address.street}, ${address.city}, ${address.state} - ${address.zipcode}`
      : address;

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#1a1a1a;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:2px">KASHVI CREATIONS</h1>
        </div>

        <div style="padding:32px 24px">
          <h2 style="margin:0 0 8px">Order Confirmed ✓</h2>
          <p style="color:#666;margin:0 0 24px">Thank you for shopping with us! Your order is being processed.</p>

          <div style="background:#f9f9f9;padding:16px;border-radius:8px;margin-bottom:24px">
            <p style="margin:0;font-size:13px;color:#888">ORDER ID</p>
            <p style="margin:4px 0 0;font-weight:bold;font-size:15px">${orderId}</p>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <thead>
              <tr style="background:#f0f0f0">
                <th style="padding:10px 12px;text-align:left;font-size:13px">Item</th>
                <th style="padding:10px 12px;text-align:center;font-size:13px">Qty</th>
                <th style="padding:10px 12px;text-align:right;font-size:13px">Price</th>
              </tr>
            </thead>
            <tbody>${itemsList}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:12px;font-weight:bold;text-align:right">Total</td>
                <td style="padding:12px;font-weight:bold;text-align:right;font-size:16px">₹${Number(totalAmount).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          <div style="border-left:3px solid #1a1a1a;padding-left:16px;margin-bottom:24px">
            <p style="margin:0;font-size:13px;color:#888">DELIVERY ADDRESS</p>
            <p style="margin:4px 0 0">${deliveryAddress}</p>
          </div>

          <p style="color:#666;font-size:14px">We'll notify you when your order is shipped.</p>
        </div>

        <div style="background:#f9f9f9;padding:16px;text-align:center;font-size:12px;color:#999">
          © 2026 Kashvi Creations. All rights reserved.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Kashvi Creations" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Order Confirmed — #${orderId}`,
      html: htmlContent,
    });

    console.log(`✅ Confirmation email sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending confirmation email:", error.message);
    // intentionally not throwing — email failure shouldn't break the order flow
  }
};

export const sendOrderStatusEmail = async (userEmail, orderId, status) => {
  try {
    const statusMessages = {
      confirmed: { text: "Your order has been confirmed!", color: "#16a34a" },
      shipped:   { text: "Your order is on its way!", color: "#2563eb" },
      delivered: { text: "Your order has been delivered!", color: "#16a34a" },
      cancelled: { text: "Your order has been cancelled.", color: "#dc2626" },
    };

    const { text, color } = statusMessages[status] || {
      text: "Your order status has been updated.",
      color: "#333",
    };

    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#1a1a1a;padding:24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:2px">KASHVI CREATIONS</h1>
        </div>
        <div style="padding:32px 24px">
          <h2 style="color:${color};margin:0 0 8px">${text}</h2>
          <p style="color:#666">Order ID: <strong>${orderId}</strong></p>
          <p style="color:#666">Status: <strong style="color:${color}">${status.toUpperCase()}</strong></p>
        </div>
        <div style="background:#f9f9f9;padding:16px;text-align:center;font-size:12px;color:#999">
          © 2026 Kashvi Creations. All rights reserved.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Kashvi Creations" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Order ${status.charAt(0).toUpperCase() + status.slice(1)} — #${orderId}`,
      html: htmlContent,
    });

    console.log(`✅ Status email sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending status email:", error.message);
  }
};