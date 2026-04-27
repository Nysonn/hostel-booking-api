import { resend } from "../config/resend";

const FROM = process.env.RESEND_FROM_EMAIL ?? "Hostel Booking <hostel-booking@campuscare.me>";

// ---------------------------------------------------------------------------
// University emails
// ---------------------------------------------------------------------------

export async function sendUniversityWelcomeEmail(params: {
  to: string;
  universityName: string;
  temporaryPassword: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: "Welcome to Hostel Booking — University Account Created",
    html: `
      <h2>Welcome, ${params.universityName}!</h2>
      <p>Your university account has been created on the Hostel Booking platform.</p>
      <p><strong>Email:</strong> ${params.to}</p>
      <p><strong>Temporary Password:</strong> ${params.temporaryPassword}</p>
      <p>Please log in and change your password immediately.</p>
      <br/>
      <p>Regards,<br/>Hostel Booking Team</p>
    `,
  });
}

// ---------------------------------------------------------------------------
// Landlord emails
// ---------------------------------------------------------------------------

export async function sendLandlordRegistrationEmail(params: {
  to: string;
  fullName: string;
  landlordCode: string;
  temporaryPassword: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: "Landlord Account Approved — Your Credentials",
    html: `
      <h2>Hello, ${params.fullName}!</h2>
      <p>Your landlord account has been approved. Use the credentials below to log in.</p>
      <p><strong>Email:</strong> ${params.to}</p>
      <p><strong>Landlord Code:</strong> ${params.landlordCode}</p>
      <p><strong>Temporary Password:</strong> ${params.temporaryPassword}</p>
      <p>Please log in and change your password immediately.</p>
      <br/>
      <p>Regards,<br/>Hostel Booking Team</p>
    `,
  });
}

export async function sendBookingNotificationToLandlord(params: {
  to: string;
  landlordName: string;
  studentName: string;
  hostelName: string;
  roomType: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: "New Booking — One of Your Rooms Has Been Booked",
    html: `
      <h2>Hello, ${params.landlordName}!</h2>
      <p>A student has booked a room in one of your hostels.</p>
      <ul>
        <li><strong>Student:</strong> ${params.studentName}</li>
        <li><strong>Hostel:</strong> ${params.hostelName}</li>
        <li><strong>Room Type:</strong> ${params.roomType}</li>
      </ul>
      <p>Log in to your dashboard for full details.</p>
      <br/>
      <p>Regards,<br/>Hostel Booking Team</p>
    `,
  });
}

export async function sendPaymentNotificationToLandlord(params: {
  to: string;
  landlordName: string;
  studentName: string;
  amount: string;
  paymentType: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: "Payment Received for Your Hostel",
    html: `
      <h2>Hello, ${params.landlordName}!</h2>
      <p>A payment has been made for a room booking in one of your hostels.</p>
      <ul>
        <li><strong>Student:</strong> ${params.studentName}</li>
        <li><strong>Amount:</strong> ${params.amount}</li>
        <li><strong>Payment Type:</strong> ${params.paymentType}</li>
      </ul>
      <p>Log in to your dashboard for full details.</p>
      <br/>
      <p>Regards,<br/>Hostel Booking Team</p>
    `,
  });
}

export async function sendTerminationNotificationToLandlord(params: {
  to: string;
  landlordName: string;
  studentName: string;
  hostelName: string;
  roomType: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: "Booking Terminated — Room Now Available",
    html: `
      <h2>Hello, ${params.landlordName}!</h2>
      <p>A student's booking in one of your hostels has been terminated.</p>
      <ul>
        <li><strong>Student:</strong> ${params.studentName}</li>
        <li><strong>Hostel:</strong> ${params.hostelName}</li>
        <li><strong>Room Type:</strong> ${params.roomType}</li>
      </ul>
      <p>The room slot has been freed up and is available for new bookings.</p>
      <br/>
      <p>Regards,<br/>Hostel Booking Team</p>
    `,
  });
}

// ---------------------------------------------------------------------------
// Student emails
// ---------------------------------------------------------------------------

export async function sendBookingConfirmationEmail(params: {
  to: string;
  studentName: string;
  hostelName: string;
  roomType: string;
  price: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: "Booking Confirmed!",
    html: `
      <h2>Hello, ${params.studentName}!</h2>
      <p>Your room booking has been confirmed. Here are your booking details:</p>
      <ul>
        <li><strong>Hostel:</strong> ${params.hostelName}</li>
        <li><strong>Room Type:</strong> ${params.roomType}</li>
        <li><strong>Price:</strong> ${params.price}</li>
      </ul>
      <p>Please proceed to make payment to secure your slot.</p>
      <br/>
      <p>Regards,<br/>Hostel Booking Team</p>
    `,
  });
}

export async function sendPaymentConfirmationEmail(params: {
  to: string;
  studentName: string;
  amount: string;
  paymentType: string;
  paymentMethod: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: "Payment Successful!",
    html: `
      <h2>Hello, ${params.studentName}!</h2>
      <p>Your payment has been received successfully.</p>
      <ul>
        <li><strong>Amount:</strong> ${params.amount}</li>
        <li><strong>Payment Type:</strong> ${params.paymentType}</li>
        <li><strong>Payment Method:</strong> ${params.paymentMethod}</li>
      </ul>
      <p>Your room slot is now secured. Enjoy your stay!</p>
      <br/>
      <p>Regards,<br/>Hostel Booking Team</p>
    `,
  });
}

export async function sendTerminationConfirmationEmail(params: {
  to: string;
  studentName: string;
  hostelName: string;
  roomType: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: params.to,
    subject: "Booking Terminated",
    html: `
      <h2>Hello, ${params.studentName}!</h2>
      <p>Your booking has been terminated. Here are the details:</p>
      <ul>
        <li><strong>Hostel:</strong> ${params.hostelName}</li>
        <li><strong>Room Type:</strong> ${params.roomType}</li>
      </ul>
      <p>If you believe this was done in error, please contact support.</p>
      <br/>
      <p>Regards,<br/>Hostel Booking Team</p>
    `,
  });
}
