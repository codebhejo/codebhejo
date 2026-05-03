export function signinLinkEmail({ link }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px">
      <h2>Sign in to CodeBhejo</h2>

      <p>Hello,</p>

      <p>Use the link below to sign in to your account.</p>

      <p>
        <a href="${link}">${link}</a>
      </p>

      <p style="margin-top: 20px">
        This link expires in <strong>15 minutes</strong>.
      </p>

      <p style="font-size: 12px; color: #666">
        If you didn’t request this, you can safely ignore this email.
      </p>

      <hr style="margin-top: 30px" />

      <p style="font-size: 12px; color: #999">
        CodeBhejo · no-reply@codebhejo.in
      </p>
    </div>
  `;
}